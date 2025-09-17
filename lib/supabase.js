// lib/supabase.js - Updated functions for new tool change fields
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get all active operators
export async function getOperators() {
  try {
    console.log('🔍 Fetching operators from database...')

    const { data, error } = await supabase
      .from('operators')
      .select(`
        id,
        employee_id,
        clock_number,
        first_name,
        last_name,
        full_name,
        department,
        primary_shift,
        job_title,
        skill_level,
        cnc_certified,
        lathe_certified,
        mill_certified,
        cat536_6763_experience,
        cat536_6763_pieces_produced
      `)
      .eq('active', true)
      .order('full_name')

    if (error) {
      console.error('❌ Supabase error fetching operators:', error)
      throw error
    }

    console.log('✅ Operators data fetched:', data?.length || 0, 'operators')
    return data || []
  } catch (error) {
    console.error('❌ Error in getOperators:', error)
    return []
  }
}

// Get operators with CAT536-6763 experience (for specific part tracking)
export async function getCAT536Operators() {
  try {
    const { data, error } = await supabase
      .from('operators')
      .select('*')
      .eq('active', true)
      .eq('cat536_6763_experience', true)
      .order('cat536_6763_pieces_produced', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error fetching CAT536 operators:', error)
    return []
  }
}

// Get operator by employee ID or clock number
export async function getOperatorById(identifier) {
  try {
    let query = supabase.from('operators').select('*').eq('active', true)

    // Check if identifier is numeric (clock number) or alphanumeric (employee ID)
    if (!isNaN(identifier)) {
      query = query.eq('clock_number', parseInt(identifier))
    } else {
      query = query.eq('employee_id', identifier)
    }

    const { data, error } = await query.single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Error fetching operator by ID:', error)
    return null
  }
}

// REPLACE your addToolChange function with this clean version

export async function addToolChange(toolChangeData) {
  try {
    console.log('🔧 Adding tool change to database:', toolChangeData)

    // Map to your actual database schema field names
    const mappedData = {
      // Basic info - use exact database column names
      date: toolChangeData.date || new Date().toISOString().split('T')[0],
      time: toolChangeData.time || new Date().toTimeString().split(' ')[0].slice(0, 5),
      shift: toolChangeData.shift ? Number(toolChangeData.shift) : null,

      // Operator info - use current schema
      operator: toolChangeData.operator || null,

      // Equipment - use machine_number (current schema)
      machine_number: toolChangeData.equipment_number || toolChangeData.machine_number || null,
      work_center: toolChangeData.work_center || null,
      operation: toolChangeData.operation || null,

      // Job tracking
      part_number: toolChangeData.part_number || null,
      job_number: toolChangeData.job_number || null,

      // Tool data - use current schema field names
      old_tool_id: toolChangeData.old_first_rougher || toolChangeData.old_finish_tool || null,
      new_tool_id: toolChangeData.new_first_rougher || toolChangeData.new_finish_tool || null,

      // Map new form fields to current schema
      first_rougher: toolChangeData.new_first_rougher || null,
      finish_tool: toolChangeData.new_finish_tool || null,

      insert_type: toolChangeData.insert_type || null,
      insert_grade: toolChangeData.insert_grade || null,

      // Change reasons
      first_rougher_change_reason: toolChangeData.first_rougher_change_reason || null,
      finish_tool_change_reason: toolChangeData.finish_tool_change_reason || null,
      change_reason:
        toolChangeData.change_reason ||
        [toolChangeData.first_rougher_change_reason, toolChangeData.finish_tool_change_reason]
          .filter(Boolean)
          .join(', ') ||
        null,

      // Performance data
      pieces_produced: toolChangeData.pieces_produced ? Number(toolChangeData.pieces_produced) : null,
      cycle_time: toolChangeData.cycle_time || null,

      // Enhanced fields (if you've added the new columns)
      downtime_minutes: toolChangeData.downtime_minutes ? Number(toolChangeData.downtime_minutes) : null,
      tool_change_duration_minutes: toolChangeData.tool_change_duration_minutes
        ? Number(toolChangeData.tool_change_duration_minutes)
        : null,

      // Quality checks
      dimension_check: toolChangeData.dimension_check || null,
      surface_finish: toolChangeData.surface_finish || null,

      // Enhanced tracking (new columns)
      heat_number: toolChangeData.heat_number || null,
      material_grade: toolChangeData.material_grade || null,
      operator_employee_id: toolChangeData.operator_employee_id
        ? Number(toolChangeData.operator_employee_id)
        : null,
      operator_clock_number: toolChangeData.operator_clock_number
        ? Number(toolChangeData.operator_clock_number)
        : null,

      // Cost tracking
      total_tool_cost: toolChangeData.total_tool_cost || 0,
      rougher_cost: toolChangeData.rougher_cost || 0,
      finish_cost: toolChangeData.finish_cost || 0,

      // Metadata
      notes: toolChangeData.notes || null,
      created_at: new Date().toISOString(),
      data_source: 'enhanced_form',
      data_validated: true,
    }

    console.log('📝 Mapped data for database:', mappedData)

    const { data, error } = await supabase.from('tool_changes').insert([mappedData]).select()

    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }

    console.log('✅ Tool change added successfully:', data)
    return data
  } catch (error) {
    console.error('❌ Error in addToolChange:', error)
    throw error
  }
}

