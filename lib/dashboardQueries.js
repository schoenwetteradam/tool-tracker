// lib/dashboardQueries.js
// Real Supabase queries for the Pour Reports Dashboard

import { supabase } from './supabase.js';

/**
 * Dashboard Data Service
 * Provides all data fetching methods for the Pour Reports Analytics Dashboard
 */

export class DashboardDataService {
  
  /**
   * Get daily production summary
   * @param {number} days - Number of days to include (default: 30)
   */
  static async getDailyProductionSummary(days = 30) {
    try {
      const { data, error } = await supabase
        .from('daily_production_summary')
        .select('*')
        .order('pour_date', { ascending: false })
        .limit(days);

      if (error) throw error;

      // Reverse to show chronological order for charts
      const records = Array.isArray(data) ? [...data] : [];
      return { success: true, data: records.reverse() };
    } catch (error) {
      console.error('Error fetching daily production summary:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get temperature control data by grade
   * @param {number} days - Number of days to include (default: 7)
   */
  static async getTemperatureControlByGrade(days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('temperature_control_by_grade')
        .select('*')
        .gte('day', cutoffDate.toISOString().split('T')[0])
        .order('grade_name')
        .order('day', { ascending: false });

      if (error) throw error;

      // Aggregate by grade for the dashboard
      const aggregated = this.aggregateTemperatureByGrade(data || []);
      
      return { success: true, data: aggregated };
    } catch (error) {
      console.error('Error fetching temperature control data:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get shift performance data
   */
  static async getShiftPerformance() {
    try {
      const { data, error } = await supabase
        .from('shift_performance')
        .select('*')
        .order('shift');

      if (error) throw error;
      
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching shift performance:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get furnace utilization data
   */
  static async getFurnaceUtilization() {
    try {
      const { data, error } = await supabase
        .from('furnace_utilization')
        .select('*')
        .order('total_pours', { ascending: false });

      if (error) throw error;
      
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching furnace utilization:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get all dashboard data in one call
   * @param {Object} options - Configuration options
   */
  static async getAllDashboardData(options = {}) {
    const {
      dailyDays = 30,
      tempDays = 7
    } = options;

    try {
      const [daily, temp, shift, furnace] = await Promise.all([
        this.getDailyProductionSummary(dailyDays),
        this.getTemperatureControlByGrade(tempDays),
        this.getShiftPerformance(),
        this.getFurnaceUtilization()
      ]);

      return {
        success: true,
        data: {
          daily: daily.data,
          temperature: temp.data,
          shift: shift.data,
          furnace: furnace.data
        }
      };
    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      return { 
        success: false, 
        error: error.message,
        data: {
          daily: [],
          temperature: [],
          shift: [],
          furnace: []
        }
      };
    }
  }

  /**
   * Get recent pours for the table view
   * @param {number} limit - Number of records to return
   */
  static async getRecentPours(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('pour_reports')
        .select('heat_number, pour_date, grade_name, cast_weight, shift, cost_per_pound, pour_temperature, die_rpm')
        .order('pour_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching recent pours:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get grade statistics
   * @param {string} gradeName - Specific grade to query
   * @param {number} days - Number of days to include
   */
  static async getGradeStatistics(gradeName = null, days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      let query = supabase
        .from('pour_reports')
        .select('grade_name, cast_weight, pour_temperature, cost_per_pound')
        .gte('pour_date', cutoffDate.toISOString().split('T')[0]);

      if (gradeName) {
        query = query.eq('grade_name', gradeName);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const stats = this.calculateGradeStats(data || []);
      
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching grade statistics:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get real-time summary KPIs
   */
  static async getSummaryKPIs(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('pour_reports')
        .select('cast_weight, cost_per_pound, pour_temperature, shift')
        .gte('pour_date', cutoffDate.toISOString().split('T')[0]);

      if (error) throw error;

      const records = data || [];
      const totalPours = records.length;
      const totalWeight = records.reduce((sum, r) => sum + (r.cast_weight || 0), 0);

      if (totalPours === 0) {
        return {
          success: true,
          data: {
            totalPours: 0,
            totalWeight: 0,
            avgCost: 0,
            avgTemp: 0,
            avgWeight: 0
          }
        };
      }

      const avgCost = records.reduce((sum, r) => sum + (r.cost_per_pound || 0), 0) / totalPours;
      const avgTemp = records.reduce((sum, r) => sum + (r.pour_temperature || 0), 0) / totalPours;

      return {
        success: true,
        data: {
          totalPours,
          totalWeight,
          avgCost,
          avgTemp,
          avgWeight: totalWeight / totalPours
        }
      };
    } catch (error) {
      console.error('Error fetching summary KPIs:', error);
      return { success: false, error: error.message, data: {} };
    }
  }

  /**
   * Helper: Aggregate temperature data by grade
   * @private
   */
  static aggregateTemperatureByGrade(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const grouped = data.reduce((acc, row) => {
      if (!acc[row.grade_name]) {
        acc[row.grade_name] = {
          grade_name: row.grade_name,
          temps: [],
          sample_sizes: []
        };
      }
      acc[row.grade_name].temps.push(row.avg_temp);
      acc[row.grade_name].sample_sizes.push(row.sample_size);
      return acc;
    }, {});

    return Object.values(grouped).map(group => {
      const totalSamples = group.sample_sizes.reduce((a, b) => a + b, 0);

      if (!totalSamples) {
        return {
          grade_name: group.grade_name,
          avg_temp: 0,
          temp_stddev: 0,
          min_temp: 0,
          max_temp: 0,
          sample_size: 0
        };
      }

      const weightedTemp = group.temps.reduce((sum, temp, i) => 
        sum + (temp * group.sample_sizes[i]), 0) / totalSamples;
      
      const variance = group.temps.reduce((sum, temp, i) => 
        sum + (Math.pow(temp - weightedTemp, 2) * group.sample_sizes[i]), 0) / totalSamples;
      
      return {
        grade_name: group.grade_name,
        avg_temp: Math.round(weightedTemp),
        temp_stddev: Math.round(Math.sqrt(variance)),
        min_temp: Math.min(...group.temps),
        max_temp: Math.max(...group.temps),
        sample_size: totalSamples
      };
    });
  }

  /**
   * Helper: Calculate grade statistics
   * @private
   */
  static calculateGradeStats(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const grouped = data.reduce((acc, row) => {
      if (!row.grade_name) {
        return acc;
      }

      if (!acc[row.grade_name]) {
        acc[row.grade_name] = {
          grade_name: row.grade_name,
          weights: [],
          temps: [],
          costs: []
        };
      }
      if (row.cast_weight) acc[row.grade_name].weights.push(row.cast_weight);
      if (row.pour_temperature) acc[row.grade_name].temps.push(row.pour_temperature);
      if (row.cost_per_pound) acc[row.grade_name].costs.push(row.cost_per_pound);
      return acc;
    }, {});

    return Object.values(grouped).map(grade => {
      const totalPours = grade.weights.length;
      const totalWeight = grade.weights.reduce((a, b) => a + b, 0);
      const avgWeight = totalPours ? totalWeight / totalPours : 0;
      const avgTemp = grade.temps.length
        ? grade.temps.reduce((a, b) => a + b, 0) / grade.temps.length
        : 0;
      const avgCost = grade.costs.length
        ? grade.costs.reduce((a, b) => a + b, 0) / grade.costs.length
        : 0;

      return {
        grade_name: grade.grade_name,
        total_pours: totalPours,
        avg_weight: Math.round(avgWeight),
        avg_temp: Math.round(avgTemp),
        avg_cost: avgCost.toFixed(4),
        total_weight: totalWeight
      };
    });
  }
}

// Export individual methods for convenience
export const {
  getDailyProductionSummary,
  getTemperatureControlByGrade,
  getShiftPerformance,
  getFurnaceUtilization,
  getAllDashboardData,
  getRecentPours,
  getGradeStatistics,
  getSummaryKPIs
} = DashboardDataService;
