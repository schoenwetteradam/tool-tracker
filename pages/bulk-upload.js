import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, CheckCircle, AlertCircle, FileText, Loader } from 'lucide-react'

export default function BulkUpload() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState(null)
  const [errors, setErrors] = useState([])
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/)
    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))

    const data = []
    for (let i = 1; i < lines.length; i += 1) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''))
      const row = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || null
      })

      data.push(row)
    }

    return data
  }

  const parseDate = (dateStr) => {
    if (!dateStr) return null

    const parts = dateStr.split('/')
    if (parts.length === 3) {
      const month = parts[0].padStart(2, '0')
      const day = parts[1].padStart(2, '0')
      let year = parts[2]

      if (year.length === 2) {
        year = parseInt(year, 10) > 50 ? '19' + year : '20' + year
      }

      return `${year}-${month}-${day}`
    }

    return null
  }

  const parseNumber = (val) => {
    if (!val || val === '0' || val === '') return null
    const num = parseFloat(val)
    return Number.isNaN(num) ? null : num
  }

  const parseInteger = (val) => {
    if (!val || val === '0' || val === '') return null
    const num = parseInt(val, 10)
    return Number.isNaN(num) ? null : num
  }

  const transformPourReportRow = (row) => {
    return {
      heat_number: row.heat_number || null,
      pour_date: parseDate(row.date),
      grade_name: row.grade_name || null,
      stock_code: row.stock_code || null,
      job_number: parseInteger(row.job_number),
      cast_weight: parseNumber(row.cast_weight),
      cmop: parseInteger(row.cmop),
      dash_number: row.dash_number || null,
      die_number: parseInteger(row.die_number),
      shift: parseInteger(row.shift),
      melter_id: parseInteger(row.melter || row.melter_id),
      furnace_number: parseInteger(row.furnace_number),
      power_percent: parseNumber(row.power_percent),
      new_lining: (row.new_lining || '').toUpperCase() === 'Y',
      ladle_number: parseInteger(row.ladle_number),
      start_time: row.start_time || null,
      tap_time: row.tap_time || null,
      tap_temp: parseInteger(row.tap_temp),
      pour_temperature: parseInteger(row.pour_tempurature || row.pour_temperature),
      liquid_canon: parseNumber(row.liquid_canon),
      canon_psi: parseNumber(row.canon_psi),
      bath_weight_carried_in: parseNumber(row.bath_weight_carried_in),
      rice_hulls_amount: parseNumber(row.rice_hulls_amount),
      liquid_amount: parseNumber(row.liquid_amount),
      liquid_type: row.liquid_type || null,
      wash_thickness: parseNumber(row.wash_thickness),
      wash_pass: parseInteger(row.wash_pass),
      pour_time_seconds: parseInteger(row.pour_time_seconds),
      wash_type: row.wash_type || null,
      die_temp_before_pour: parseInteger(row.die_temp_before_pour),
      die_rpm: parseInteger(row.die_rpm),
      baume: parseNumber(row.Baume || row.baume),
      spin_time_minutes: parseInteger(row.spin_time_minutes),
      cost_per_pound: parseNumber(row.cost_per_pound),
      full_heat_number: row.full_heat_number || null,
      comments: row.Comments || row.comments || null,
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first')
      return
    }

    setUploading(true)
    setProgress({ current: 0, total: 0 })
    setErrors([])
    setResults(null)

    try {
      const text = await file.text()
      const rawData = parseCSV(text)

      const cleanedData = rawData
        .map((row, index) => ({ row, originalIndex: index }))
        .filter(
          ({ row }) =>
            row?.heat_number && row?.date && row?.full_heat_number && row.full_heat_number !== '-'
        )
        .map(({ row, originalIndex }) => {
          const trimmed = { ...row }

          if (typeof trimmed.heat_number === 'string') {
            trimmed.heat_number = trimmed.heat_number.trim()
          }

          if (typeof trimmed.full_heat_number === 'string') {
            trimmed.full_heat_number = trimmed.full_heat_number.trim()
          }

          if (typeof trimmed.grade_name === 'string') {
            trimmed.grade_name = trimmed.grade_name.trim()
          }

          return { row: trimmed, originalIndex }
        })

      setProgress({ current: 0, total: cleanedData.length })

      const rowErrors = []
      const transformedData = cleanedData
        .map(({ row, originalIndex }) => {
          try {
            return transformPourReportRow(row)
          } catch (error) {
            rowErrors.push(`Row ${originalIndex + 2}: ${error.message}`)
            return null
          }
        })
        .filter((row) => row !== null && row.heat_number)

      let successCount = 0
      let failCount = 0
      const batchErrors = []
      const batchSize = 500

      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize)

        try {
          const { error } = await supabase
            .from('pour_reports')
            .upsert(batch, {
              onConflict: 'full_heat_number',
              ignoreDuplicates: false,
            })
            .select()

          if (error) {
            console.error('Batch error:', error)
            batchErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
            failCount += batch.length
          } else {
            successCount += batch.length
          }
        } catch (error) {
          console.error('Batch exception:', error)
          batchErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
          failCount += batch.length
        }

        setProgress({ current: i + batch.length, total: transformedData.length })
      }

      if (successCount > 0) {
        try {
          await supabase.rpc('refresh_all_kpis', {
            p_start_date: '2024-01-01',
            p_end_date: new Date().toISOString().split('T')[0],
          })
        } catch (refreshErr) {
          console.warn('KPI refresh failed:', refreshErr)
        }
      }

      setResults({
        total: rawData.length,
        success: successCount,
        failed: failCount,
        skipped: rawData.length - transformedData.length,
      })

      if (rowErrors.length > 0 || batchErrors.length > 0) {
        setErrors([...rowErrors, ...batchErrors])
      }
    } catch (error) {
      console.error('Upload error:', error)
      setErrors([error.message])
    } finally {
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setResults(null)
    setErrors([])
    setProgress({ current: 0, total: 0 })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Data Upload</h1>
          <p className="text-gray-600 mt-1">Import Pour Report data from CSV files</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            File Format Requirements
          </h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• CSV file with headers in first row</li>
            <li>• Expected columns: heat_number, date, grade_name, stock_code, cast_weight, shift, etc.</li>
            <li>• Date format: MM/DD/YY (e.g., 02/04/25)</li>
            <li>• Duplicate heat numbers (full_heat_number) will be updated</li>
            <li>• Maximum file size: 50 MB</li>
          </ul>
        </div>

        {!results && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />

              {!file ? (
                <>
                  <p className="text-lg font-medium text-gray-700 mb-2">Drag and drop your CSV file here</p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <label className="inline-block">
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                    <span className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 inline-block">
                      Browse Files
                    </span>
                  </label>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Upload &amp; Import
                        </>
                      )}
                    </button>

                    {!uploading && (
                      <button onClick={resetUpload} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {uploading && progress.total > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Uploading records...</span>
                  <span>
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {results && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Complete!</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Total Rows</p>
                <p className="text-3xl font-bold text-gray-900">{results.total}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-green-600 mb-1">Imported</p>
                <p className="text-3xl font-bold text-green-600">{results.success}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-sm text-red-600 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600">{results.failed}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-sm text-yellow-600 mb-1">Skipped</p>
                <p className="text-3xl font-bold text-yellow-600">{results.skipped}</p>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-2">Errors encountered:</h3>
                    <div className="text-sm text-red-800 max-h-40 overflow-y-auto space-y-1">
                      {errors.slice(0, 10).map((error, index) => (
                        <div key={index}>• {error}</div>
                      ))}
                      {errors.length > 10 && (
                        <div className="text-red-600 font-medium mt-2">...and {errors.length - 10} more errors</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={resetUpload} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Upload Another File
              </button>
              <a href="/kpi-dashboard" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-block">
                View KPI Dashboard
              </a>
            </div>
          </div>
        )}

        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Expected CSV Format (first few columns):</h3>
          <div className="bg-white rounded border border-gray-200 p-4 overflow-x-auto">
            <pre className="text-xs text-gray-700">{`heat_number,date,grade_name,stock_code,job_number,cast_weight,shift,melter,...
24A2540,02/04/25,CAT3,CAT536-6765,159469,844,3,1234,...
24A2541,02/04/25,BRONZE,BRZ-123,159470,920,1,1235,...`}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