// Get all tool changes with updated fields
export async function getToolChanges() {
  try {
    const { data, error } = await supabase
      .from('tool_changes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tool changes:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getToolChanges:', error);
    throw error;
  }
}

// Get enhanced tool changes with operator details
export async function getToolChangesWithOperators() {
  try {
    const { data, error } = await supabase
      .from('tool_changes')
      .select(`
        *,
        operator_details:operator_id (
          employee_id,
          clock_number,
          full_name,
          skill_level,
          cat536_6763_experience
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tool changes with operators:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getToolChangesWithOperators:', error);
    throw error;
  }
}

// Get tool changes by date range
export async function getToolChangesByDateRange(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('tool_changes')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error fetching tool changes by date range:', error);
    throw error;
  }
}

// Get tool changes by operator
export async function getToolChangesByOperator(operator) {
  try {
    const { data, error } = await supabase
      .from('tool_changes')
      .select('*')
      .eq('operator', operator)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error fetching tool changes by operator:', error);
    throw error;
  }
}

// Get tool changes by insert type (new function for insert analysis)
export async function getToolChangesByInsertType(insertType, insertCategory = null) {
  try {
    let query = supabase
      .from('tool_changes')
      .select('*')
      .order('created_at', { ascending: false });

    if (insertCategory === 'rougher') {
      query = query.eq('first_rougher', insertType);
    } else if (insertCategory === 'finish') {
      query = query.eq('finish_tool', insertType);
    } else {
      // Search both fields
      query = query.or(`first_rougher.eq.${insertType},finish_tool.eq.${insertType}`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error fetching tool changes by insert type:', error);
    throw error;
  }
}

// Get equipment list
export async function getEquipment() {
  try {
    console.log('🔍 Fetching equipment from database...');
    
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('active', true)
      .order('equipment_number');

    if (error) {
      console.error('❌ Supabase error fetching equipment:', error);
      throw error;
    }

    console.log('✅ Equipment data fetched:', data);
    return data || [];
  } catch (error) {
    console.error('❌ Error in getEquipment:', error);
    return [];
  }
}

// Get tool inventory
export async function getToolInventory() {
  try {
    console.log('🔍 Fetching tool inventory from database...');
    
    const { data, error } = await supabase
      .from('tool_inventory')
      .select('*')
      .eq('active', true)
      .order('tool_id');

    if (error) {
      console.error('❌ Supabase error fetching tools:', error);
      throw error;
    }

    console.log('✅ Tool inventory data fetched:', data);
    return data || [];
  } catch (error) {
    console.error('❌ Error in getToolInventory:', error);
    return [];
  }
}

// Insert usage analytics - updated for new fields
export async function getInsertUsageAnalytics(dateRange = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    const { data, error } = await supabase
      .from('tool_changes')
      .select(`
        first_rougher,
        finish_tool,
        change_reason,
        pieces_produced,
        cycle_time_before,
        cycle_time_after,
        downtime_minutes,
        date,
        operator,
        equipment_number
      `)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;

    // Process data to create analytics
    const analytics = {
      rougherUsage: {},
      finishUsage: {},
      totalChanges: data.length,
      averageDowntime: 0,
      topChangeReasons: {},
      operatorPerformance: {},
      equipmentUsage: {}
    };

    let totalDowntime = 0;
    let downtimeCount = 0;

    data.forEach(change => {
      // Track rougher insert usage
      if (change.first_rougher) {
        analytics.rougherUsage[change.first_rougher] = 
          (analytics.rougherUsage[change.first_rougher] || 0) + 1;
      }

      // Track finish insert usage
      if (change.finish_tool) {
        analytics.finishUsage[change.finish_tool] = 
          (analytics.finishUsage[change.finish_tool] || 0) + 1;
      }

      // Track change reasons
      if (change.change_reason) {
        analytics.topChangeReasons[change.change_reason] = 
          (analytics.topChangeReasons[change.change_reason] || 0) + 1;
      }

      // Track operator performance
      if (change.operator) {
        if (!analytics.operatorPerformance[change.operator]) {
          analytics.operatorPerformance[change.operator] = {
            changes: 0,
            totalPieces: 0,
            totalDowntime: 0
          };
        }
        analytics.operatorPerformance[change.operator].changes++;
        analytics.operatorPerformance[change.operator].totalPieces += 
          change.pieces_produced || 0;
        analytics.operatorPerformance[change.operator].totalDowntime += 
          change.downtime_minutes || 0;
      }

      // Track equipment usage
      if (change.equipment_number) {
        analytics.equipmentUsage[change.equipment_number] = 
          (analytics.equipmentUsage[change.equipment_number] || 0) + 1;
      }

      // Calculate average downtime
      if (change.downtime_minutes) {
        totalDowntime += change.downtime_minutes;
        downtimeCount++;
      }
    });

    analytics.averageDowntime = downtimeCount > 0 ? 
      (totalDowntime / downtimeCount).toFixed(2) : 0;

    return analytics;
  } catch (error) {
    console.error('❌ Error in getInsertUsageAnalytics:', error);
    throw error;
  }
}

// Cost analysis function - updated for new insert types
export async function getToolCostAnalysis(dateRange = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    // Get tool changes with cost data
    const { data: changes, error: changesError } = await supabase
      .from('tool_changes')
      .select(`
        first_rougher,
        finish_tool,
        pieces_produced,
        downtime_minutes,
        date,
        equipment_number
      `)
      .gte('date', startDate.toISOString().split('T')[0]);

    if (changesError) throw changesError;

    // Get tool costs
    const { data: costs, error: costsError } = await supabase
      .from('tool_costs')
      .select('*');

    if (costsError) throw costsError;

    // Calculate cost analysis
    let totalInsertCost = 0;
    let totalDowntimeCost = 0;
    const downtimeHourlyRate = 150; // $150/hour machine rate

    changes.forEach(change => {
      // Calculate insert costs
      const rougherCost = costs.find(c => 
        c.insert_type === change.first_rougher
      )?.cost_per_tool || 25; // Default $25

      const finishCost = costs.find(c => 
        c.insert_type === change.finish_tool
      )?.cost_per_tool || 30; // Default $30

      totalInsertCost += rougherCost + finishCost;

      // Calculate downtime costs
      if (change.downtime_minutes) {
        totalDowntimeCost += (change.downtime_minutes / 60) * downtimeHourlyRate;
      }
    });

    return {
      totalInsertCost: totalInsertCost.toFixed(2),
      totalDowntimeCost: totalDowntimeCost.toFixed(2),
      totalCost: (totalInsertCost + totalDowntimeCost).toFixed(2),
      averageCostPerChange: changes.length > 0 ? 
        ((totalInsertCost + totalDowntimeCost) / changes.length).toFixed(2) : 0,
      periodDays: dateRange,
      totalChanges: changes.length
    };
  } catch (error) {
    console.error('❌ Error in getToolCostAnalysis:', error);
    throw error;
  }
}

// Get operator performance analytics
export async function getOperatorPerformanceAnalytics(dateRange = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const { data, error } = await supabase
      .from('tool_changes')
      .select(`
        operator,
        operator_id,
        pieces_produced,
        downtime_minutes,
        cycle_time_before,
        cycle_time_after,
        change_reason,
        date,
        operator_details:operator_id (
          employee_id,
          full_name,
          skill_level,
          cat536_6763_pieces_produced
        )
      `)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;

    // Process the data to create performance metrics
    const operatorStats = {};

    data.forEach(change => {
      const operatorKey = change.operator_details?.employee_id || change.operator || 'Unknown';

      if (!operatorStats[operatorKey]) {
        operatorStats[operatorKey] = {
          name: change.operator_details?.full_name || change.operator,
          skill_level: change.operator_details?.skill_level || 'Unknown',
          cat536_experience: change.operator_details?.cat536_6763_pieces_produced || 0,
          tool_changes: 0,
          total_pieces: 0,
          total_downtime: 0,
          avg_cycle_improvement: 0,
          cycle_improvements: []
        };
      }

      const stats = operatorStats[operatorKey];
      stats.tool_changes++;
      stats.total_pieces += change.pieces_produced || 0;
      stats.total_downtime += change.downtime_minutes || 0;

      // Calculate cycle time improvement
      if (change.cycle_time_before && change.cycle_time_after) {
        const improvement = change.cycle_time_before - change.cycle_time_after;
        stats.cycle_improvements.push(improvement);
      }
    });

    // Calculate averages
    Object.values(operatorStats).forEach(stats => {
      stats.avg_pieces_per_change = stats.tool_changes > 0 ?
        Math.round(stats.total_pieces / stats.tool_changes) : 0;
      stats.avg_downtime_per_change = stats.tool_changes > 0 ?
        Math.round(stats.total_downtime / stats.tool_changes) : 0;
      stats.avg_cycle_improvement = stats.cycle_improvements.length > 0 ?
        stats.cycle_improvements.reduce((a, b) => a + b, 0) / stats.cycle_improvements.length : 0;
    });

    return operatorStats;
  } catch (error) {
    console.error('❌ Error in getOperatorPerformanceAnalytics:', error);
    throw error;
  }
}
