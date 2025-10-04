import React, { useState } from 'react'
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
      if (rawData.length === 0) {
        setErrors(['The selected file does not contain any rows.'])
        return
      }

      const importableRows = rawData.filter((row) => {
        const heatNumber = row?.heat_number
        const date = row?.date
        const fullHeatNumber = row?.full_heat_number

        const hasValue = (value) => {
          if (value === undefined || value === null) return false
          const normalized = String(value).trim()
          return normalized !== '' && normalized !== '-'
        }

        return hasValue(heatNumber) && hasValue(date) && hasValue(fullHeatNumber)
      })

      if (importableRows.length === 0) {
        setErrors(['No rows with heat_number, date, and full_heat_number were found.'])
        return
      }

      setProgress({ current: 0, total: importableRows.length })

      const response = await fetch('/api/upload/pour-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: rawData, skipDuplicates: true }),
      })

      const responseBody = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = responseBody?.error || 'Failed to import pour report data.'
        const responseErrors = Array.isArray(responseBody?.errors) && responseBody.errors.length > 0
          ? responseBody.errors
          : [message]

        setErrors(responseErrors)
        return
      }

      setProgress({ current: importableRows.length, total: importableRows.length })

      const resultsPayload = responseBody?.results || {}

      setResults({
        total: resultsPayload.total ?? rawData.length,
        success: resultsPayload.imported ?? 0,
        failed: resultsPayload.failed ?? 0,
        skipped: resultsPayload.skipped ?? 0,
        skippedInvalid: resultsPayload.skippedInvalid ?? 0,
        skippedDuplicates: resultsPayload.skippedDuplicates ?? 0,
      })

      if (Array.isArray(responseBody?.errors) && responseBody.errors.length > 0) {
        setErrors(responseBody.errors)
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

            {(results.skippedInvalid > 0 || results.skippedDuplicates > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {results.skippedInvalid > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-700 font-semibold mb-1">Skipped - Invalid Rows</p>
                    <p className="text-2xl font-bold text-yellow-700">{results.skippedInvalid}</p>
                    <p className="text-xs text-yellow-700 mt-2">
                      Rows missing heat number, date, or full heat number were ignored.
                    </p>
                  </div>
                )}
                {results.skippedDuplicates > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700 font-semibold mb-1">Skipped - Duplicates</p>
                    <p className="text-2xl font-bold text-blue-700">{results.skippedDuplicates}</p>
                    <p className="text-xs text-blue-700 mt-2">
                      Duplicate full heat numbers already in the import were skipped.
                    </p>
                  </div>
                )}
              </div>
            )}

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
