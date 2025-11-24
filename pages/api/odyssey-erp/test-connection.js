// pages/api/odyssey-erp/test-connection.js
// API endpoint to test connection to Odyssey ERP

import { testConnection, getOdysseyERPConfig } from '../../../lib/odysseyERP'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const config = getOdysseyERPConfig()

    if (!config.configured) {
      return res.status(503).json({
        success: false,
        message: 'Odyssey ERP not configured',
        config
      })
    }

    const result = await testConnection()

    return res.status(result.success ? 200 : 500).json({
      ...result,
      config: {
        apiUrl: config.apiUrl,
        companyId: config.companyId
      }
    })
  } catch (error) {
    console.error('Odyssey ERP connection test error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Connection test failed',
      code: error.code
    })
  }
}
