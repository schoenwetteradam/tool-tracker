// lib/supabase.js - Updated functions for new tool change fields
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Updated addToolChange function to handle new fields
export async function addToolChange(toolChangeData) {
  try {
    console.log('🔄 Adding tool change to database:', toolChangeData);
    
    const { data, error } = await supabase
      .from('tool_changes')
      .insert([{
        // Basic information
        date: toolChangeData.date,
        time: toolChangeData.time,
        shift: toolChangeData.shift,
        operator: toolChangeData.operator,
        // supervisor field removed per requirements
        
        // Equipment and operation
        work_center: toolChangeData.work_center,
        equipment_number: toolChangeData.equipment_number,
        operation: toolChangeData.operation,
        part_number: toolChangeData.part_number,
        job_number: toolChangeData.job_number,
        
        // Tool information - updated structure
        old_tool_id: toolChangeData.old_tool_id,
        new_tool_id: toolChangeData.new_tool_id,
        tool_position: toolChangeData.tool_position,
        first_rougher: toolChangeData.first_rougher,    // New field
        finish_tool: toolChangeData.finish_tool,        // New field
        insert_type: toolChangeData.insert_type,
        insert_grade: toolChangeData.insert_grade,
        // tool_type field removed per requirements
        
        // Change details
        change_reason: toolChangeData.change_reason,
        old_tool_condition: toolChangeData.old_tool_condition,
        pieces_produced: toolChangeData.pieces_produced,
        cycle_time_before: toolChangeData.cycle_time_before,
        cycle_time_after: toolChangeData.cycle_time_after,
        downtime_minutes: toolChangeData.downtime_minutes,
        notes: toolChangeData.notes,
        
        // Timestamp
        created_at: toolChangeData.created_at || new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Tool change added successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in addToolChange:', error);
    throw error;
  }
}

// Get all tool changes with updated fields
export async function getToolChanges() {
  try {
    const { data, error } = await supabase
      .from('tool_changes')
      .select(`
        *,
        equipment:equipment_number (
          description,
          work_center
        )
      `)
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
