import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { start_date, end_date, days = 30 } = req.query

    // Calculate date range
    const endDate = end_date || new Date().toISOString().split('T')[0]
    const startDate =
      start_date || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Pull the raw records that we can aggregate locally. Relying on Supabase RPCs and
    // database views caused production 500s when those helpers weren't available in the
    // target environment. Fetching the base log table keeps the endpoint resilient while
    // still honouring the same date filters.
    const { data: treatments, error: treatmentsError } = await supabase
      .from('heat_treatment_log')
      .select('*')
      .gte('day_finished', startDate)
      .lte('day_finished', endDate)

    if (treatmentsError) throw treatmentsError

    const safeTreatments = Array.isArray(treatments) ? treatments : []

    // Helpers
    const parseNumber = (value) => {
      const num = parseFloat(value)
      return Number.isFinite(num) ? num : 0
    }

    const totalTreatments = safeTreatments.length
    const totalWeight = safeTreatments.reduce((sum, item) => sum + parseNumber(item.cast_weight), 0)
    const totalGas = safeTreatments.reduce((sum, item) => sum + parseNumber(item.gas_usage), 0)

    let totalBhn = 0
    let bhnCount = 0

    const partNumbers = new Set()
    const furnaceUsage = new Map()
    const loadTypeUsage = new Map()
    const materialUsage = new Map()
    const dailyUsage = new Map()

    const getRecordAvgBhn = (record) => {
      const hot = parseNumber(record.hot_end_bhn)
      const cold = parseNumber(record.cold_end_bhn)

      if (hot && cold) return (hot + cold) / 2
      if (hot) return hot
      if (cold) return cold
      return 0
    }

    const getRecordTotalTime = (record) =>
      [1, 2, 3, 4].reduce((acc, idx) => acc + parseNumber(record[`time${idx}_hours`]), 0)

    safeTreatments.forEach((record) => {
      if (record.part_number) {
        partNumbers.add(record.part_number)
      }

      const avgBhn = getRecordAvgBhn(record)
      if (avgBhn > 0) {
        totalBhn += avgBhn
        bhnCount += 1
      }

      const furnaceKey = record.furnace_number || 'Unknown'
      if (!furnaceUsage.has(furnaceKey)) {
        furnaceUsage.set(furnaceKey, {
          furnace_number: furnaceKey,
          total_treatments: 0,
          total_gas_usage: 0,
          total_time: 0
        })
      }
      const furnaceEntry = furnaceUsage.get(furnaceKey)
      furnaceEntry.total_treatments += 1
      furnaceEntry.total_gas_usage += parseNumber(record.gas_usage)
      furnaceEntry.total_time += getRecordTotalTime(record)

      const loadKey = record.load_type || 'Unknown'
      if (!loadTypeUsage.has(loadKey)) {
        loadTypeUsage.set(loadKey, {
          load_type: loadKey,
          total_treatments: 0,
          total_weight: 0,
          total_gas_usage: 0
        })
      }
      const loadEntry = loadTypeUsage.get(loadKey)
      loadEntry.total_treatments += 1
      loadEntry.total_weight += parseNumber(record.cast_weight)
      loadEntry.total_gas_usage += parseNumber(record.gas_usage)

      const materialKey = record.material_type || 'Unknown'
      if (!materialUsage.has(materialKey)) {
        materialUsage.set(materialKey, {
          material_type: materialKey,
          total_treatments: 0,
          total_bhn: 0,
          bhn_samples: 0
        })
      }
      const materialEntry = materialUsage.get(materialKey)
      materialEntry.total_treatments += 1
      if (avgBhn > 0) {
        materialEntry.total_bhn += avgBhn
        materialEntry.bhn_samples += 1
      }

      const dayKey = record.day_finished || 'Unknown'
      if (!dailyUsage.has(dayKey)) {
        dailyUsage.set(dayKey, {
          day_finished: dayKey,
          total_treatments: 0,
          total_weight: 0
        })
      }
      const dayEntry = dailyUsage.get(dayKey)
      dayEntry.total_treatments += 1
      dayEntry.total_weight += parseNumber(record.cast_weight)
    })

    const today = new Date().toISOString().split('T')[0]
    const todayTreatments = safeTreatments.filter((record) => record.day_finished === today).length

    const stats = {
      total_treatments: totalTreatments,
      total_weight: totalWeight,
      total_gas: totalGas,
      avg_bhn: bhnCount > 0 ? totalBhn / bhnCount : 0,
      unique_parts: partNumbers.size
    }

    const loadTypeData = Array.from(loadTypeUsage.values())
      .map((entry) => ({
        ...entry,
        avg_cast_weight: entry.total_treatments > 0 ? entry.total_weight / entry.total_treatments : 0,
        avg_gas_usage: entry.total_treatments > 0 ? entry.total_gas_usage / entry.total_treatments : 0
      }))
      .sort((a, b) => b.total_treatments - a.total_treatments)

    const furnaceData = Array.from(furnaceUsage.values())
      .map((entry) => ({
        ...entry,
        avg_total_time: entry.total_treatments > 0 ? entry.total_time / entry.total_treatments : 0
      }))
      .sort((a, b) => b.total_treatments - a.total_treatments)

    const materialData = Array.from(materialUsage.values())
      .map((entry) => ({
        ...entry,
        avg_hot_bhn: entry.bhn_samples > 0 ? entry.total_bhn / entry.bhn_samples : 0
      }))
      .sort((a, b) => b.total_treatments - a.total_treatments)
      .slice(0, 10)

    const dailyProduction = Array.from(dailyUsage.values())
      .filter((entry) => entry.day_finished && entry.day_finished !== 'Unknown')
      .sort((a, b) => new Date(b.day_finished) - new Date(a.day_finished))
      .slice(0, 30)

    const recentTreatments = safeTreatments
      .slice()
      .sort((a, b) => {
        const dateCompare = new Date(b.day_finished || 0) - new Date(a.day_finished || 0)
        if (dateCompare !== 0) return dateCompare
        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      })
      .slice(0, 10)

    return res.status(200).json({
      stats: {
        ...stats,
        today_treatments: todayTreatments,
        active_furnaces: Array.from(furnaceUsage.keys()).filter((key) => key && key !== 'Unknown').length
      },
      load_types: loadTypeData,
      furnaces: furnaceData,
      materials: materialData,
      daily_production: dailyProduction,
      recent_treatments: recentTreatments,
      date_range: {
        start: startDate,
        end: endDate
      }
    })
  } catch (error) {
    console.error('Stats API Error:', error)
    return res.status(500).json({ message: 'Failed to fetch statistics', error: error.message })
  }
}
