/**
 * Machine Runtime QR Code Scanner Component
 * Allows operators to scan START and STOP QR codes to track machine runtime
 */

import { useState, useEffect } from 'react'

export default function MachineRuntimeScanner() {
  const [equipment, setEquipment] = useState('')
  const [operator, setOperator] = useState('')
  const [shift, setShift] = useState(1)
  const [workCenter, setWorkCenter] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [jobNumber, setJobNumber] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [unpairedEvents, setUnpairedEvents] = useState([])
  const [lastEvent, setLastEvent] = useState(null)

  // Load unpaired events on mount
  useEffect(() => {
    if (equipment) {
      loadUnpairedEvents()
    }
  }, [equipment])

  const loadUnpairedEvents = async () => {
    try {
      const params = new URLSearchParams()
      if (equipment) params.append('equipmentNumber', equipment)

      const response = await fetch(`/api/qr-code-scan?${params}`)
      const data = await response.json()

      if (data.success) {
        setUnpairedEvents(data.unpaired_events || [])
      }
    } catch (error) {
      console.error('Error loading unpaired events:', error)
    }
  }

  const handleScan = async (eventType) => {
    if (!equipment) {
      setMessage({ type: 'error', text: 'Please enter equipment number' })
      return
    }

    if (!operator) {
      setMessage({ type: 'error', text: 'Please enter operator name' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/qr-code-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_code: qrCode || `MACHINE_${eventType}_GLOBAL`,
          equipment_number: equipment,
          operator,
          shift: parseInt(shift),
          work_center: workCenter,
          part_number: partNumber,
          job_number: jobNumber,
          event_type: eventType
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({
          type: 'success',
          text: `${eventType} recorded at ${new Date(data.event.event_timestamp).toLocaleString()}`
        })
        setLastEvent(data.event)
        setUnpairedEvents(data.unpaired_events || [])
        setQrCode('') // Clear QR code input
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to record event'
        })
      }
    } catch (error) {
      console.error('Error recording event:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Network error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickScan = (eventType) => {
    handleScan(eventType)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Machine Runtime Tracker</h1>

      {/* Info box */}
      <div style={{
        padding: '15px',
        backgroundColor: '#e3f2fd',
        borderRadius: '4px',
        marginBottom: '20px',
        border: '1px solid #2196f3'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>📱 Scan QR Code or Click START/STOP</p>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
          Track when the machine starts and stops running. Multiple start/stop cycles are automatically tracked.
        </p>
      </div>

      {/* Message display */}
      {message && (
        <div style={{
          padding: '15px',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          borderRadius: '4px',
          marginBottom: '20px',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Form */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Equipment Number *
          </label>
          <input
            type="text"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value.toUpperCase())}
            placeholder="e.g., LATHE-001"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Operator Name *
          </label>
          <input
            type="text"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            placeholder="Enter your name"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Shift
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value={1}>1st Shift</option>
              <option value={2}>2nd Shift</option>
              <option value={3}>3rd Shift</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Work Center
            </label>
            <input
              type="text"
              value={workCenter}
              onChange={(e) => setWorkCenter(e.target.value)}
              placeholder="Optional"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Part Number
            </label>
            <input
              type="text"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="Optional"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Job Number
            </label>
            <input
              type="text"
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              placeholder="Optional"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            QR Code (Optional - or use buttons below)
          </label>
          <input
            type="text"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            placeholder="Scan or enter QR code"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Big START/STOP buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <button
            onClick={() => handleQuickScan('START')}
            disabled={loading}
            style={{
              padding: '30px',
              fontSize: '24px',
              fontWeight: 'bold',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            ▶ START
          </button>

          <button
            onClick={() => handleQuickScan('STOP')}
            disabled={loading}
            style={{
              padding: '30px',
              fontSize: '24px',
              fontWeight: 'bold',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            ⏹ STOP
          </button>
        </div>
      </div>

      {/* Last event display */}
      {lastEvent && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Last Event:</p>
          <p style={{ margin: '5px 0' }}>
            Type: <strong>{lastEvent.event_type}</strong>
          </p>
          <p style={{ margin: '5px 0' }}>
            Time: {new Date(lastEvent.event_timestamp).toLocaleString()}
          </p>
          <p style={{ margin: '5px 0' }}>
            Paired: {lastEvent.paired ? '✅ Yes' : '⏳ Waiting for pair'}
          </p>
        </div>
      )}

      {/* Unpaired events warning */}
      {unpairedEvents.length > 0 && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>⚠️ Unpaired Events ({unpairedEvents.length})</p>
          {unpairedEvents.map(event => (
            <div key={event.id} style={{ marginTop: '10px', fontSize: '14px' }}>
              <strong>{event.event_type}</strong> at {new Date(event.event_timestamp).toLocaleString()}
              {event.operator && ` - ${event.operator}`}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <h3 style={{ marginTop: 0 }}>How to use:</h3>
        <ol style={{ paddingLeft: '20px' }}>
          <li>Enter your equipment number and operator name</li>
          <li>Click <strong>START</strong> when beginning work on the machine</li>
          <li>Click <strong>STOP</strong> when finishing or pausing</li>
          <li>Multiple START/STOP cycles between tool changes are automatically tracked</li>
          <li>All runtime is summed up and associated with the next tool change</li>
        </ol>

        <h3>QR Codes:</h3>
        <p>
          If you have QR codes, you can scan or enter them instead of clicking the buttons.
          Default codes: <code>MACHINE_START_GLOBAL</code> and <code>MACHINE_STOP_GLOBAL</code>
        </p>
      </div>
    </div>
  )
}
