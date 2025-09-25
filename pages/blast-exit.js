import { useMemo, useState } from 'react'
import Head from 'next/head'

const toleranceConfig = {
  barrelDiameter: { target: 11.569, tolerance: 0.02 },
  flangeDiameter: { target: 12.87, tolerance: 0.02 },
  overallLength: { target: 59.519, tolerance: 0.02 },
  lengthToFlange: { target: 54.622, tolerance: 0.02 }
}

const statusStyles = {
  NONE: {
    input: 'bg-white border-indigo-100',
    badge: 'text-gray-500',
    indicator: 'bg-gray-300',
    label: 'Awaiting Measurement'
  },
  PASS: {
    input: 'bg-green-50 border-green-400 focus:border-green-500',
    badge: 'text-green-600',
    indicator: 'bg-green-500',
    label: 'PASS'
  },
  MARGINAL: {
    input: 'bg-amber-50 border-amber-400 focus:border-amber-500',
    badge: 'text-amber-600',
    indicator: 'bg-amber-500',
    label: 'MARGINAL'
  },
  FAIL: {
    input: 'bg-red-50 border-red-400 focus:border-red-500',
    badge: 'text-red-600',
    indicator: 'bg-red-500',
    label: 'FAIL'
  }
}

const initialFormData = {
  productNumber: '',
  heatNumber: '',
  trackingNumber: '',
  operator: '',
  shift: '',
  barrelDiameter: '',
  flangeDiameter: '',
  overallLength: '',
  lengthToFlange: '',
  barrelMethod: 'PI_TAPE',
  flangeMethod: 'PI_TAPE',
  lengthMethod: 'TAPE_MEASURE',
  lengthToFlangeMethod: 'TAPE_MEASURE',
  odMeasurement1: '',
  odMeasurement2: '',
  idMeasurement1: '',
  idMeasurement2: '',
  lengthMeasurement1: '',
  lengthMeasurement2: '',
  moldTemperature: '',
  pourTemperature: '',
  materialAppearance: '',
  materialRiskScore: '',
  dimensionalStatus: 'PASS',
  heatTreatApproved: 'true',
  surfaceCondition: '',
  requiresRework: 'false',
  notes: ''
}

const initialToleranceStatuses = Object.keys(toleranceConfig).reduce(
  (acc, key) => ({ ...acc, [key]: 'NONE' }),
  {}
)

function evaluateTolerance(value, { target, tolerance }) {
  const numericValue = parseFloat(value)

  if (!Number.isFinite(numericValue)) {
    return 'NONE'
  }

  const deviation = Math.abs(numericValue - target)

  if (deviation <= tolerance) {
    return 'PASS'
  }

  if (deviation <= tolerance * 1.5) {
    return 'MARGINAL'
  }

  return 'FAIL'
}

