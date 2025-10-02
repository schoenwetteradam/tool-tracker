import { supabase } from './supabase'

const toOptionalString = (value) => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }

  return value
}

const parseOptionalFloat = (value) => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value === 'string' && value.trim() === '') {
    return null
  }

  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseOptionalInteger = (value) => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value === 'string' && value.trim() === '') {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) ? parsed : null
}

const normalizeBoolean = (value) => {
  if (value === undefined) {
    return undefined
  }

  return Boolean(value)
}

const removeUndefined = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined))

const buildPourReportPayload = (data) =>
  removeUndefined({
    heat_number: toOptionalString(data.heat_number),
    pour_date: toOptionalString(data.pour_date),
    grade_name: toOptionalString(data.grade_name),
    stock_code: toOptionalString(data.stock_code),
    job_number: parseOptionalInteger(data.job_number),
    cast_weight: parseOptionalFloat(data.cast_weight),
    cmop: parseOptionalInteger(data.cmop),
    dash_number: toOptionalString(data.dash_number),
    die_number: parseOptionalInteger(data.die_number),
    shift: parseOptionalInteger(data.shift),
    melter_id: parseOptionalInteger(data.melter_id),
    furnace_number: parseOptionalInteger(data.furnace_number),
    new_lining: normalizeBoolean(data.new_lining),
    start_time: toOptionalString(data.start_time),
    pour_temperature: parseOptionalInteger(data.pour_temperature),
    liquid_amount: parseOptionalFloat(data.liquid_amount),
    liquid_type: toOptionalString(data.liquid_type),
    wash_thickness: parseOptionalFloat(data.wash_thickness),
    wash_pass: parseOptionalInteger(data.wash_pass),
    wash_type: toOptionalString(data.wash_type),
    die_temp_before_pour: parseOptionalInteger(data.die_temp_before_pour),
    die_rpm: parseOptionalInteger(data.die_rpm),
    spin_time_minutes: parseOptionalInteger(data.spin_time_minutes),
    cost_per_pound: parseOptionalFloat(data.cost_per_pound),
    full_heat_number: toOptionalString(data.full_heat_number)
  })

export class PourReportService {
  static async createPourReport(data) {
    try {
      const payload = buildPourReportPayload(data)

      const { data: inserted, error } = await supabase
        .from('pour_reports')
        .insert([payload])
        .select()

      if (error) throw error

      return { success: true, data: inserted?.[0] ?? null }
    } catch (error) {
      console.error('Error creating pour report:', error)
      return { success: false, error: error.message }
    }
  }

  static async refreshDashboardStats() {
    try {
      const { error } = await supabase.rpc('refresh_dashboard_stats')

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error refreshing dashboard stats:', error)
      return { success: false, error: error.message }
    }
  }

  static async bulkImportPourReports(reports, { skipDuplicates = true } = {}) {
    try {
      const normalizedReports = (reports ?? []).map((report) => buildPourReportPayload(report))

      if (normalizedReports.length === 0) {
        return { success: true, data: [], count: 0 }
      }

      const method = skipDuplicates ? 'upsert' : 'insert'
      const query = supabase
        .from('pour_reports')[method](normalizedReports, {
          onConflict: skipDuplicates ? 'full_heat_number' : undefined,
          ignoreDuplicates: skipDuplicates || undefined
        })
        .select()

      const { data, error } = await query

      if (error) throw error
      return { success: true, data, count: data?.length ?? 0 }
    } catch (error) {
      console.error('Error bulk importing pour reports:', error)
      return { success: false, error: error.message }
    }
  }

