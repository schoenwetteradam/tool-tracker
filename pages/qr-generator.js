import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

const QR_TYPE_LABELS = {
  measurement: 'Measurement App',
  'tool-change': 'Tool Change App',
  both: 'Both Apps'
}

const statusColor = status => {
  if (!status) return 'text-emerald-600'
  const normalized = status.toLowerCase()
  if (normalized === 'inactive' || normalized === 'down') return 'text-rose-600'
  return 'text-emerald-600'
}

const formatEquipmentTitle = equipment => {
  if (!equipment) return ''
  const number = equipment.equipment_number || 'Unknown'
  const description = equipment.description ? ` - ${equipment.description}` : ''
  return `${number}${description}`
}

const sanitizeFileName = value => value.replace(/[^a-zA-Z0-9]+/g, '_') || 'equipment'

const buildQrImageUrl = (value, size = 300) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`

const downloadQrImage = async (src, fileName) => {
  const response = await fetch(src)
  if (!response.ok) {
    throw new Error('Unable to download QR code image')
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = `${fileName}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(blobUrl)
}

const QRGeneratorPage = () => {
  const [activeTab, setActiveTab] = useState('equipment')
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [qrType, setQrType] = useState('measurement')
  const [baseUrl, setBaseUrl] = useState('https://tool-tracker-eight.vercel.app/')
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [equipmentQrTitle, setEquipmentQrTitle] = useState('')
  const [equipmentQrGenerated, setEquipmentQrGenerated] = useState(false)
  const [equipmentQrSrc, setEquipmentQrSrc] = useState('')
  const [qrGenerationError, setQrGenerationError] = useState('')

  const [customUrl, setCustomUrl] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customGeneratedUrl, setCustomGeneratedUrl] = useState('')
  const [customQrTitle, setCustomQrTitle] = useState('Custom QR Code')
  const [customQrGenerated, setCustomQrGenerated] = useState(false)
  const [customQrSrc, setCustomQrSrc] = useState('')

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    let isMounted = true

    const loadEquipment = async () => {
      if (!supabaseConfigured) {
        setError('Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error: queryError } = await supabase
          .from('equipment')
          .select('*')
          .eq('active', true)
          .order('equipment_number', { ascending: true })

        if (!isMounted) return

        if (queryError) {
          throw queryError
        }

        setEquipment(data || [])
        setError('')
      } catch (err) {
        console.error('Error loading equipment:', err)
        setEquipment([])
        setError(err?.message || 'Unable to load equipment from Supabase.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadEquipment()

    return () => {
      isMounted = false
    }
  }, [supabaseConfigured])

  useEffect(() => {
    if (!selectedEquipment) {
      setGeneratedUrl('')
      setEquipmentQrGenerated(false)
      return
    }

    const trimmedBase = (baseUrl || '').trim()
    if (!trimmedBase) {
      setGeneratedUrl('')
      setEquipmentQrGenerated(false)
      return
    }

    const sanitizedBase = trimmedBase.replace(/\/$/, '')
    const equipmentNumber = selectedEquipment.equipment_number || ''
    const workCenter = selectedEquipment.work_center || ''

    let path = '/'
    if (qrType === 'measurement') path = '/measurement'
    else if (qrType === 'both') path = '/select'

    const url = `${sanitizedBase}${path}?equipment=${encodeURIComponent(equipmentNumber)}&workcenter=${encodeURIComponent(workCenter)}`
    setGeneratedUrl(url)
    setEquipmentQrGenerated(false)
    setEquipmentQrSrc('')
    setQrGenerationError('')
  }, [selectedEquipment, qrType, baseUrl])

  useEffect(() => {
    if (!selectedEquipment) return

    const stillExists = equipment.some(item => item.id === selectedEquipment.id)
    if (!stillExists) {
      setSelectedEquipment(null)
    }
  }, [equipment, selectedEquipment])

  const filteredEquipment = useMemo(() => {
    if (!filter.trim()) return equipment

    const query = filter.trim().toLowerCase()
    return equipment.filter(item => {
      const fields = [
        item.equipment_number,
        item.description,
        item.work_center,
        item.equipment_type,
        item.location
      ]

      return fields.some(field => (field || '').toLowerCase().includes(query))
    })
  }, [equipment, filter])

  const handleSelectEquipment = item => {
    setSelectedEquipment(item)
  }

  const handleGenerateEquipmentQR = () => {
    if (!selectedEquipment || !generatedUrl) {
      alert('Please select equipment and ensure a valid base URL.')
      return
    }

    try {
      const typeLabel = QR_TYPE_LABELS[qrType] || 'QR Code'
      const qrSrc = buildQrImageUrl(generatedUrl)
      setEquipmentQrTitle(`${formatEquipmentTitle(selectedEquipment)} (${typeLabel})`)
      setEquipmentQrSrc(qrSrc)
      setEquipmentQrGenerated(true)
      setQrGenerationError('')
    } catch (err) {
      console.error('Error preparing equipment QR code:', err)
      setQrGenerationError('Unable to generate QR code. Please try again.')
      setEquipmentQrGenerated(false)
      setEquipmentQrSrc('')
    }
  }

  const handleDownloadEquipmentQR = async () => {
    if (!equipmentQrGenerated || !equipmentQrSrc) return

    const equipmentTitle = formatEquipmentTitle(selectedEquipment)
    if (!equipmentTitle) return

    try {
      await downloadQrImage(equipmentQrSrc, `QR_${sanitizeFileName(equipmentTitle)}`)
    } catch (err) {
      console.error('Error downloading equipment QR:', err)
      alert(`Error downloading QR code: ${err?.message || 'Unknown error'}`)
    }
  }

  const handlePrintEquipmentQR = () => {
    if (!equipmentQrGenerated || typeof window === 'undefined' || !equipmentQrSrc) return

    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print.')
      return
    }

    const equipmentTitle = formatEquipmentTitle(selectedEquipment)

    printWindow.document.write(`
      <html>
        <head>
          <title>${equipmentTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 24px; }
            img { max-width: 320px; }
            .url { font-size: 12px; word-break: break-all; margin-top: 16px; }
          </style>
        </head>
        <body>
          <h2>${equipmentTitle}</h2>
          <p>Work Center: ${selectedEquipment?.work_center || 'N/A'}</p>
          <img src="${equipmentQrSrc}" alt="QR Code" />
          <div class="url">${generatedUrl}</div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleCopyEquipmentUrl = () => {
    if (typeof navigator === 'undefined' || !generatedUrl) return

    navigator.clipboard
      .writeText(generatedUrl)
      .then(() => alert('URL copied to clipboard!'))
      .catch(err => {
        console.error('Could not copy URL:', err)
      })
  }

  const handleGenerateCustomQR = () => {
    if (!customUrl.trim()) {
      alert('Please enter a URL for the custom QR code.')
      return
    }

    const trimmedUrl = customUrl.trim()

    try {
      const qrSrc = buildQrImageUrl(trimmedUrl)
      setCustomGeneratedUrl(trimmedUrl)
      setCustomQrTitle(customTitle.trim() || 'Custom QR Code')
      setCustomQrGenerated(true)
      setCustomQrSrc(qrSrc)
      setQrGenerationError('')
    } catch (err) {
      console.error('Error preparing custom QR code:', err)
      setQrGenerationError('Unable to generate QR code. Please try again.')
      setCustomQrGenerated(false)
      setCustomQrSrc('')
    }
  }

  const handleDownloadCustomQR = async () => {
    if (!customQrGenerated || !customQrSrc) return

    const safeTitle = sanitizeFileName(customQrTitle)

    try {
      await downloadQrImage(customQrSrc, safeTitle)
    } catch (err) {
      console.error('Error downloading custom QR:', err)
      alert(`Error downloading QR code: ${err?.message || 'Unknown error'}`)
    }
  }

  const handlePrintCustomQR = () => {
    if (!customQrGenerated || typeof window === 'undefined' || !customQrSrc) return

    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print.')
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${customQrTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 24px; }
            img { max-width: 320px; }
            .url { font-size: 12px; word-break: break-all; margin-top: 16px; }
          </style>
        </head>
        <body>
          <h2>${customQrTitle}</h2>
          <img src="${customQrSrc}" alt="Custom QR Code" />
          <div class="url">${customGeneratedUrl}</div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleCopyCustomUrl = () => {
    if (typeof navigator === 'undefined' || !customGeneratedUrl) return

    navigator.clipboard
      .writeText(customGeneratedUrl)
      .then(() => alert('URL copied to clipboard!'))
      .catch(err => {
        console.error('Could not copy URL:', err)
      })
  }

  return (
    <>
      <Head>
        <title>QR Code Generator</title>
      </Head>

      <main
        id="main-content"
        className="min-h-screen bg-gradient-to-br from-spuncast-navy via-spuncast-navyDark to-spuncast-red p-6"
      >
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/60 bg-white p-8 shadow-brand">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-spuncast-navy">🏷️ QR Code Generator</h1>
            <p className="mt-2 text-spuncast-slate/80">Generate QR codes for equipment and custom URLs</p>
          </div>

          <div className="mt-8 rounded-xl bg-spuncast-sky p-2">
            <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-spuncast-navy">
              <button
                type="button"
                className={`rounded-lg px-4 py-3 transition-all ${
                  activeTab === 'equipment'
                    ? 'bg-spuncast-navy text-white shadow'
                    : 'hover:bg-spuncast-sky/80'
                }`}
                onClick={() => setActiveTab('equipment')}
              >
                📱 Equipment QR Codes
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-3 transition-all ${
                  activeTab === 'custom'
                    ? 'bg-spuncast-navy text-white shadow'
                    : 'hover:bg-spuncast-sky/80'
                }`}
                onClick={() => setActiveTab('custom')}
              >
                ⚙️ Custom QR Codes
              </button>
            </div>
          </div>

          {qrGenerationError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700" role="alert">
              {qrGenerationError}
            </div>
          )}

          <div className="mt-6">
            <section className={activeTab === 'equipment' ? 'block' : 'hidden'}>
              {loading ? (
                <div
                  className="rounded-2xl bg-spuncast-sky p-10 text-center text-spuncast-navy"
                  role="status"
                  aria-live="polite"
                >
                  🔄 Loading equipment from database...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700" role="alert">
                  ❌ {error}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="equipmentFilter" className="block text-sm font-semibold text-spuncast-slate">
                      Filter Equipment
                    </label>
                    <input
                      id="equipmentFilter"
                      type="text"
                      value={filter}
                      onChange={event => setFilter(event.target.value)}
                      placeholder="Search by equipment number, description, or work center..."
                      className="mt-2 w-full rounded-xl border-2 border-spuncast-navy/10 p-3 text-sm shadow-sm transition focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
                    />
                  </div>

                  <div className="space-y-3">
                    {filteredEquipment.length === 0 ? (
                      <p className="rounded-2xl bg-spuncast-sky p-6 text-center text-sm text-spuncast-navy">
                        No active equipment found.
                      </p>
                    ) : (
                      filteredEquipment.map(item => {
                        const isSelected = selectedEquipment?.id === item.id
                        const statusClass = statusColor(item.status)

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectEquipment(item)}
                            className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                              isSelected
                                ? 'border-spuncast-navy bg-spuncast-sky shadow'
                                : 'border-spuncast-navy/10 bg-white hover:-translate-y-0.5 hover:border-spuncast-navy/40 hover:shadow'
                            }`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-spuncast-navy">
                                  {item.equipment_number} - {item.description}
                                </h3>
                                <p className="text-sm text-spuncast-slate/80">
                                  Work Center: {item.work_center || 'N/A'} | Type: {item.equipment_type || 'N/A'} | Location: {item.location || 'N/A'}
                                </p>
                              </div>
                              <div className="text-right text-xs text-spuncast-slate/70 sm:text-sm">
                                <div className={statusClass}>{item.status || 'ACTIVE'}</div>
                                <div>ID: {item.id}</div>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>

                  {selectedEquipment && (
                    <div className="space-y-6 rounded-2xl bg-spuncast-sky p-6">
                      <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h4 className="text-lg font-semibold text-spuncast-navy">{formatEquipmentTitle(selectedEquipment)}</h4>
                        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm text-spuncast-slate/80 sm:grid-cols-2">
                          <div>
                            <dt className="font-medium text-spuncast-slate">Work Center</dt>
                            <dd>{selectedEquipment.work_center || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-spuncast-slate">Type</dt>
                            <dd>{selectedEquipment.equipment_type || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-spuncast-slate">Location</dt>
                            <dd>{selectedEquipment.location || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-spuncast-slate">Status</dt>
                            <dd className={statusColor(selectedEquipment.status)}>{selectedEquipment.status || 'ACTIVE'}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label htmlFor="qrType" className="block text-sm font-semibold text-spuncast-slate">
                            QR Code Type
                          </label>
                          <select
                            id="qrType"
                            value={qrType}
                            onChange={event => setQrType(event.target.value)}
                            className="mt-2 w-full rounded-xl border-2 border-spuncast-navy/10 p-3 text-sm shadow-sm transition focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
                          >
                            <option value="measurement">📏 Measurement App</option>
                            <option value="tool-change">🔧 Tool Change App</option>
                            <option value="both">🔄 Both Apps</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="baseUrl" className="block text-sm font-semibold text-spuncast-slate">
                            Base URL
                          </label>
                          <input
                            id="baseUrl"
                            type="text"
                            value={baseUrl}
                            onChange={event => setBaseUrl(event.target.value)}
                            className="mt-2 w-full rounded-xl border-2 border-spuncast-navy/10 p-3 text-sm shadow-sm transition focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-spuncast-navy to-spuncast-red px-6 py-3 font-semibold text-white shadow-lg transition hover:translate-y-[-2px] hover:shadow-xl"
                        onClick={handleGenerateEquipmentQR}
                      >
                        🎯 Generate QR Code
                      </button>

                      <div
                        className="rounded-2xl bg-white p-6 text-center shadow-lg"
                        style={{ display: equipmentQrGenerated && equipmentQrSrc ? 'block' : 'none' }}
                        role="status"
                        aria-live="polite"
                      >
                        <h3 className="text-lg font-semibold text-spuncast-navy">{equipmentQrTitle}</h3>
                        <div className="mt-3 rounded-xl border-2 border-spuncast-navy/10 bg-spuncast-sky p-3 text-sm text-spuncast-navy">
                          {generatedUrl}
                        </div>
                        <div className="mt-4 flex justify-center">
                          <img
                            src={equipmentQrSrc}
                            alt="Generated equipment QR code"
                            className="max-w-xs rounded-lg border border-spuncast-navy/10"
                          />
                        </div>
                        <div className="mt-5 flex flex-wrap justify-center gap-3">
                          <button
                            type="button"
                            className="rounded-full bg-spuncast-navy px-4 py-2 text-sm font-semibold text-white shadow hover:bg-spuncast-navyDark"
                            onClick={handleDownloadEquipmentQR}
                          >
                            💾 Download PNG
                          </button>
                          <button
                            type="button"
                            className="rounded-full bg-spuncast-navy px-4 py-2 text-sm font-semibold text-white shadow hover:bg-spuncast-navyDark"
                            onClick={handlePrintEquipmentQR}
                          >
                            🖨️ Print
                          </button>
                          <button
                            type="button"
                            className="rounded-full bg-spuncast-navy px-4 py-2 text-sm font-semibold text-white shadow hover:bg-spuncast-navyDark"
                            onClick={handleCopyEquipmentUrl}
                          >
                            📋 Copy URL
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className={activeTab === 'custom' ? 'block' : 'hidden'}>
              <div className="space-y-6 rounded-2xl bg-spuncast-sky p-6">
                <div>
                  <label htmlFor="customUrl" className="block text-sm font-semibold text-spuncast-slate">
                    Custom URL
                  </label>
                  <input
                    id="customUrl"
                    type="text"
                    value={customUrl}
                    onChange={event => {
                      setCustomUrl(event.target.value)
                      setCustomQrGenerated(false)
                      setCustomQrSrc('')
                      setQrGenerationError('')
                    }}
                    placeholder="Enter any URL..."
                    className="mt-2 w-full rounded-xl border-2 border-spuncast-navy/10 p-3 text-sm shadow-sm transition focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
                  />
                </div>

                <div>
                  <label htmlFor="customTitle" className="block text-sm font-semibold text-spuncast-slate">
                    QR Code Title (optional)
                  </label>
                  <input
                    id="customTitle"
                    type="text"
                    value={customTitle}
                    onChange={event => {
                      setCustomTitle(event.target.value)
                      setCustomQrGenerated(false)
                      setCustomQrSrc('')
                      setQrGenerationError('')
                    }}
                    placeholder="Title to display with the QR code"
                    className="mt-2 w-full rounded-xl border-2 border-spuncast-navy/10 p-3 text-sm shadow-sm transition focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
                  />
                </div>

                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-spuncast-navy to-spuncast-red px-6 py-3 font-semibold text-white shadow-lg transition hover:translate-y-[-2px] hover:shadow-xl"
                  onClick={handleGenerateCustomQR}
                >
                  🎯 Generate Custom QR
                </button>

                <div
                  className="rounded-2xl bg-white p-6 text-center shadow-lg"
                  style={{ display: customQrGenerated && customQrSrc ? 'block' : 'none' }}
                  role="status"
                  aria-live="polite"
                >
                  <h3 className="text-lg font-semibold text-spuncast-navy">{customQrTitle}</h3>
                  <div className="mt-3 rounded-xl border-2 border-spuncast-navy/10 bg-spuncast-sky p-3 text-sm text-spuncast-navy">
                    {customGeneratedUrl}
                  </div>
                  <div className="mt-4 flex justify-center">
                    <img
                      src={customQrSrc}
                      alt="Generated custom QR code"
                      className="max-w-xs rounded-lg border border-spuncast-navy/10"
                    />
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      className="rounded-full bg-spuncast-navy px-4 py-2 text-sm font-semibold text-white shadow hover:bg-spuncast-navyDark"
                      onClick={handleDownloadCustomQR}
                    >
                      💾 Download PNG
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-spuncast-navy px-4 py-2 text-sm font-semibold text-white shadow hover:bg-spuncast-navyDark"
                      onClick={handlePrintCustomQR}
                    >
                      🖨️ Print
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-spuncast-navy px-4 py-2 text-sm font-semibold text-white shadow hover:bg-spuncast-navyDark"
                      onClick={handleCopyCustomUrl}
                    >
                      📋 Copy URL
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="font-semibold text-spuncast-navy transition hover:text-spuncast-red">
              &larr; Back to Tool Change Form
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

export default QRGeneratorPage
