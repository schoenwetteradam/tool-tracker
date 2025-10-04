import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, RefreshCw, Save } from 'lucide-react'
import { PourReportService, buildPourReportEstimate } from '../lib/pourReportService.js'

const getDefaultFormData = () => ({
  heat_number: '',
  pour_date: new Date().toISOString().split('T')[0],
  grade_name: '',
  stock_code: '',
  job_number: '',
  cast_weight: '',
  cmop: '',
  dash_number: '',
  die_number: '',
  shift: '1',
  melter_id: '',
  furnace_number: '',
  new_lining: false,
  start_time: '',
  pour_temperature: '',
  liquid_amount: '',
  liquid_type: '',
  wash_thickness: '',
  wash_pass: '',
  wash_type: '',
  die_temp_before_pour: '',
  die_rpm: '',
  spin_time_minutes: '',
  cost_per_pound: '',
  full_heat_number: ''
})

const PourReportForm = () => {
  const [formData, setFormData] = useState(getDefaultFormData)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value
    }))
  }, [])

  const generateFullHeatNumber = useCallback(() => {
    setFormData((previous) => {
      if (!previous.heat_number || !previous.dash_number) {
        return previous
      }

      const fullNumber = `${previous.heat_number}-${previous.dash_number}`
      if (previous.full_heat_number === fullNumber) {
        return previous
      }

      return {
        ...previous,
        full_heat_number: fullNumber
      }
    })
  }, [])

  const validateForm = useCallback(() => {
    const requiredFields = ['heat_number', 'pour_date', 'grade_name', 'cast_weight', 'shift', 'full_heat_number']
    const missing = requiredFields.filter((field) => !formData[field])

    if (missing.length > 0) {
      setStatus({
        type: 'error',
        message: `Missing required fields: ${missing.join(', ')}`
      })
      return false
    }

    return true
  }, [formData])

  const handleReset = useCallback(() => {
    setFormData(getDefaultFormData())
    setStatus({ type: '', message: '' })
  }, [])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      if (!validateForm()) {
        return
      }

      setLoading(true)
      setStatus({ type: '', message: '' })

      const result = await PourReportService.createPourReport(formData)

      if (result.success) {
        setStatus({ type: 'success', message: 'Pour report saved successfully!' })
        setTimeout(() => {
          handleReset()
        }, 2000)
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to save pour report' })
      }

      setLoading(false)
    },
    [formData, handleReset, validateForm]
  )

  const estimatedCost = useMemo(
    () => buildPourReportEstimate(formData.cast_weight, formData.cost_per_pound),
    [formData.cast_weight, formData.cost_per_pound]
  )

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Pour Report Data Entry</h1>

        {status.message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              status.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heat Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="heat_number"
                  value={formData.heat_number}
                  onChange={handleChange}
                  onBlur={generateFullHeatNumber}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dash Number
                </label>
                <input
                  type="text"
                  name="dash_number"
                  value={formData.dash_number}
                  onChange={handleChange}
                  onBlur={generateFullHeatNumber}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Heat Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_heat_number"
                  value={formData.full_heat_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pour Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="pour_date"
                  value={formData.pour_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift <span className="text-red-500">*</span>
                </label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="1">Shift 1</option>
                  <option value="2">Shift 2</option>
                  <option value="3">Shift 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="grade_name"
                  value={formData.grade_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Code</label>
                <input
                  type="text"
                  name="stock_code"
                  value={formData.stock_code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Number</label>
                <input
                  type="number"
                  name="job_number"
                  value={formData.job_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">Casting Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cast Weight (lbs) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="cast_weight"
                  value={formData.cast_weight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CMOP</label>
                <input
                  type="number"
                  name="cmop"
                  value={formData.cmop}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Die Number</label>
                <input
                  type="number"
                  name="die_number"
                  value={formData.die_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Die RPM</label>
                <input
                  type="number"
                  name="die_rpm"
                  value={formData.die_rpm}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Spin Time (minutes)</label>
                <input
                  type="number"
                  name="spin_time_minutes"
                  value={formData.spin_time_minutes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Die Temp Before Pour (°F)
                </label>
                <input
                  type="number"
                  name="die_temp_before_pour"
                  value={formData.die_temp_before_pour}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">
              Furnace &amp; Melting
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Melter ID</label>
                <input
                  type="number"
                  name="melter_id"
                  value={formData.melter_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Furnace Number</label>
                <input
                  type="number"
                  name="furnace_number"
                  value={formData.furnace_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  name="new_lining"
                  checked={formData.new_lining}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">New Lining</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pour Temperature (°F)
                </label>
                <input
                  type="number"
                  name="pour_temperature"
                  value={formData.pour_temperature}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Liquid Amount</label>
                <input
                  type="number"
                  step="0.01"
                  name="liquid_amount"
                  value={formData.liquid_amount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Liquid Type</label>
                <input
                  type="text"
                  name="liquid_type"
                  value={formData.liquid_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">Wash Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wash Thickness</label>
                <input
                  type="number"
                  step="0.001"
                  name="wash_thickness"
                  value={formData.wash_thickness}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wash Pass</label>
                <input
                  type="number"
                  name="wash_pass"
                  value={formData.wash_pass}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wash Type</label>
                <input
                  type="text"
                  name="wash_type"
                  value={formData.wash_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">Cost Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost per Pound ($)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="cost_per_pound"
                  value={formData.cost_per_pound}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {estimatedCost !== null && (
                <div className="col-span-1 md:col-span-2 bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Estimated Total Cost</p>
                  <p className="text-2xl font-bold text-blue-600">${estimatedCost.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-6 border-t">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Pour Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PourReportForm
