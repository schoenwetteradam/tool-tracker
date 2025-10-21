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

    const todayIso = new Date().toISOString().split('T')[0]
    const endDate = end_date || todayIso
    const startDate =
      start_date || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: treatments, error: treatmentsError } = await supabase
      .from('heat_treatment_log')
      .select('*')
      .gte('day_finished', startDate)
      .lte('day_finished', endDate)

    if (treatmentsError) throw treatmentsError

    const safeTreatments = Array.isArray(treatments) ? treatments : []

    const parseNumber = (value) => {
      const num = Number.parseFloat(value)
      return Number.isFinite(num) ? num : 0
    }

    const toNullableNumber = (value) => {
      if (value === null || value === undefined || value === '') return null
      const num = Number.parseFloat(value)
      return Number.isFinite(num) ? num : null
    }

    const getRecordTotalTime = (record) =>
      [1, 2, 3, 4].reduce((acc, idx) => acc + parseNumber(record[`time${idx}_hours`]), 0)

    const getRecordAvgBhn = (record) => {
      const hot = toNullableNumber(record.hot_end_bhn)
      const cold = toNullableNumber(record.cold_end_bhn)
      if (hot !== null && cold !== null) return (hot + cold) / 2
      if (hot !== null) return hot
      if (cold !== null) return cold
      return null
    }

    const getRecordAvgTir = (record) => {
      const hot = toNullableNumber(record.hot_str_tir)
      const cold = toNullableNumber(record.cold_str_tir)
      if (hot !== null && cold !== null) return (hot + cold) / 2
      if (hot !== null) return hot
      if (cold !== null) return cold
      return null
    }

    let totalBhn = 0
    let bhnCount = 0
    let totalTir = 0
    let tirCount = 0
    let totalCycleTime = 0

    const partNumbers = new Set()
    const furnaceUsage = new Map()
    const loadTypeUsage = new Map()
    const materialUsage = new Map()
    const dailyUsage = new Map()

    safeTreatments.forEach((record) => {
      if (record.part_number) {
        partNumbers.add(record.part_number)
      }

      const avgBhn = getRecordAvgBhn(record)
      if (avgBhn !== null) {
        totalBhn += avgBhn
        bhnCount += 1
      }

      const avgTir = getRecordAvgTir(record)
      if (avgTir !== null) {
        totalTir += avgTir
        tirCount += 1
      }

      const totalTime = getRecordTotalTime(record)
      totalCycleTime += totalTime

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
      furnaceEntry.total_time += totalTime

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
      if (avgBhn !== null) {
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

    const totalTreatments = safeTreatments.length
    const totalWeight = safeTreatments.reduce((sum, item) => sum + parseNumber(item.cast_weight), 0)
    const totalGas = safeTreatments.reduce((sum, item) => sum + parseNumber(item.gas_usage), 0)
    const todayTreatments = safeTreatments.filter((record) => record.day_finished === todayIso).length

    const monthStart = new Date(startDate)
    monthStart.setDate(1)
    const monthStartIso = monthStart.toISOString().split('T')[0]

    const endMonth = new Date(endDate)
    endMonth.setDate(1)
    const endMonthIso = endMonth.toISOString().split('T')[0]

    const startOfYear = new Date(endDate)
    startOfYear.setMonth(0, 1)
    const startOfYearIso = startOfYear.toISOString().split('T')[0]

    const [monthlyStatsResult, ytdResult, furnaceResult, loadTypeResult] = await Promise.all([
      supabase
        .from('heat_treat_dashboard_stats')
        .select('*')
        .eq('period_type', 'month')
        .gte('period_start', monthStartIso)
        .lte('period_start', endMonthIso)
        .order('period_start', { ascending: true }),
      supabase
        .from('heat_treat_dashboard_stats')
        .select('*')
        .eq('period_type', 'year')
        .eq('period_start', startOfYearIso)
        .maybeSingle(),
      supabase
        .from('heat_treat_kpi_by_furnace')
        .select('*')
        .gte('period_start', monthStartIso)
        .lte('period_start', endMonthIso),
      supabase
        .from('heat_treat_kpi_by_load_type')
        .select('*')
        .gte('period_start', monthStartIso)
        .lte('period_start', endMonthIso)
    ])

    if (monthlyStatsResult.error) throw monthlyStatsResult.error
    if (ytdResult.error) throw ytdResult.error
    if (furnaceResult.error) throw furnaceResult.error
    if (loadTypeResult.error) throw loadTypeResult.error

    const monthlyStats = Array.isArray(monthlyStatsResult.data) ? monthlyStatsResult.data : []

    const normalizeMetrics = (metrics) => {
      if (!metrics) return null
      return {
        ...metrics,
        total_loads: parseNumber(metrics.total_loads),
        total_cast_weight: parseNumber(metrics.total_cast_weight),
        avg_cycle_time_hours: toNullableNumber(metrics.avg_cycle_time_hours),
        total_cycle_hours: toNullableNumber(metrics.total_cycle_hours),
        min_cycle_time_hours: toNullableNumber(metrics.min_cycle_time_hours),
        max_cycle_time_hours: toNullableNumber(metrics.max_cycle_time_hours),
        avg_stage1_time_hours: toNullableNumber(metrics.avg_stage1_time_hours),
        avg_stage2_time_hours: toNullableNumber(metrics.avg_stage2_time_hours),
        avg_stage3_time_hours: toNullableNumber(metrics.avg_stage3_time_hours),
        avg_stage4_time_hours: toNullableNumber(metrics.avg_stage4_time_hours),
        avg_temperature_f: toNullableNumber(metrics.avg_temperature_f),
        avg_bhn: toNullableNumber(metrics.avg_bhn),
        avg_tir: toNullableNumber(metrics.avg_tir),
        total_gas_usage: parseNumber(metrics.total_gas_usage),
        specific_energy_consumption: toNullableNumber(metrics.specific_energy_consumption),
        estimated_energy_cost: toNullableNumber(metrics.estimated_energy_cost),
        avg_stage1_temp: toNullableNumber(metrics.avg_stage1_temp),
        avg_stage2_temp: toNullableNumber(metrics.avg_stage2_temp),
        avg_stage3_temp: toNullableNumber(metrics.avg_stage3_temp),
        avg_stage4_temp: toNullableNumber(metrics.avg_stage4_temp),
        avg_hot_end_bhn: toNullableNumber(metrics.avg_hot_end_bhn),
        avg_cold_end_bhn: toNullableNumber(metrics.avg_cold_end_bhn),
        avg_hot_tir: toNullableNumber(metrics.avg_hot_tir),
        avg_cold_tir: toNullableNumber(metrics.avg_cold_tir),
        calendar_days: parseNumber(metrics.calendar_days)
      }
    }

    const ytdMetrics = normalizeMetrics(ytdResult.data)

    const aggregateView = (rows, keyField) => {
      const accumulator = new Map()
      rows.forEach((row) => {
        const key = row[keyField] || 'Unknown'
        if (!accumulator.has(key)) {
          accumulator.set(key, {
            id: key,
            total_loads: 0,
            total_cast_weight: 0,
            total_gas_usage: 0,
            total_cycle_hours: 0,
            total_available_hours: 0,
            periods: 0,
            weighted_cycle_time: 0,
            weighted_temp: 0,
            temp_samples: 0,
            weighted_bhn: 0,
            bhn_samples: 0,
            weighted_tir: 0,
            tir_samples: 0,
            weighted_hot_bhn: 0,
            hot_bhn_samples: 0,
            weighted_cold_bhn: 0,
            cold_bhn_samples: 0,
            weighted_hot_tir: 0,
            hot_tir_samples: 0,
            weighted_cold_tir: 0,
            cold_tir_samples: 0,
            weighted_delta_bhn: 0,
            delta_bhn_samples: 0,
            weighted_delta_tir: 0,
            delta_tir_samples: 0,
            weighted_stage1_time: 0,
            stage1_samples: 0,
            weighted_stage2_time: 0,
            stage2_samples: 0,
            weighted_stage3_time: 0,
            stage3_samples: 0,
            weighted_stage4_time: 0,
            stage4_samples: 0,
            min_cycle_time: null,
            max_cycle_time: null
          })
        }
        const entry = accumulator.get(key)
        const loads = parseNumber(row.total_loads)
        const castWeight = parseNumber(row.total_cast_weight)
        const gas = parseNumber(row.total_gas_usage)
        const cycleHours = parseNumber(row.total_cycle_hours)
        const availableHours = parseNumber(row.calendar_days) * 24
        const avgCycle = toNullableNumber(row.avg_cycle_time_hours)
        const avgTemp = toNullableNumber(row.avg_temperature_f)
        const avgBhn = toNullableNumber(row.avg_bhn)
        const avgTir = toNullableNumber(row.avg_tir)
        const avgHotBhn = toNullableNumber(row.avg_hot_end_bhn)
        const avgColdBhn = toNullableNumber(row.avg_cold_end_bhn)
        const avgHotTir = toNullableNumber(row.avg_hot_tir)
        const avgColdTir = toNullableNumber(row.avg_cold_tir)
        const avgDeltaBhn = toNullableNumber(row.avg_delta_bhn)
        const avgDeltaTir = toNullableNumber(row.avg_delta_tir)
        const avgStage1 = toNullableNumber(row.avg_stage1_time_hours)
        const avgStage2 = toNullableNumber(row.avg_stage2_time_hours)
        const avgStage3 = toNullableNumber(row.avg_stage3_time_hours)
        const avgStage4 = toNullableNumber(row.avg_stage4_time_hours)
        const minCycle = toNullableNumber(row.min_cycle_time_hours)
        const maxCycle = toNullableNumber(row.max_cycle_time_hours)

        entry.total_loads += loads
        entry.total_cast_weight += castWeight
        entry.total_gas_usage += gas
        entry.total_cycle_hours += cycleHours
        entry.total_available_hours += availableHours
        entry.periods += 1

        if (avgCycle !== null) entry.weighted_cycle_time += avgCycle * loads
        if (avgTemp !== null) {
          entry.weighted_temp += avgTemp * loads
          entry.temp_samples += loads
        }
        if (avgBhn !== null) {
          entry.weighted_bhn += avgBhn * loads
          entry.bhn_samples += loads
        }
        if (avgTir !== null) {
          entry.weighted_tir += avgTir * loads
          entry.tir_samples += loads
        }
        if (avgStage1 !== null) {
          entry.weighted_stage1_time += avgStage1 * loads
          entry.stage1_samples += loads
        }
        if (avgStage2 !== null) {
          entry.weighted_stage2_time += avgStage2 * loads
          entry.stage2_samples += loads
        }
        if (avgStage3 !== null) {
          entry.weighted_stage3_time += avgStage3 * loads
          entry.stage3_samples += loads
        }
        if (avgStage4 !== null) {
          entry.weighted_stage4_time += avgStage4 * loads
          entry.stage4_samples += loads
        }
        if (avgHotBhn !== null) {
          entry.weighted_hot_bhn += avgHotBhn * loads
          entry.hot_bhn_samples += loads
        }
        if (avgColdBhn !== null) {
          entry.weighted_cold_bhn += avgColdBhn * loads
          entry.cold_bhn_samples += loads
        }
        if (avgHotTir !== null) {
          entry.weighted_hot_tir += avgHotTir * loads
          entry.hot_tir_samples += loads
        }
        if (avgColdTir !== null) {
          entry.weighted_cold_tir += avgColdTir * loads
          entry.cold_tir_samples += loads
        }
        if (avgDeltaBhn !== null) {
          entry.weighted_delta_bhn += avgDeltaBhn * loads
          entry.delta_bhn_samples += loads
        }
        if (avgDeltaTir !== null) {
          entry.weighted_delta_tir += avgDeltaTir * loads
          entry.delta_tir_samples += loads
        }
        if (minCycle !== null) {
          entry.min_cycle_time =
            entry.min_cycle_time === null ? minCycle : Math.min(entry.min_cycle_time, minCycle)
        }
        if (maxCycle !== null) {
          entry.max_cycle_time =
            entry.max_cycle_time === null ? maxCycle : Math.max(entry.max_cycle_time, maxCycle)
        }
      })
      return Array.from(accumulator.values())
    }

    const furnaceComparisons = aggregateView(
      Array.isArray(furnaceResult.data) ? furnaceResult.data : [],
      'furnace_number'
    )
      .map((entry) => ({
        furnace_number: entry.id,
        total_loads: entry.total_loads,
        total_cast_weight: entry.total_cast_weight,
        total_gas_usage: entry.total_gas_usage,
        avg_cycle_time_hours:
          entry.total_loads > 0 ? entry.weighted_cycle_time / entry.total_loads : 0,
        avg_temperature_f:
          entry.temp_samples > 0 ? entry.weighted_temp / entry.temp_samples : null,
        avg_bhn: entry.bhn_samples > 0 ? entry.weighted_bhn / entry.bhn_samples : null,
        avg_tir: entry.tir_samples > 0 ? entry.weighted_tir / entry.tir_samples : null,
        avg_hot_end_bhn:
          entry.hot_bhn_samples > 0 ? entry.weighted_hot_bhn / entry.hot_bhn_samples : null,
        avg_cold_end_bhn:
          entry.cold_bhn_samples > 0 ? entry.weighted_cold_bhn / entry.cold_bhn_samples : null,
        avg_hot_tir:
          entry.hot_tir_samples > 0 ? entry.weighted_hot_tir / entry.hot_tir_samples : null,
        avg_cold_tir:
          entry.cold_tir_samples > 0 ? entry.weighted_cold_tir / entry.cold_tir_samples : null,
        avg_stage1_time_hours:
          entry.stage1_samples > 0 ? entry.weighted_stage1_time / entry.stage1_samples : null,
        avg_stage2_time_hours:
          entry.stage2_samples > 0 ? entry.weighted_stage2_time / entry.stage2_samples : null,
        avg_stage3_time_hours:
          entry.stage3_samples > 0 ? entry.weighted_stage3_time / entry.stage3_samples : null,
        avg_stage4_time_hours:
          entry.stage4_samples > 0 ? entry.weighted_stage4_time / entry.stage4_samples : null,
        min_cycle_time_hours: entry.min_cycle_time,
        max_cycle_time_hours: entry.max_cycle_time,
        utilization_rate:
          entry.total_available_hours > 0
            ? entry.total_cycle_hours / entry.total_available_hours
            : 0,
        specific_energy_consumption:
          entry.total_cast_weight > 0 ? entry.total_gas_usage / entry.total_cast_weight : null
      }))
      .sort((a, b) => b.total_loads - a.total_loads)

    const loadTypeComparisons = aggregateView(
      Array.isArray(loadTypeResult.data) ? loadTypeResult.data : [],
      'load_type'
    )
      .map((entry) => ({
        load_type: entry.id,
        total_loads: entry.total_loads,
        total_cast_weight: entry.total_cast_weight,
        total_gas_usage: entry.total_gas_usage,
        avg_cycle_time_hours:
          entry.total_loads > 0 ? entry.weighted_cycle_time / entry.total_loads : 0,
        avg_temperature_f:
          entry.temp_samples > 0 ? entry.weighted_temp / entry.temp_samples : null,
        avg_bhn: entry.bhn_samples > 0 ? entry.weighted_bhn / entry.bhn_samples : null,
        avg_tir: entry.tir_samples > 0 ? entry.weighted_tir / entry.tir_samples : null,
        avg_hot_end_bhn:
          entry.hot_bhn_samples > 0 ? entry.weighted_hot_bhn / entry.hot_bhn_samples : null,
        avg_cold_end_bhn:
          entry.cold_bhn_samples > 0 ? entry.weighted_cold_bhn / entry.cold_bhn_samples : null,
        avg_delta_bhn:
          entry.delta_bhn_samples > 0 ? entry.weighted_delta_bhn / entry.delta_bhn_samples : null,
        avg_hot_tir:
          entry.hot_tir_samples > 0 ? entry.weighted_hot_tir / entry.hot_tir_samples : null,
        avg_cold_tir:
          entry.cold_tir_samples > 0 ? entry.weighted_cold_tir / entry.cold_tir_samples : null,
        avg_delta_tir:
          entry.delta_tir_samples > 0 ? entry.weighted_delta_tir / entry.delta_tir_samples : null,
        avg_stage1_time_hours:
          entry.stage1_samples > 0 ? entry.weighted_stage1_time / entry.stage1_samples : null,
        avg_stage2_time_hours:
          entry.stage2_samples > 0 ? entry.weighted_stage2_time / entry.stage2_samples : null,
        avg_stage3_time_hours:
          entry.stage3_samples > 0 ? entry.weighted_stage3_time / entry.stage3_samples : null,
        avg_stage4_time_hours:
          entry.stage4_samples > 0 ? entry.weighted_stage4_time / entry.stage4_samples : null,
        min_cycle_time_hours: entry.min_cycle_time,
        max_cycle_time_hours: entry.max_cycle_time,
        specific_energy_consumption:
          entry.total_cast_weight > 0 ? entry.total_gas_usage / entry.total_cast_weight : null
      }))
      .sort((a, b) => b.total_loads - a.total_loads)

    const formatPeriodLabel = (dateString) => {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }

    const temperatureTrend = monthlyStats.map((row) => ({
      period: formatPeriodLabel(row.period_start),
      stage1: toNullableNumber(row.avg_stage1_temp),
      stage2: toNullableNumber(row.avg_stage2_temp),
      stage3: toNullableNumber(row.avg_stage3_temp),
      stage4: toNullableNumber(row.avg_stage4_temp)
    }))

    const hardnessTrend = monthlyStats.map((row) => {
      const hot = toNullableNumber(row.avg_hot_end_bhn)
      const cold = toNullableNumber(row.avg_cold_end_bhn)
      return {
        period: formatPeriodLabel(row.period_start),
        hot,
        cold,
        delta: hot !== null && cold !== null ? Math.abs(hot - cold) : null
      }
    })

    const energyTrend = monthlyStats.map((row) => ({
      period: formatPeriodLabel(row.period_start),
      energy: toNullableNumber(row.specific_energy_consumption)
    }))

    const cycleTrend = monthlyStats.map((row) => ({
      period: formatPeriodLabel(row.period_start),
      total: toNullableNumber(row.avg_cycle_time_hours),
      stage1: toNullableNumber(row.avg_stage1_time_hours),
      stage2: toNullableNumber(row.avg_stage2_time_hours),
      stage3: toNullableNumber(row.avg_stage3_time_hours),
      stage4: toNullableNumber(row.avg_stage4_time_hours),
      min: toNullableNumber(row.min_cycle_time_hours),
      max: toNullableNumber(row.max_cycle_time_hours)
    }))

    const averageField = (rows, getter) => {
      let sum = 0
      let count = 0
      rows.forEach((row) => {
        const value = getter(row)
        if (value !== null && Number.isFinite(value)) {
          sum += value
          count += 1
        }
      })
      return count > 0 ? sum / count : null
    }

    const stageKeys = [
      { key: 'avg_stage1_temp', label: 'Stage 1' },
      { key: 'avg_stage2_temp', label: 'Stage 2' },
      { key: 'avg_stage3_temp', label: 'Stage 3' },
      { key: 'avg_stage4_temp', label: 'Stage 4' }
    ]

    const temperatureLimits = {
      avg_stage1_temp: { min: 1200, max: 1800 },
      avg_stage2_temp: { min: 1200, max: 1850 },
      avg_stage3_temp: { min: 1100, max: 1750 },
      avg_stage4_temp: { min: 900, max: 1600 }
    }

    const hardnessLimits = { min: 180, max: 450 }
    const tirLimit = 0.1

    const alerts = []
    const lastMonth = monthlyStats[monthlyStats.length - 1]
    if (lastMonth) {
      const previousMonths = monthlyStats.slice(0, -1)
      const lastPeriodLabel = formatPeriodLabel(lastMonth.period_start)

      stageKeys.forEach(({ key, label }) => {
        const value = toNullableNumber(lastMonth[key])
        if (value === null) return

        const limits = temperatureLimits[key]
        if (limits && (value < limits.min || value > limits.max)) {
          alerts.push({
            severity: 'critical',
            metric: `${label} Temperature`,
            message: `${label} average temperature (${Math.round(value)}°F) is outside control limits during ${lastPeriodLabel}.`
          })
          return
        }

        const baseline = averageField(previousMonths, (row) => toNullableNumber(row[key]))
        if (baseline !== null && Math.abs(value - baseline) > 50) {
          alerts.push({
            severity: 'warning',
            metric: `${label} Temperature`,
            message: `${label} average temperature shifted ${Math.round(value - baseline)}°F from baseline in ${lastPeriodLabel}.`
          })
        }
      })

      const lastAvgBhn = toNullableNumber(lastMonth.avg_bhn)
      if (lastAvgBhn !== null && (lastAvgBhn < hardnessLimits.min || lastAvgBhn > hardnessLimits.max)) {
        alerts.push({
          severity: 'warning',
          metric: 'Average BHN',
          message: `Average BHN (${Math.round(lastAvgBhn)}) is outside the control range in ${lastPeriodLabel}.`
        })
      }

      const lastHotBhn = toNullableNumber(lastMonth.avg_hot_end_bhn)
      const lastColdBhn = toNullableNumber(lastMonth.avg_cold_end_bhn)
      if (lastHotBhn !== null && lastColdBhn !== null) {
        const delta = Math.abs(lastHotBhn - lastColdBhn)
        const baselineDelta = averageField(previousMonths, (row) => {
          const hot = toNullableNumber(row.avg_hot_end_bhn)
          const cold = toNullableNumber(row.avg_cold_end_bhn)
          if (hot === null || cold === null) return null
          return Math.abs(hot - cold)
        })
        const threshold = baselineDelta !== null ? baselineDelta + 10 : 20
        if (delta > threshold) {
          alerts.push({
            severity: 'warning',
            metric: 'Hardness Variation',
            message: `BHN delta (${delta.toFixed(1)}) exceeds control limits in ${lastPeriodLabel}.`
          })
        }
      }

      const lastAvgTir = toNullableNumber(lastMonth.avg_tir)
      if (lastAvgTir !== null && lastAvgTir > tirLimit) {
        alerts.push({
          severity: 'warning',
          metric: 'Average TIR',
          message: `Average TIR (${lastAvgTir.toFixed(3)}) is above ${tirLimit.toFixed(3)} in ${lastPeriodLabel}.`
        })
      }

      const lastEnergy = toNullableNumber(lastMonth.specific_energy_consumption)
      const energyBaseline =
        (ytdMetrics && ytdMetrics.specific_energy_consumption) ||
        averageField(previousMonths, (row) => toNullableNumber(row.specific_energy_consumption))
      if (lastEnergy !== null && energyBaseline) {
        const tolerance = energyBaseline * 0.1
        if (lastEnergy > energyBaseline + tolerance) {
          const percentIncrease = ((lastEnergy / energyBaseline) - 1) * 100
          alerts.push({
            severity: 'warning',
            metric: 'Specific Energy',
            message: `Specific energy consumption (${lastEnergy.toFixed(3)}) is ${percentIncrease.toFixed(1)}% above baseline.`
          })
        }
      }
    }

    const loadTypeSummary = Array.from(loadTypeUsage.values())
      .map((entry) => ({
        ...entry,
        avg_cast_weight: entry.total_treatments > 0 ? entry.total_weight / entry.total_treatments : 0,
        avg_gas_usage: entry.total_treatments > 0 ? entry.total_gas_usage / entry.total_treatments : 0
      }))
      .sort((a, b) => b.total_treatments - a.total_treatments)

    const furnaceSummary = Array.from(furnaceUsage.values())
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

    const stats = {
      total_treatments: totalTreatments,
      total_weight: totalWeight,
      total_gas: totalGas,
      avg_bhn: bhnCount > 0 ? totalBhn / bhnCount : 0,
      avg_tir: tirCount > 0 ? totalTir / tirCount : 0,
      avg_cycle_time_hours: totalTreatments > 0 ? totalCycleTime / totalTreatments : 0,
      specific_energy_consumption: totalWeight > 0 ? totalGas / totalWeight : 0,
      energy_cost: totalGas * 0.45,
      unique_parts: partNumbers.size,
      today_treatments: todayTreatments,
      active_furnaces: Array.from(furnaceUsage.keys()).filter((key) => key && key !== 'Unknown').length
    }

    return res.status(200).json({
      stats,
      ytd: ytdMetrics,
      trends: {
        temperature: temperatureTrend,
        hardness: hardnessTrend,
        energy: energyTrend,
        cycle: cycleTrend
      },
      load_types: loadTypeComparisons,
      furnaces: furnaceComparisons,
      materials: materialData,
      load_type_summary: loadTypeSummary,
      furnace_summary: furnaceSummary,
      daily_production: dailyProduction,
      recent_treatments: recentTreatments,
      alerts,
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