  static async searchPourReports(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('pour_reports')
        .select('*')
        .or(
          `heat_number.ilike.%${searchTerm}%,grade_name.ilike.%${searchTerm}%,full_heat_number.ilike.%${searchTerm}%`
        )
        .order('pour_date', { ascending: false })
        .limit(20)

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error searching pour reports:', error)
      return { success: false, error: error.message }
    }
  }

  static async getPourReportsByDateRange(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('pour_reports')
        .select('*')
        .gte('pour_date', startDate)
        .lte('pour_date', endDate)
        .order('pour_date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching pour reports by date range:', error)
      return { success: false, error: error.message }
    }
  }

  static async getUniqueGrades() {
    try {
      const { data, error } = await supabase
        .from('pour_reports')
        .select('grade_name')
        .not('grade_name', 'is', null)
        .order('grade_name')

      if (error) throw error

      const unique = [...new Set(data.map((item) => item.grade_name))]
      return { success: true, data: unique }
    } catch (error) {
      console.error('Error fetching unique grades:', error)
      return { success: false, error: error.message }
    }
  }

  static async getStatsByGrade(gradeName, startDate = null, endDate = null) {
    try {
      let query = supabase
        .from('pour_reports')
        .select('cast_weight, pour_temperature, die_rpm, cost_per_pound')
        .eq('grade_name', gradeName)

      if (startDate) {
        query = query.gte('pour_date', startDate)
      }

      if (endDate) {
        query = query.lte('pour_date', endDate)
      }

      const { data, error } = await query

      if (error) throw error

      const count = data.length || 1

      const sum = (key) => data.reduce((total, record) => total + (record[key] || 0), 0)

      return {
        success: true,
        data: {
          total_pours: data.length,
          total_weight: sum('cast_weight'),
          avg_weight: sum('cast_weight') / count,
          avg_temp: sum('pour_temperature') / count,
          avg_rpm: sum('die_rpm') / count,
          avg_cost_per_lb: sum('cost_per_pound') / count
        }
      }
    } catch (error) {
      console.error('Error fetching grade statistics:', error)
      return { success: false, error: error.message }
    }
  }

  static async getPourReports(page = 1, pageSize = 50, filters = {}) {
    try {
      let query = supabase
        .from('pour_reports')
        .select('*', { count: 'exact' })
        .order('pour_date', { ascending: false })
        .order('start_time', { ascending: false })

      if (filters.startDate) {
        query = query.gte('pour_date', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('pour_date', filters.endDate)
      }

      if (filters.grade_name) {
        query = query.eq('grade_name', filters.grade_name)
      }

      if (filters.shift) {
        query = query.eq('shift', filters.shift)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      const totalRecords = count ?? data.length
      const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))

      return {
        success: true,
        data,
        pagination: {
          page,
          pageSize,
          totalRecords,
          totalPages
        }
      }
    } catch (error) {
      console.error('Error fetching pour reports:', error)
      return { success: false, error: error.message }
    }
  }

  static async getPourReportById(id) {
    try {
      const { data, error } = await supabase
        .from('pour_reports')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching pour report:', error)
      return { success: false, error: error.message }
    }
  }

  static async updatePourReport(id, updates) {
    try {
      const payload = buildPourReportPayload(updates)

      const { data, error } = await supabase
        .from('pour_reports')
        .update(payload)
        .eq('id', id)
        .select()

      if (error) throw error
      return { success: true, data: data?.[0] ?? null }
    } catch (error) {
      console.error('Error updating pour report:', error)
      return { success: false, error: error.message }
    }
  }

  static async deletePourReport(id) {
    try {
      const { error } = await supabase.from('pour_reports').delete().eq('id', id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting pour report:', error)
      return { success: false, error: error.message }
    }
  }

  static async getDashboardStats() {
    try {
      const { data, error } = await supabase
        .from('pour_reports_dashboard_stats')
        .select('*')
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return { success: false, error: error.message }
    }
  }

  static async getMonthlyKpi() {
    try {
      const { data, error } = await supabase
        .from('pour_reports_kpi')
        .select('*')
        .order('month', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching monthly KPI:', error)
      return { success: false, error: error.message }
    }
  }

  static async getRecentPours(days = 7) {
    try {
      const { data, error } = await supabase.rpc('get_recent_pours', { days })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching recent pours:', error)
      return { success: false, error: error.message }
    }
  }

  static async getShiftPerformance(startDate, endDate) {
    try {
      const { data, error } = await supabase.rpc('get_shift_performance', {
        start_date: startDate,
        end_date: endDate
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching shift performance:', error)
      return { success: false, error: error.message }
    }
  }
}

export const buildPourReportEstimate = (castWeight, costPerPound) => {
  const weight = parseOptionalFloat(castWeight)
  const cost = parseOptionalFloat(costPerPound)

  if (weight === null || cost === null || weight === undefined || cost === undefined) {
    return null
  }

  return Number((weight * cost).toFixed(2))
}
