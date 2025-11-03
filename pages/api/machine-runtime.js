/**
 * API endpoint for machine runtime tracking
 * Provides access to runtime data between tool changes
 */

import {
  getMachineRuntimeBetweenToolChanges,
  getMachineRuntimeSummary,
  getMachineRuntimeAnalytics,
  getMachineRuntimeByShift,
  getMachineRuntimeByOperator,
  calculateRuntimeMetrics
} from '../../lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      type = 'summary',
      equipmentNumber,
      startDate,
      endDate,
      daysBack = 30,
      monthsBack = 3,
      operator
    } = req.query

    let data

    switch (type) {
      case 'between-changes':
        // Get detailed runtime between each tool change
        data = await getMachineRuntimeBetweenToolChanges(
          equipmentNumber || null,
          startDate || null,
          endDate || null
        )

        // Include calculated metrics
        const metrics = calculateRuntimeMetrics(data)

        return res.status(200).json({
          type: 'between-changes',
          count: data.length,
          data,
          metrics
        })

      case 'summary':
        // Get summary statistics for machines
        data = await getMachineRuntimeSummary(
          equipmentNumber || null,
          parseInt(daysBack) || 30
        )

        return res.status(200).json({
          type: 'summary',
          count: data.length,
          data,
          period_days: parseInt(daysBack) || 30
        })

      case 'analytics':
        // Get daily aggregated analytics
        data = await getMachineRuntimeAnalytics(
          equipmentNumber || null,
          parseInt(daysBack) || 30
        )

        return res.status(200).json({
          type: 'analytics',
          count: data.length,
          data,
          period_days: parseInt(daysBack) || 30
        })

      case 'by-shift':
        // Get runtime grouped by shift
        data = await getMachineRuntimeByShift(
          equipmentNumber || null,
          parseInt(daysBack) || 30
        )

        return res.status(200).json({
          type: 'by-shift',
          count: data.length,
          data,
          period_days: parseInt(daysBack) || 30
        })

      case 'by-operator':
        // Get runtime grouped by operator
        data = await getMachineRuntimeByOperator(
          operator || null,
          parseInt(monthsBack) || 3
        )

        return res.status(200).json({
          type: 'by-operator',
          count: data.length,
          data,
          period_months: parseInt(monthsBack) || 3
        })

      default:
        return res.status(400).json({
          error: 'Invalid type parameter',
          valid_types: ['between-changes', 'summary', 'analytics', 'by-shift', 'by-operator']
        })
    }
  } catch (error) {
    console.error('❌ Error in machine-runtime API:', error)
    return res.status(500).json({
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
