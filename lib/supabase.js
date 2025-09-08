import { createClient } from '@supabase/supabase-js'

// Fall back to local defaults so builds don't fail when env vars are missing
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const getToolChanges = async () => {
  const { data, error } = await supabase
    .from('tool_changes')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export const addToolChange = async (payload) => {
  const { data, error } = await supabase
    .from('tool_changes')
    .insert(payload)
    .select()
  if (error) throw error
  return data
}

export const getToolInventory = async () => {
  console.log('🔍 Fetching tool inventory...');
  try {
    const { data, error } = await supabase
      .from('tool_inventory')
      .select('tool_id, description, tool_type, insert_type, insert_grade, active')
      .eq('active', true)
      .gt('quantity_on_hand', 0)
    
    if (error) {
      console.error('Tool inventory fetch error:', error);
      throw error;
    }
    
    console.log('📦 Tool inventory loaded:', data?.length || 0, 'tools');
    return data || [];
  } catch (error) {
    console.error('Error fetching tool inventory:', error);
    return [];
  }
}

export const getEquipment = async (workCenter = null) => {
  console.log('🔍 Fetching equipment from Supabase...');
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
        active
      `)
      .eq('active', true);

    if (workCenter) {
      query = query.eq('work_center', workCenter);
    }

    const { data, error } = await query.order('equipment_number');

    if (error) {
      console.error('❌ Equipment fetch error:', error);
      throw error;
    }

    console.log('📊 Raw equipment data from Supabase:', data);

    // Transform data to match your form expectations
    const transformed = data?.map(eq => ({
      id: eq.id,
      number: eq.equipment_number,        // Map equipment_number to number for form compatibility
      equipment_number: eq.equipment_number,
      description: eq.description,
      type: eq.equipment_type,            // Map equipment_type to type
      equipment_type: eq.equipment_type,
      work_center: eq.work_center,
      status: eq.status,
      display_name: `${eq.equipment_number} - ${eq.description}${eq.equipment_type ? ` (${eq.equipment_type})` : ''}`
    })) || [];

    console.log('✅ Transformed equipment for dropdown:', transformed);
    return transformed;

  } catch (error) {
    console.error('💥 Error fetching equipment:', error);
    return [];
  }
}

export const getRealTimeToolStatus = async () => {
  const { data, error } = await supabase
    .from('tool_changes')
    .select('machine_number, tool_type, change_reason, date, time')
    .order('date', { ascending: false })
    .order('time', { ascending: false })
  if (error) throw error
  const latest = {}
  for (const row of data || []) {
    if (!latest[row.machine_number]) {
      latest[row.machine_number] = row
    }
  }
  return Object.values(latest)
}

export const getCostAnalysis = async () => {
  const [{ data: changes, error: chErr }, { data: costs, error: costErr }] =
    await Promise.all([
      supabase.from('tool_changes').select('tool_type'),
      supabase.from('tool_costs').select('tool_type, cost_per_tool'),
    ])
  if (chErr) throw chErr
  if (costErr) throw costErr
  const costMap = {}
  ;(costs || []).forEach((c) => {
    costMap[c.tool_type] = parseFloat(c.cost_per_tool) || 0
  })
  const analysis = {}
  ;(changes || []).forEach((ch) => {
    const cost = costMap[ch.tool_type] || 0
    analysis[ch.tool_type] = (analysis[ch.tool_type] || 0) + cost
  })
  return Object.entries(analysis).map(([tool_type, total_cost]) => ({
    tool_type,
    total_cost,
  }))
}

export const getToolChangeCorrelation = async () => {
  const { data, error } = await supabase
    .from('tool_changes')
    .select('tool_type, pieces_produced')
  if (error) throw error
  const grouped = {}
  ;(data || []).forEach((ch) => {
    grouped[ch.tool_type] = (grouped[ch.tool_type] || 0) +
      (ch.pieces_produced || 0)
  })
  return Object.entries(grouped).map(([tool_type, pieces]) => ({
    tool_type,
    pieces,
  }))
}
