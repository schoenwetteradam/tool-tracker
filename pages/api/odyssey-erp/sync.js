// pages/api/odyssey-erp/sync.js
// API endpoint to sync data from Odyssey ERP

import {
  syncProducts,
  syncShopOrders,
  syncProductionHistory,
  syncInventory,
  syncAll,
  isOdysseyERPConfigured,
  OdysseyERPError
} from '../../../lib/odysseyERP'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check if Odyssey ERP is configured
  if (!isOdysseyERPConfigured()) {
    return res.status(503).json({
      error: 'Odyssey ERP not configured',
      message: 'Please set ODYSSEY_ERP_API_KEY or ODYSSEY_ERP_USERNAME/ODYSSEY_ERP_PASSWORD environment variables'
    })
  }

  try {
    const { type } = req.query
    const options = req.body || {}

    let result

    switch (type) {
      case 'products':
        result = await syncProducts(options)
        break

      case 'shop-orders':
      case 'orders':
        result = await syncShopOrders(options)
        break

      case 'production':
      case 'production-history':
        result = await syncProductionHistory(options)
        break

      case 'inventory':
        result = await syncInventory(options)
        break

      case 'all':
      default:
        result = await syncAll(options)
        break
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      type: type || 'all',
      ...result
    })
  } catch (error) {
    console.error('Odyssey ERP sync error:', error)

    if (error instanceof OdysseyERPError) {
      return res.status(error.code === 'AUTH_NOT_CONFIGURED' ? 503 : 500).json({
        error: error.message,
        code: error.code,
        details: error.details
      })
    }

    return res.status(500).json({
      error: error.message || 'Sync failed',
      details: error.toString()
    })
  }
}