export default function BlastExitMeasurement() {
  const [formData, setFormData] = useState(() => ({ ...initialFormData }))
  const [toleranceStatuses, setToleranceStatuses] = useState(() => ({ ...initialToleranceStatuses }))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const isCat536 = formData.productNumber === 'CAT536-6765'
  const isGenericProduct =
    formData.productNumber === 'CAT150-3014' || formData.productNumber === 'OTHER'

  const measurementRows = useMemo(
    () => [
      {
        name: 'barrelDiameter',
        label: 'Barrel Diameter (11.5490 - 11.5890)',
        target: toleranceConfig.barrelDiameter.target,
        tolerance: toleranceConfig.barrelDiameter.tolerance,
        methodName: 'barrelMethod',
        methodOptions: [
          { label: 'Pi Tape', value: 'PI_TAPE' },
          { label: 'Caliper', value: 'CALIPER' }
        ]
      },
      {
        name: 'flangeDiameter',
        label: 'Flange Diameter (12.8500 - 12.8900)',
        target: toleranceConfig.flangeDiameter.target,
        tolerance: toleranceConfig.flangeDiameter.tolerance,
        methodName: 'flangeMethod',
        methodOptions: [
          { label: 'Pi Tape', value: 'PI_TAPE' },
          { label: 'Caliper', value: 'CALIPER' }
        ]
      },
      {
        name: 'overallLength',
        label: 'Overall Length (59.4990 - 59.5390)',
        target: toleranceConfig.overallLength.target,
        tolerance: toleranceConfig.overallLength.tolerance,
        methodName: 'lengthMethod',
        methodOptions: [
          { label: 'Tape Measure', value: 'TAPE_MEASURE' },
          { label: 'Large Caliper', value: 'CALIPER' }
        ]
      },
      {
        name: 'lengthToFlange',
        label: 'Length to Flange (54.6020 - 54.6420)',
        target: toleranceConfig.lengthToFlange.target,
        tolerance: toleranceConfig.lengthToFlange.tolerance,
        methodName: 'lengthToFlangeMethod',
        methodOptions: [
          { label: 'Tape Measure', value: 'TAPE_MEASURE' },
          { label: 'Caliper', value: 'CALIPER' }
        ]
      }
    ],
    []
  )

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }))

    if (toleranceConfig[name]) {
      setToleranceStatuses((previous) => ({
        ...previous,
        [name]: evaluateTolerance(value, toleranceConfig[name])
      }))
    }
  }

  const resetForm = () => {
    setFormData({ ...initialFormData })
    setToleranceStatuses({ ...initialToleranceStatuses })
  }

  const autoFillDefaults = () => {
    const now = new Date()
    const generatedHeat = `H${now.getTime().toString().slice(-6)}`

    setFormData((previous) => ({
      ...previous,
      productNumber: 'CAT536-6765',
      heatNumber: generatedHeat,
      operator: 'Test Operator',
      shift: '1',
      barrelDiameter: '11.5690',
      flangeDiameter: '12.8700',
      overallLength: '59.5190',
      lengthToFlange: '54.6220',
      dimensionalStatus: 'PASS',
      heatTreatApproved: 'true',
      requiresRework: 'false'
    }))

    setToleranceStatuses((previous) => ({
      ...previous,
      barrelDiameter: 'PASS',
      flangeDiameter: 'PASS',
      overallLength: 'PASS',
      lengthToFlange: 'PASS'
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    const measurementData = {
      heat_number: formData.heatNumber,
      tracking_number: formData.trackingNumber ? parseInt(formData.trackingNumber, 10) : null,
      product_number: formData.productNumber || null,
      measurement_date: new Date().toISOString().split('T')[0],
      measurement_time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      operator: formData.operator,
      shift: formData.shift ? parseInt(formData.shift, 10) : null,
      barrel_diameter_actual: formData.barrelDiameter ? parseFloat(formData.barrelDiameter) : null,
      barrel_diameter_target: toleranceConfig.barrelDiameter.target,
      barrel_diameter_tolerance: toleranceConfig.barrelDiameter.tolerance,
      flange_diameter_actual: formData.flangeDiameter ? parseFloat(formData.flangeDiameter) : null,
      flange_diameter_target: toleranceConfig.flangeDiameter.target,
      flange_diameter_tolerance: toleranceConfig.flangeDiameter.tolerance,
      overall_length_actual: formData.overallLength ? parseFloat(formData.overallLength) : null,
      overall_length_target: toleranceConfig.overallLength.target,
      overall_length_tolerance: toleranceConfig.overallLength.tolerance,
      length_to_flange_actual: formData.lengthToFlange ? parseFloat(formData.lengthToFlange) : null,
      length_to_flange_target: toleranceConfig.lengthToFlange.target,
      length_to_flange_tolerance: toleranceConfig.lengthToFlange.tolerance,
      od_measurement_1: formData.odMeasurement1 ? parseFloat(formData.odMeasurement1) : null,
      od_measurement_2: formData.odMeasurement2 ? parseFloat(formData.odMeasurement2) : null,
      id_measurement_1: formData.idMeasurement1 ? parseFloat(formData.idMeasurement1) : null,
      id_measurement_2: formData.idMeasurement2 ? parseFloat(formData.idMeasurement2) : null,
      length_measurement_1: formData.lengthMeasurement1 ? parseFloat(formData.lengthMeasurement1) : null,
      length_measurement_2: formData.lengthMeasurement2 ? parseFloat(formData.lengthMeasurement2) : null,
      mold_temperature: formData.moldTemperature ? parseFloat(formData.moldTemperature) : null,
      pour_temperature: formData.pourTemperature ? parseFloat(formData.pourTemperature) : null,
      material_appearance: formData.materialAppearance || null,
      material_risk_score: formData.materialRiskScore ? parseInt(formData.materialRiskScore, 10) : null,
      dimensional_status: formData.dimensionalStatus,
      heat_treat_approved: formData.heatTreatApproved === 'true',
      surface_condition: formData.surfaceCondition || null,
      requires_rework: formData.requiresRework === 'true',
      notes: formData.notes || null,
      measurement_method: 'MANUAL_ENTRY'
    }

    try {
      const response = await fetch('/api/dimensional-measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(measurementData)
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = result?.error || result?.message || 'Error submitting measurement. Please try again.'
        throw new Error(message)
      }

      setSuccessMessage('Measurement recorded successfully!')
      resetForm()
    } catch (error) {
      setErrorMessage(error.message || 'Error submitting measurement. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStatusBadge = (statusKey) => {
    const currentStatus = statusStyles[statusKey] ? statusKey : 'NONE'
    const styles = statusStyles[currentStatus]

    if (currentStatus === 'NONE') {
      return null
    }

    return (
      <div className={`flex items-center space-x-2 text-sm font-semibold ${styles.badge}`}>
        <span className={`w-3 h-3 rounded-full ${styles.indicator}`} />
        <span>{styles.label}</span>
      </div>
    )
  }

  const openQRPlaceholder = () => {
    window.alert('QR Scanner will be implemented in Phase 2. For now, use manual entry.')
  }

  const loadLastHeatPlaceholder = () => {
    window.alert('Loading last heat data... (Feature coming soon)')
  }

  return (
    <>
      <Head>
        <title>📏 Blast Exit Measurement</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl px-6 py-8 sm:px-10 sm:py-12">
            <header className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-3">📏 Blast Exit Measurement</h1>
              <p className="text-gray-600 text-lg">Dimensional Control System - Phase 1</p>
            </header>

            {successMessage && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 font-semibold text-center">
                ✅ {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 font-semibold text-center">
                ❌ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <section className="border-2 border-indigo-200 bg-indigo-50/60 rounded-2xl p-5 sm:p-6">
                <div className="grid sm:grid-cols-[1fr_auto] gap-4 sm:gap-6 items-end">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="productNumber">
                      Product Number <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="productNumber"
                      name="productNumber"
                      required
                      value={formData.productNumber}
                      onChange={handleFieldChange}
                      className="w-full rounded-xl border-2 border-indigo-200 bg-white px-4 py-3 text-base font-semibold text-gray-800 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="">Select Product</option>
                      <option value="CAT536-6765">CAT536-6765 (Cylinder Casting)</option>
                      <option value="CAT150-3014">CAT150-3014 (Standard Casting)</option>
                      <option value="OTHER">Other Product</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="heatNumber">
                      Heat Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="heatNumber"
                      name="heatNumber"
                      required
                      value={formData.heatNumber}
                      onChange={handleFieldChange}
                      placeholder="Enter heat number"
                      className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="operator">
                      Operator <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="operator"
                      name="operator"
                      required
                      value={formData.operator}
                      onChange={handleFieldChange}
                      placeholder="Your name"
                      className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="trackingNumber">
                      Tracking Number
                    </label>
                    <input
                      type="number"
                      id="trackingNumber"
                      name="trackingNumber"
                      value={formData.trackingNumber}
                      onChange={handleFieldChange}
                      placeholder="Optional"
                      className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="shift">
                      Shift
                    </label>
                    <select
                      id="shift"
                      name="shift"
                      value={formData.shift}
                      onChange={handleFieldChange}
                      className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="">Select Shift</option>
                      <option value="1">1st Shift</option>
                      <option value="2">2nd Shift</option>
                      <option value="3">3rd Shift</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openQRPlaceholder}
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  📱 Scan QR
                </button>
                <button
                  type="button"
                  onClick={loadLastHeatPlaceholder}
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  🔄 Last Heat
                </button>
                <button
                  type="button"
                  onClick={autoFillDefaults}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                >
                  ⚡ Quick Fill
                </button>
              </section>

              {isCat536 && (
                <section className="space-y-4 rounded-2xl border-l-4 border-indigo-400 bg-slate-50 p-5 sm:p-6">
                  <h3 className="text-xl font-semibold text-indigo-600 mb-4">CAT536-6765 Critical Dimensions</h3>
                  <div className="space-y-4">
                    {measurementRows.map((row) => {
                      const statusKey = toleranceStatuses[row.name]
                      const statusClass = statusStyles[statusKey]?.input ?? statusStyles.NONE.input

                      return (
                        <div
                          key={row.name}
                          className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-[1.1fr_1fr_auto_auto] sm:items-end"
                        >
                          <div>
                            <p className="text-base font-semibold text-gray-800">{row.label}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                              Target: {row.target.toFixed(4)}
                            </label>
                            <input
                              type="number"
                              step="0.0001"
                              inputMode="decimal"
                              name={row.name}
                              id={row.name}
                              placeholder={row.target.toFixed(4)}
                              value={formData[row.name]}
                              onChange={handleFieldChange}
                              className={`w-full rounded-xl border-2 px-4 py-3 text-center text-lg font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition ${statusClass}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Tolerance ±{row.tolerance.toFixed(4)}
                            </p>
                            {renderStatusBadge(statusKey)}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                              Method
                            </label>
                            <select
                              name={row.methodName}
                              value={formData[row.methodName]}
                              onChange={handleFieldChange}
                              className="w-full rounded-xl border-2 border-indigo-100 px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                            >
                              {row.methodOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {isGenericProduct && (
                <section className="rounded-2xl border-l-4 border-indigo-400 bg-slate-50 p-5 sm:p-6">
                  <h3 className="text-xl font-semibold text-indigo-600 mb-4">Standard Dimensional Measurements</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { id: 'odMeasurement1', label: 'OD Measurement 1' },
                      { id: 'odMeasurement2', label: 'OD Measurement 2' },
                      { id: 'idMeasurement1', label: 'ID Measurement 1' },
                      { id: 'idMeasurement2', label: 'ID Measurement 2' },
                      { id: 'lengthMeasurement1', label: 'Length Measurement 1' },
                      { id: 'lengthMeasurement2', label: 'Length Measurement 2' }
                    ].map((field) => (
                      <div key={field.id}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor={field.id}>
                          {field.label}
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          inputMode="decimal"
                          id={field.id}
                          name={field.id}
                          value={formData[field.id]}
                          onChange={handleFieldChange}
                          placeholder="0.0000"
                          className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-2xl border-l-4 border-indigo-400 bg-slate-50 p-5 sm:p-6">
                <h3 className="text-xl font-semibold text-indigo-600 mb-4">Casting Parameters (If Known)</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="moldTemperature">
                      Mold Temperature (°F)
                    </label>
                    <input
                      type="number"
                      id="moldTemperature"
                      name="moldTemperature"
                      value={formData.moldTemperature}
                      onChange={handleFieldChange}
                      placeholder="Optional"
                      className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="pourTemperature">
                      Pour Temperature (°F)
                    </label>
                    <input
                      type="number"
                      id="pourTemperature"
                      name="pourTemperature"
                      value={formData.pourTemperature}
                      onChange={handleFieldChange}
                      placeholder="Optional"
                      className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="materialAppearance">
                      Material Appearance
                    </label>
                    <select
                      id="materialAppearance"
                      name="materialAppearance"
                      value={formData.materialAppearance}
                      onChange={handleFieldChange}
                      className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="">Select Condition</option>
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair - Minor Issues</option>
                      <option value="POOR">Poor - Visible Defects</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="materialRiskScore">
                      Risk Score (1-5)
                    </label>
                    <select
                      id="materialRiskScore"
                      name="materialRiskScore"
                      value={formData.materialRiskScore}
                      onChange={handleFieldChange}
                      className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="">Auto Calculate</option>
                      <option value="1">1 - Low Risk</option>
                      <option value="2">2 - Slight Risk</option>
                      <option value="3">3 - Moderate Risk</option>
                      <option value="4">4 - High Risk</option>
                      <option value="5">5 - Very High Risk</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border-l-4 border-indigo-400 bg-slate-50 p-5 sm:p-6">
                <h3 className="text-xl font-semibold text-indigo-600 mb-4">Quality Assessment</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="dimensionalStatus">
                      Overall Dimensional Status
                    </label>
                    <select
                      id="dimensionalStatus"
                      name="dimensionalStatus"
                      required
                      value={formData.dimensionalStatus}
                      onChange={handleFieldChange}
                      className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="PASS">✅ PASS - All dimensions OK</option>
                      <option value="MARGINAL">⚠️ MARGINAL - Close to limits</option>
                      <option value="FAIL">❌ FAIL - Out of tolerance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="heatTreatApproved">
                      Approve for Heat Treatment?
                    </label>
                    <select
                      id="heatTreatApproved"
                      name="heatTreatApproved"
                      required
                      value={formData.heatTreatApproved}
                      onChange={handleFieldChange}
                      className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="true">✅ YES - Send to Heat Treat</option>
                      <option value="false">❌ NO - Hold for Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="surfaceCondition">
                      Surface Condition
                    </label>
                    <select
                      id="surfaceCondition"
                      name="surfaceCondition"
                      value={formData.surfaceCondition}
                      onChange={handleFieldChange}
                      className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="">Select Condition</option>
                      <option value="SMOOTH">Smooth - No Issues</option>
                      <option value="ROUGH">Rough Surface</option>
                      <option value="INCLUSIONS">Visible Inclusions</option>
                      <option value="POROSITY">Surface Porosity</option>
                      <option value="COLD_SHUT">Cold Shut</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="requiresRework">
                      Requires Rework?
                    </label>
                    <select
                      id="requiresRework"
                      name="requiresRework"
                      value={formData.requiresRework}
                      onChange={handleFieldChange}
                      className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes - Minor Rework</option>
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="notes">
                  Notes &amp; Observations
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleFieldChange}
                  placeholder="Any observations about casting quality, measurement challenges, or process conditions..."
                  className="w-full rounded-2xl border-2 border-indigo-100 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </section>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-lg font-semibold uppercase tracking-wide text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
                >
                  {isSubmitting ? '⏳ Submitting...' : '📏 Submit Measurement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
