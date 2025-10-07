import { useRef, useState } from 'react'
import Head from 'next/head'

const initialStats = {
  totalRecords: 0,
  uniqueHeats: 0,
  uniqueGrades: 0,
  dateRange: '-'
}

const parseDate = dateStr => {
  if (!dateStr || !dateStr.trim()) return ''
  const parts = dateStr.split('/')
  if (parts.length !== 3) return ''
  const [month, day, year] = parts
  const fullYear = year.length === 2 ? `20${year}` : year
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const parseTime = timeStr => {
  if (!timeStr || !timeStr.trim()) return ''
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i)
  if (!match) return ''
  let [, hours, minutes, period] = match
  hours = parseInt(hours, 10)
  if (Number.isNaN(hours)) return ''

  if (period) {
    const normalized = period.toUpperCase()
    if (normalized === 'PM' && hours !== 12) hours += 12
    if (normalized === 'AM' && hours === 12) hours = 0
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00`
}

const parseBool = value => {
  if (value === null || value === undefined) return ''
  const normalized = value.toString().trim().toUpperCase()
  if (!normalized) return ''
  if (normalized === 'Y' || normalized === 'YES') return 'true'
  if (normalized === 'N' || normalized === 'NO') return 'false'
  return ''
}

const parseNum = value => {
  if (value === null || value === undefined || value === '') return ''
  const num = parseFloat(value)
  return Number.isNaN(num) ? '' : num
}

const parseIntValue = value => {
  if (value === null || value === undefined || value === '') return ''
  const num = parseInt(value, 10)
  return Number.isNaN(num) ? '' : num
}

const parseCsvText = text => {
  if (!text) return []
  let sanitized = text
  if (sanitized.charCodeAt(0) === 0xfeff) {
    sanitized = sanitized.slice(1)
  }

  const rows = []
  let current = ''
  let row = []
  let inQuotes = false

  for (let index = 0; index < sanitized.length; index += 1) {
    const char = sanitized[index]

    if (char === '"') {
      if (inQuotes && sanitized[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current)
      current = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && sanitized[index + 1] === '\n') {
        index += 1
      }
      row.push(current)
      rows.push(row)
      row = []
      current = ''
    } else {
      current += char
    }
  }

  if (current !== '' || row.length) {
    row.push(current)
    rows.push(row)
  }

  return rows.filter(cells => cells.some(cell => (cell || '').trim() !== ''))
}

const rowsToObjects = rows => {
  if (!rows.length) return []

  const headers = rows[0].map(cell => (cell ?? '').trim())
  const dataRows = rows.slice(1).filter(row => row.some(cell => (cell || '').trim() !== ''))

  return dataRows.map(row => {
    const record = {}
    headers.forEach((header, index) => {
      if (!header) return
      record[header] = row[index] ?? ''
    })
    return record
  })
}

const escapeCsvCell = value => {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

const buildCsvFromObjects = data => {
  if (!data.length) return ''
  const headers = Object.keys(data[0])
  const lines = [headers.map(escapeCsvCell).join(',')]

  data.forEach(row => {
    const cells = headers.map(header => escapeCsvCell(row[header] ?? ''))
    lines.push(cells.join(','))
  })

  return lines.join('\r\n')
}

const transformRows = rows => {
  const transformed = rows
    .map(row => ({
      heat_number: row['Heat Number']?.trim() || '',
      pour_date: parseDate(row['Date']),
      grade_name: row['Grade Name']?.trim() || '',
      stock_code: row['Stock Code']?.trim() || '',
      job_number: parseIntValue(row['Job\nNumber'] || row['Job Number']),
      cast_weight: parseNum(row['Cast Wgt']),
      cmop: parseIntValue(row['CMOP']),
      dash_number: row['Dash No.']?.toString().trim() || '',
      die_number: row['Die #']?.toString().trim() || '',
      test_bars: row['Test Bars']?.trim() || '',
      charpy_bars: row['Charpy Bars']?.trim() || '',
      shift: parseIntValue(row['Shift']),
      melter_id: parseIntValue(row['Melter']),
      furnace_number: parseIntValue(row['Furn No.']),
      power_percent: parseNum(row['Power %']),
      new_lining: parseBool(row['New Lining N/Y ?']),
      ladle_number: parseIntValue(row['Ladle No.']),
      start_time: parseTime(row['Start Time']),
      tap_time: parseTime(row['TapTime']),
      tap_temp: parseIntValue(row['Tap Temp']),
      pour_temperature: parseIntValue(row['Pour Temp']),
      liquid_canon: row['Liq. Canon Y/N']?.trim() || '',
      cannon_psi: parseNum(row['Cannon PSI']),
      bath_weight_carried_in: parseNum(row['Bath Weight Carried In']),
      rice_hulls_amount: parseNum(row['Rice Hulls Amt.']),
      liquid_amount: parseNum(row['Amt  Liq.'] || row['Amt Liq.']),
      liquid_type: row['Liq. Type']?.trim() || '',
      wash_thickness: parseNum(row['Wash Thick']),
      wash_pass: parseIntValue(row['Wash Pass']),
      pour_time_seconds: parseIntValue(row['Pour Time (Sec)']),
      wash_type: row['Wash Type']?.trim() || '',
      die_temp_before_pour: parseIntValue(row['Die Temp Before Pour']),
      die_rpm: parseIntValue(row['Die RPM']),
      baume: parseNum(row['Baume']),
      spin_time_minutes: parseIntValue(row['Spin Time (Min)']),
      cost_per_pound: parseNum(row['   $ / Lb'] || row[' $ / Lb']),
      full_heat_number:
        row['Full Heat\nNumber']?.trim() || row['Full Heat Number']?.trim() || '',
      ship_date_of_rings: parseDate(row['Ship Date of Ring(s)']),
      comments: row['Comments']?.trim() || '',
      operation: parseIntValue(row['Operation'])
    }))
    .filter(row => row.full_heat_number)

  const uniqueHeats = new Set()
  const uniqueGrades = new Set()
  const dates = []

  transformed.forEach(row => {
    if (row.full_heat_number) uniqueHeats.add(row.full_heat_number)
    if (row.grade_name) uniqueGrades.add(row.grade_name)
    if (row.pour_date) dates.push(row.pour_date)
  })

  dates.sort()

  const stats = {
    totalRecords: transformed.length,
    uniqueHeats: uniqueHeats.size,
    uniqueGrades: uniqueGrades.size,
    dateRange:
      dates.length === 0
        ? '-'
        : `${dates[0]} to ${dates[dates.length - 1]}`.replace(/2025-/g, '')
  }

  return { transformed, stats }
}

const PourReportTransformerPage = () => {
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cleanedData, setCleanedData] = useState([])
  const [stats, setStats] = useState(initialStats)
  const [hasResults, setHasResults] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('Pour Report and Cast Data 2025 FY.csv')

  const resetProcessing = () => {
    setProgress(0)
    setStats(initialStats)
    setHasResults(false)
    setCleanedData([])
  }

  const handleFile = async file => {
    if (!file) return

    setSelectedFileName(file.name)
    setIsProcessing(true)
    setHasResults(false)
    setErrorMessage('')
    setProgress(15)

    try {
      const text = await file.text()
      if (!text.trim()) {
        throw new Error('EMPTY_FILE')
      }

      setProgress(40)
      const rows = parseCsvText(text)
      if (!rows.length) {
        throw new Error('NO_ROWS')
      }

      const parsedRecords = rowsToObjects(rows)
      setProgress(60)
      const { transformed, stats: computedStats } = transformRows(parsedRecords)
      setCleanedData(transformed)
      setStats(computedStats)
      setHasResults(true)
      setProgress(100)
    } catch (err) {
      console.error('Unable to process CSV file:', err)
      setErrorMessage('Unable to process CSV file. Please verify the format and try again.')
      resetProcessing()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = event => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer?.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = event => {
    const file = event.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const downloadCleanedCsv = () => {
    if (!cleanedData.length) return
    const csv = buildCsvFromObjects(cleanedData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'pour_reports_supabase_ready.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <>
      <Head>
        <title>Pour Reports CSV Transformer | Tool Tracker</title>
        <meta
          name="description"
          content="Convert legacy melt & pour CSV exports into Supabase-ready uploads."
        />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-spuncast-sky/40 via-white to-spuncast-navy/30 py-12">
        <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white/95 p-8 shadow-2xl shadow-spuncast-navy/20 backdrop-blur">
          <header className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-spuncast-navy">Pour Reports CSV Transformer</h1>
            <p className="mt-2 text-sm font-medium text-spuncast-slate">
              Transform legacy pour report exports to match the Supabase <code>pour_reports</code> schema.
            </p>
          </header>

          <div className="mb-6 rounded-2xl border-l-4 border-spuncast-sky/70 bg-spuncast-sky/20 p-5 text-left text-spuncast-navy">
            <p className="font-semibold">What this tool does</p>
            <p className="mt-1 text-sm text-spuncast-slate">
              Cleans up headers, normalizes dates &amp; times, and produces a Supabase-ready CSV for direct upload.
            </p>
          </div>

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border-l-4 border-red-500/80 bg-red-50 p-5 text-red-700">
              <p className="font-semibold">Unable to process file</p>
              <p className="mt-1 text-sm">{errorMessage}</p>
            </div>
          ) : null}

          <section>
            <div
              role="button"
              tabIndex={0}
              onClick={handleBrowseClick}
              onDragOver={event => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center transition ${
                isDragging ? 'scale-[1.01] border-spuncast-navy bg-spuncast-sky/20' : 'border-spuncast-sky/60 bg-spuncast-sky/10'
              }`}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-spuncast-sky to-spuncast-navy text-white shadow-lg">
                <span className="text-3xl">📂</span>
              </div>
              <p className="text-lg font-semibold text-spuncast-navy">Click to select or drag &amp; drop CSV file</p>
              <p className="mt-2 text-sm text-spuncast-slate">{selectedFileName}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>

            {isProcessing ? (
              <div className="mt-8">
                <div className="h-2 w-full overflow-hidden rounded-full bg-spuncast-sky/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-spuncast-sky to-spuncast-navy transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-3 text-center text-sm font-semibold text-spuncast-navy">Processing...</p>
              </div>
            ) : null}
          </section>

          {hasResults ? (
            <section className="mt-10 space-y-6">
              <div className="rounded-2xl border-l-4 border-emerald-500/80 bg-emerald-50 p-5 text-emerald-700">
                <p className="font-semibold">Transformation complete</p>
                <p className="mt-1 text-sm">Your cleaned CSV is ready to upload to Supabase.</p>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-gradient-to-br from-spuncast-sky to-spuncast-navy p-5 text-center text-white shadow-lg">
                  <dt className="text-xs uppercase tracking-[0.2em] text-white/70">Total Records</dt>
                  <dd className="mt-2 text-3xl font-semibold">{stats.totalRecords.toLocaleString()}</dd>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-spuncast-navy to-spuncast-red p-5 text-center text-white shadow-lg">
                  <dt className="text-xs uppercase tracking-[0.2em] text-white/70">Unique Heats</dt>
                  <dd className="mt-2 text-3xl font-semibold">{stats.uniqueHeats.toLocaleString()}</dd>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-spuncast-red to-spuncast-sky p-5 text-center text-white shadow-lg">
                  <dt className="text-xs uppercase tracking-[0.2em] text-white/70">Grades</dt>
                  <dd className="mt-2 text-3xl font-semibold">{stats.uniqueGrades.toLocaleString()}</dd>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-spuncast-slate to-spuncast-navy p-5 text-center text-white shadow-lg">
                  <dt className="text-xs uppercase tracking-[0.2em] text-white/70">Date Range</dt>
                  <dd className="mt-2 text-lg font-semibold">{stats.dateRange}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={downloadCleanedCsv}
                className="w-full rounded-2xl bg-gradient-to-r from-spuncast-sky to-spuncast-navy px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:from-spuncast-sky/90 hover:to-spuncast-navyDark disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!cleanedData.length}
              >
                ⬇️ Download Cleaned CSV
              </button>

              <div className="rounded-2xl border-l-4 border-amber-500/80 bg-amber-50 p-5 text-amber-700">
                <p className="font-semibold">Before uploading to Supabase</p>
                <ol className="mt-2 list-decimal space-y-1 pl-6 text-sm">
                  <li>Run the unique constraint fix SQL</li>
                  <li>Upload this cleaned CSV into the <code>pour_reports</code> table</li>
                  <li>Allow triggers to refresh downstream KPI tables automatically</li>
                </ol>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </>
  )
}

export default PourReportTransformerPage

