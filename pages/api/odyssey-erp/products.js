// pages/api/odyssey-erp/products.js
// API endpoint to get products from Odyssey ERP

import {
  getOdysseyProducts,
  fetchProducts,
  isOdysseyERPConfigured,
  OdysseyERPError
} from '../../../lib/odysseyERP'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { search, category, limit, source } = req.query

    // If source is 'erp', fetch directly from Odyssey ERP
    if (source === 'erp') {
      if (!isOdysseyERPConfigured()) {
        return res.status(503).json({
          error: 'Odyssey ERP not configured'
        })
      }

      const products = await fetchProducts({
        productNumber: search,
        category,
        limit: parseInt(limit) || 100
      })

      return res.status(200).json({
        source: 'odyssey_erp',
        count: products.length,
        products
      })
    }

    // Default: get from local database
    const products = await getOdysseyProducts({
      search,
      category,
      limit: parseInt(limit) || 100
    })

    return res.status(200).json({
      source: 'local',
      count: products.length,
      products
    })
  } catch (error) {
    console.error('Error fetching products:', error)

    if (error instanceof OdysseyERPError) {
      return res.status(500).json({
        error: error.message,
        code: error.code
      })
    }

    return res.status(500).json({
      error: error.message || 'Failed to fetch products'
    })
  }
}
