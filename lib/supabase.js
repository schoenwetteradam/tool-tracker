// lib/supabase.js - FIXED VERSION
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Fixed equipment function to match your CSV data structure
export const getEquipment = async (workCenter = null) => {
  try {
    let query = supabase
      .from('equipment')
      .select(`
        id,
        equipment_number,
        description,
        equipment_type,
        equipment_group,
        work_center,
        status,
        active,
        location,
        model,
        manufacturer
      `)
      .eq('active', true)
      .in('status', ['ACTIVE', 'IDLE', 'RUN', 'RUNNING'])

    if (workCenter) {
      query = query.eq('work_center', workCenter)
    }

    const { data, error } = await query.order('equipment_number')

    if (error) {
      console.error('Equipment fetch error:', error)
      throw error
    }

    // Transform data to match your form expectations
    return data?.map(eq => ({
      id: eq.id,
      number: eq.equipment_number, // Map equipment_number to number for form compatibility
      description: eq.description,
      type: eq.equipment_type,
      work_center: eq.work_center,
      status: eq.status,
      location: eq.location,
      model: eq.model,
      manufacturer: eq.manufacturer,
      display_name: `${eq.equipment_number} - ${eq.description} (${eq.equipment_type})`
    })) || []

  } catch (error) {
    console.error('Error fetching equipment:', error)
    return []
  }
}

// Enhanced tool inventory function
export const getToolInventory = async (toolType = null) => {
  try {
    let query = supabase
      .from('tool_inventory')
      .select(`
        id,
        tool_id,
        description,
        tool_type,
        insert_type,
        insert_grade,
        quantity_on_hand,
        unit_cost,
        supplier,
        active
      `)
      .eq('active', true)
      .gt('quantity_on_hand', 0)

    if (toolType) {
      query = query.eq('tool_type', toolType)
    }

    const { data, error } = await query.order('tool_id')

    if (error) {
      console.error('Tool inventory fetch error:', error)
      throw error
    }

    return data || []

  } catch (error) {
    console.error('Error fetching tool inventory:', error)
    return []
  }
}

// Get operations by work center or equipment
export const getOperations = async (workCenter = null, equipmentId = null) => {
  try {
    let query = supabase
      .from('operations')
      .select(`
        id,
        operation_code,
        description,
        work_center_code,
        operation_type,
        department,
        active
      `)
      .eq('active', true)

    if (workCenter) {
      query = query.eq('work_center_code', workCenter)
    }

    const { data, error } = await query.order('operation_code')

    if (error) {
      console.error('Operations fetch error:', error)
      throw error
    }

    return data?.map(op => ({
      code: op.operation_code,
      description: op.description,
      type: op.operation_type,
      work_center: op.work_center_code,
      display_name: `${op.operation_code} - ${op.description}`
    })) || []

  } catch (error) {
    console.error('Error fetching operations:', error)
    return []
  }
}

// Get work centers
export const getWorkCenters = async () => {
  try {
    const { data, error } = await supabase
      .from('work_centers')
      .select(`
        id,
        work_center_code,
        description,
        department,
        active
      `)
      .eq('active', true)
      .order('work_center_code')

    if (error) {
      console.error('Work centers fetch error:', error)
      throw error
    }

    return data?.map(wc => ({
      code: wc.work_center_code,
      description: wc.description,
      department: wc.department,
      display_name: `${wc.work_center_code} - ${wc.description}`
    })) || []

  } catch (error) {
    console.error('Error fetching work centers:', error)
    return []
  }
}

// Enhanced tool change submission
export const addToolChange = async (payload) => {
  try {
    // Clean the payload - remove empty strings, convert to proper types
    const cleanedPayload = Object.entries(payload).reduce((acc, [key, value]) => {
      if (value === '' || value === null || value === undefined) {
        acc[key] = null
      } else if (key.includes('pieces') || key.includes('time') || key === 'shift') {
        acc[key] = Number(value) || null
      } else {
        acc[key] = value
      }
      return acc
    }, {})

    // Add metadata
    cleanedPayload.created_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('tool_changes')
      .insert(cleanedPayload)
      .select()

    if (error) {
      console.error('Tool change submission error:', error)
      throw error
    }

    return data?.[0]

  } catch (error) {
    console.error('Error adding tool change:', error)
    throw error
  }
}

// Get tool changes with filtering
export const getToolChanges = async (filters = {}) => {
  try {
    let query = supabase
      .from('tool_changes')
      .select(`
        *,
        equipment:equipment_number(description, equipment_type)
      `)

    // Apply filters
    if (filters.startDate) {
      query = query.gte('date', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate)
    }
    if (filters.equipment) {
      query = query.eq('equipment_number', filters.equipment)
    }
    if (filters.operator) {
      query = query.eq('operator', filters.operator)
    }
    if (filters.partNumber) {
      query = query.eq('part_number', filters.partNumber)
    }

    const { data, error } = await query
      .order('date', { ascending: false })
      .order('time', { ascending: false })

    if (error) {
      console.error('Tool changes fetch error:', error)
      throw error
    }

    return data || []

  } catch (error) {
    console.error('Error fetching tool changes:', error)
    return []
  }
}

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('count(*)')
      .limit(1)

    if (error) throw error

    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    console.error('Database connection test failed:', error)
    return { success: false, message: error.message }
  }
}
