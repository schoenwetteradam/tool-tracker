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
    const startDate = start_date || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get overall statistics using the database function
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_heat_treatment_stats', {
        start_date: startDate,
        end_date: endDate
      })

    if (statsError) throw statsError

    // Get load type distribution
    const { data: loadTypeData, error: loadError } = await supabase
      .from('vw_heat_treatment_by_load_type')
      .select('*')

    if (loadError) throw loadError

    // Get furnace utilization
    const { data: furnaceData, error: furnError } = await supabase
      .rpc('get_furnace_utilization', {
        start_date: startDate,
        end_date: endDate
      })

    if (furnError) throw furnError

    // Get material performance
    const { data: materialData, error: matError } = await supabase
      .from('vw_heat_treatment_by_material')
      .select('*')
      .limit(10)

    if (matError) throw matError

    // Get daily production
    const { data: dailyData, error: dailyError } = await supabase
      .from('vw_daily_heat_treatment_production')
      .select('*')
      .gte('day_finished', startDate)
      .lte('day_finished', endDate)
      .order('day_finished', { ascending: false })
      .limit(30)

    if (dailyError) throw dailyError

    // Get recent treatments
    const { data: recentData, error: recentError } = await supabase
      .from('vw_recent_heat_treatments')
      .select('*')
      .limit(10)

    if (recentError) throw recentError

    // Get today's count
    const today = new Date().toISOString().split('T')[0]
    const { data: todayData, error: todayError } = await supabase
      .from('heat_treatment_log')
      .select('id', { count: 'exact', head: true })
      .eq('day_finished', today)

    if (todayError) throw todayError

    const stats = statsData && statsData.length > 0 ? statsData[0] : {
      total_treatments: 0,
      total_weight: 0,
      total_gas: 0,
      avg_bhn: 0,
      unique_parts: 0
    }

    return res.status(200).json({
      stats: {
        ...stats,
        today_treatments: todayData?.count || 0,
        active_furnaces: furnaceData?.length || 0
      },
      load_types: loadTypeData || [],
      furnaces: furnaceData || [],
      materials: materialData || [],
      daily_production: dailyData || [],
      recent_treatments: recentData || [],
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
