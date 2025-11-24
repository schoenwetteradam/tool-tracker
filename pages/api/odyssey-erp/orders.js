// pages/api/odyssey-erp/orders.js
// API endpoint to get shop orders from Odyssey ERP

import {
  getOdysseyShopOrders,
  fetchShopOrders,
  isOdysseyERPConfigured,
  OdysseyERPError
} from '../../../lib/odysseyERP'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { search, status, limit, source, dateFrom, dateTo } = req.query

    // If source is 'erp', fetch directly from Odyssey ERP
    if (source === 'erp') {
      if (!isOdysseyERPConfigured()) {
        return res.status(503).json({
          error: 'Odyssey ERP not configured'
        })
      }

      const orders = await fetchShopOrders({
        jobNumber: search,
        status,
        dateFrom,
        dateTo,
        limit: parseInt(limit) || 100
      })

      return res.status(200).json({
        source: 'odyssey_erp',
        count: orders.length,
        orders
      })
    }

    // Default: get from local database
    const orders = await getOdysseyShopOrders({
      search,
      status,
      limit: parseInt(limit) || 100
    })

    return res.status(200).json({
      source: 'local',
      count: orders.length,
      orders
    })
  } catch (error) {
    console.error('Error fetching orders:', error)

    if (error instanceof OdysseyERPError) {
      return res.status(500).json({
        error: error.message,
        code: error.code
      })
    }

    return res.status(500).json({
      error: error.message || 'Failed to fetch orders'
    })
  }
}
