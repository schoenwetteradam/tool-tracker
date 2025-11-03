/**
 * API endpoint for QR code scanning
 * Handles START and STOP events from QR code scans
 */

import {
  recordMachineStateEvent,
  getQRCodeDefinition,
  getUnpairedMachineEvents
} from '../../lib/supabase.js'

export default async function handler(req, res) {
  // Handle GET requests for unpaired events
  if (req.method === 'GET') {
    try {
      const { equipmentNumber } = req.query

      const unpaired = await getUnpairedMachineEvents(equipmentNumber || null)

      return res.status(200).json({
        success: true,
        count: unpaired.length,
        unpaired_events: unpaired
      })
    } catch (error) {
      console.error('❌ Error fetching unpaired events:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  }

  // Handle POST requests for recording scans
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      qr_code,
      equipment_number,
      operator,
      operator_id,
      shift,
      work_center,
      part_number,
      job_number,
      notes,
      tool_change_id,
      // Allow manual override of event type (if not using QR code definitions)
      event_type: manualEventType
    } = req.body

    // Validate required fields
    if (!qr_code && !manualEventType) {
      return res.status(400).json({
        success: false,
        error: 'qr_code or event_type is required'
      })
    }

    if (!equipment_number) {
      return res.status(400).json({
        success: false,
        error: 'equipment_number is required'
      })
    }

    let eventType = manualEventType
    let qrDefinition = null

    // Look up QR code definition if QR code provided
    if (qr_code) {
      qrDefinition = await getQRCodeDefinition(qr_code)

      if (!qrDefinition) {
        return res.status(404).json({
          success: false,
          error: 'QR code not found or inactive',
          qr_code
        })
      }

      eventType = qrDefinition.event_type

      // If QR code has specific equipment, validate it matches
      if (qrDefinition.equipment_number && qrDefinition.equipment_number !== equipment_number) {
        return res.status(400).json({
          success: false,
          error: 'QR code is for different equipment',
          expected_equipment: qrDefinition.equipment_number,
          provided_equipment: equipment_number
        })
      }
    }

    // Validate event type
    if (!['START', 'STOP'].includes(eventType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event_type. Must be START or STOP'
      })
    }

    // Record the machine state event
    const event = await recordMachineStateEvent({
      equipment_number,
      event_type: eventType,
      operator,
      operator_id,
      shift,
      work_center,
      part_number,
      job_number,
      qr_code_data: qr_code,
      notes,
      tool_change_id
    })

    // Get any remaining unpaired events for this equipment
    const unpaired = await getUnpairedMachineEvents(equipment_number)

    return res.status(201).json({
      success: true,
      event,
      event_type: eventType,
      message: `Machine ${eventType} event recorded successfully`,
      unpaired_events_count: unpaired.length,
      unpaired_events: unpaired
    })
  } catch (error) {
    console.error('❌ Error in QR code scan API:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
