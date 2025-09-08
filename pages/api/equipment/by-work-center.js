import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { work_center, equipment_type } = req.query

  try {
    let query = supabase
      .from('equipment')
      .select(`
        equipment_number,
        description,
        work_center,
        equipment_type,
        equipment_group,
        status,
        model,
        manufacturer,
        last_maintenance,
        next_maintenance
      `)
      .eq('active', true)
      .in('status', ['ACTIVE', 'IDLE', 'RUNNING'])

    if (work_center) {
      query = query.eq('work_center', work_center)
    }

    if (equipment_type) {
      query = query.eq('equipment_type', equipment_type)
    }

    const { data, error } = await query.order('equipment_number')

    if (error) throw error

    // Add status indicators
    const enrichedData = data.map(eq => ({
      ...eq,
      display_name: `${eq.equipment_number} - ${eq.description}`,
      maintenance_due: eq.next_maintenance && new Date(eq.next_maintenance) < new Date(),
      is_cnc: eq.equipment_type?.includes('CNC') || false
    }))

    res.status(200).json({ equipment: enrichedData })

  } catch (error) {
    console.error('Equipment fetch error:', error)
    res.status(500).json({ message: 'Failed to fetch equipment', error: error.message })
  }
}
