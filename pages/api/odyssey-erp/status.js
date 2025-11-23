// pages/api/odyssey-erp/status.js
// API endpoint to get Odyssey ERP configuration and sync status

import {
  getOdysseyERPConfig,
  getSyncHistory,
  testConnection
} from '../../../lib/odysseyERP'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const config = getOdysseyERPConfig()

    // Get sync history
    const syncHistory = await getSyncHistory({ limit: 10 })

    // Get sync status from database view
    let syncStatus = []
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
      })

      const { data } = await supabase
        .from('odyssey_sync_status')
        .select('*')

      syncStatus = data || []
    }

    return res.status(200).json({
      config,
      syncStatus,
      recentHistory: syncHistory
    })
  } catch (error) {
    console.error('Error getting Odyssey ERP status:', error)
    return res.status(500).json({
      error: error.message || 'Failed to get status'
    })
  }
}
