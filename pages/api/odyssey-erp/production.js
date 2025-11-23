// pages/api/odyssey-erp/production.js
// API endpoint to get production history from Odyssey ERP

import {
  getOdysseyProductionByJob,
  fetchProductionHistory,
  isOdysseyERPConfigured,
  OdysseyERPError
} from '../../../lib/odysseyERP'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      jobNumber,
      partNumber,
      workCenter,
      dateFrom,
      dateTo,
      limit,
      source
    } = req.query

    // If source is 'erp', fetch directly from Odyssey ERP
    if (source === 'erp') {
      if (!isOdysseyERPConfigured()) {
        return res.status(503).json({
          error: 'Odyssey ERP not configured'
        })
      }

      const records = await fetchProductionHistory({
        jobNumber,
        partNumber,
        workCenter,
        dateFrom,
        dateTo,
        limit: parseInt(limit) || 500
      })

      return res.status(200).json({
        source: 'odyssey_erp',
        count: records.length,
        records
      })
    }

    // Default: get from local database
    if (jobNumber) {
      const records = await getOdysseyProductionByJob(jobNumber)
      return res.status(200).json({
        source: 'local',
        count: records.length,
        records
      })
    }

    // Get all production history with filters
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(503).json({
        error: 'Database not configured'
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    let query = supabase
      .from('odyssey_production_history')
      .select('*')
      .order('production_date', { ascending: false })
      .limit(parseInt(limit) || 500)

    if (partNumber) {
      query = query.eq('part_number', partNumber)
    }

    if (workCenter) {
      query = query.eq('work_center', workCenter)
    }

    if (dateFrom) {
      query = query.gte('production_date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('production_date', dateTo)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return res.status(200).json({
      source: 'local',
      count: data?.length || 0,
      records: data || []
    })
  } catch (error) {
    console.error('Error fetching production history:', error)

    if (error instanceof OdysseyERPError) {
      return res.status(500).json({
        error: error.message,
        code: error.code
      })
    }

    return res.status(500).json({
      error: error.message || 'Failed to fetch production history'
    })
  }
}
