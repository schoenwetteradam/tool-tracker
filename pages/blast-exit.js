import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'

const statusStyles = {
  NONE: {
    input: 'border-amber-200 bg-white',
    badge: 'text-gray-500',
    indicator: 'bg-gray-300',
    label: 'Awaiting Measurement'
  },
  PASS: {
    input: 'border-emerald-400 bg-emerald-50',
    badge: 'text-emerald-600',
    indicator: 'bg-emerald-500',
    label: 'PASS'
  },
  MARGINAL: {
    input: 'border-amber-400 bg-amber-50',
    badge: 'text-amber-600',
    indicator: 'bg-amber-500',
    label: 'MARGINAL'
  },
  FAIL: {
    input: 'border-rose-400 bg-rose-50',
    badge: 'text-rose-600',
    indicator: 'bg-rose-500',
    label: 'FAIL'
  }
}

const cylinderFields = ['barrelDiameter', 'flangeDiameter', 'overallLength', 'lengthToFlange']

const productSpecs = {
  'CAT536-6765': {
    type: 'cylinder',
    productFamily: '536_SERIES',
    info: 'Highest priority cylinder. Use measurement sheet 41A2360.',
    barrelTarget: 11.569,
    barrelTol: 0.02,
    flangeTarget: 12.87,
    flangeTol: 0.02,
    lengthTarget: 59.519,
    lengthTol: 0.02,
    flangeToTarget: 54.622,
    flangeToTol: 0.02
  },
  'CAT536-6763': {
    type: 'cylinder',
    productFamily: '536_SERIES',
    info: 'High priority cylinder. Similar to 6765 procedures.',
    barrelTarget: 11.5,
    barrelTol: 0.02,
    flangeTarget: 12.8,
    flangeTol: 0.02,
    lengthTarget: 58,
    lengthTol: 0.02,
    flangeToTarget: 53,
    flangeToTol: 0.02
  },
  'CAT536-6764': {
    type: 'cylinder',
    productFamily: '536_SERIES',
    info: 'High priority cylinder. Part of 536 family.',
    barrelTarget: 11.4,
    barrelTol: 0.02,
    flangeTarget: 12.7,
    flangeTol: 0.02,
    lengthTarget: 57.5,
    lengthTol: 0.02,
    flangeToTarget: 52.5,
    flangeToTol: 0.02
  },
  'CAT150-3014': {
    type: 'large_casting',
    productFamily: 'LARGE_SERIES',
    info: 'Large casting. Use standard measurement procedures for large components.'
  },
  'CAT150-3011': {
    type: 'large_casting',
    productFamily: 'LARGE_SERIES',
    info: 'Large casting ~1450 lbs. High scrap cost - verify all dimensions carefully.',
    lengthTarget: 60,
    lengthTol: 0.04
  },
  'CAT4T-6051': {
    type: 'heavy_duty',
    productFamily: '4T_SERIES',
    info: 'Heavy duty casting. Multiple OD measurements required. Focus on machining surfaces.',
    lengthTarget: 45,
    lengthTol: 0.03
  },
  'CAT4T-5937': {
    type: 'heavy_duty',
    productFamily: '4T_SERIES',
    info: 'Heavy duty casting. Check structural integrity and multiple OD locations.',
    lengthTarget: 42,
    lengthTol: 0.03
  },
  'CAT4T-4774': {
    type: 'heavy_duty',
    productFamily: '4T_SERIES',
    info: 'Heavy duty casting. Medium priority component.'
  },
  'CAT121-2077': {
    type: 'large_assembly',
    productFamily: 'LARGE_SERIES',
    info: 'Large assembly. Follow standard measurement procedures.'
  },
  'CAT522-7552': {
    type: 'large_assembly',
    productFamily: 'LARGE_SERIES',
    info: 'Large assembly. Ensure all dimensions are recorded accurately.'
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
  od1: '',
  od2: '',
  od3: '',
  id1: '',
  id2: '',
  length1: '',
  materialAppearance: '',
  dimensionalStatus: 'PASS',
  heatTreatApproved: 'true',
  surfaceCondition: '',
  notes: ''
}

const initialToleranceStatuses = cylinderFields.reduce((accumulator, key) => {
  return { ...accumulator, [key]: 'NONE' }
}, {})

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

  const selectedSpec = formData.productNumber ? productSpecs[formData.productNumber] : null
  const isCylinder = selectedSpec?.type === 'cylinder'
  const showGenericMeasurements = Boolean(formData.productNumber && !isCylinder)

  const toleranceMap = useMemo(() => {
    if (!isCylinder || !selectedSpec) {
      return {}
    }

    return {
      barrelDiameter: { target: selectedSpec.barrelTarget, tolerance: selectedSpec.barrelTol },
      flangeDiameter: { target: selectedSpec.flangeTarget, tolerance: selectedSpec.flangeTol },
      overallLength: { target: selectedSpec.lengthTarget, tolerance: selectedSpec.lengthTol },
      lengthToFlange: { target: selectedSpec.flangeToTarget, tolerance: selectedSpec.flangeToTol }
    }
  }, [isCylinder, selectedSpec])

  const cylinderMeasurements = useMemo(() => {
    if (!isCylinder || !selectedSpec) {
      return []
    }

    return [
      {
        key: 'barrelDiameter',
        label: 'Barrel Diameter',
        target: selectedSpec.barrelTarget,
        tolerance: selectedSpec.barrelTol
      },
      {
        key: 'flangeDiameter',
        label: 'Flange Diameter',
        target: selectedSpec.flangeTarget,
        tolerance: selectedSpec.flangeTol
      },
      {
        key: 'overallLength',
        label: 'Overall Length',
        target: selectedSpec.lengthTarget,
        tolerance: selectedSpec.lengthTol
      },
      {
        key: 'lengthToFlange',
        label: 'Length to Flange',
        target: selectedSpec.flangeToTarget,
        tolerance: selectedSpec.flangeToTol
      }
    ]
  }, [isCylinder, selectedSpec])

  useEffect(() => {
    setToleranceStatuses(() => {
      const updated = { ...initialToleranceStatuses }

      cylinderFields.forEach((field) => {
        const config = toleranceMap[field]
        const value = formData[field]
        updated[field] = config ? evaluateTolerance(value, config) : 'NONE'
      })

      return updated
    })
  }, [formData.barrelDiameter, formData.flangeDiameter, formData.overallLength, formData.lengthToFlange, toleranceMap])

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }))
  }

  const resetFormFields = () => {
    setFormData({ ...initialFormData })
    setToleranceStatuses({ ...initialToleranceStatuses })
  }

  const autoFill536 = () => {
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
      materialAppearance: 'GOOD',
      dimensionalStatus: 'PASS',
      heatTreatApproved: 'true'
    }))
  }

  const autoFill4T = () => {
    const now = new Date()
    const generatedHeat = `H${now.getTime().toString().slice(-6)}`

    setFormData((previous) => ({
      ...previous,
      productNumber: 'CAT4T-6051',
      heatNumber: generatedHeat,
      operator: 'Test Operator',
      shift: '1',
      od1: '12.5000',
      od2: '8.7500',
      od3: '6.2500',
      length1: '45.0000',
      materialAppearance: 'GOOD',
      dimensionalStatus: 'PASS',
      heatTreatApproved: 'true'
    }))
  }

  const autoFillLarge = () => {
    const now = new Date()
    const generatedHeat = `H${now.getTime().toString().slice(-6)}`

    setFormData((previous) => ({
      ...previous,
      productNumber: 'CAT150-3011',
      heatNumber: generatedHeat,
      operator: 'Test Operator',
      shift: '1',
      od1: '24.0000',
      od2: '18.5000',
      length1: '60.0000',
      materialAppearance: 'GOOD',
      dimensionalStatus: 'PASS',
      heatTreatApproved: 'true'
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    const spec = selectedSpec

    const measurementData = {
      heat_number: formData.heatNumber,
      tracking_number: formData.trackingNumber ? parseInt(formData.trackingNumber, 10) : null,
      product_number: formData.productNumber || null,
      product_family: spec?.productFamily || 'OTHER',
      measurement_date: new Date().toISOString().split('T')[0],
      measurement_time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      operator: formData.operator,
      shift: formData.shift ? parseInt(formData.shift, 10) : null,
      barrel_diameter_actual: formData.barrelDiameter ? parseFloat(formData.barrelDiameter) : null,
      barrel_diameter_target: spec?.barrelTarget ?? null,
      barrel_diameter_tolerance: spec?.barrelTol ?? null,
      flange_diameter_actual: formData.flangeDiameter ? parseFloat(formData.flangeDiameter) : null,
      flange_diameter_target: spec?.flangeTarget ?? null,
      flange_diameter_tolerance: spec?.flangeTol ?? null,
      overall_length_actual: formData.overallLength ? parseFloat(formData.overallLength) : null,
      overall_length_target: spec?.lengthTarget ?? null,
      overall_length_tolerance: spec?.lengthTol ?? null,
      length_to_flange_actual: formData.lengthToFlange ? parseFloat(formData.lengthToFlange) : null,
      length_to_flange_target: spec?.flangeToTarget ?? null,
      length_to_flange_tolerance: spec?.flangeToTol ?? null,
      od_measurement_1: formData.od1 ? parseFloat(formData.od1) : null,
      od_measurement_2: formData.od2 ? parseFloat(formData.od2) : null,
      od_measurement_3: formData.od3 ? parseFloat(formData.od3) : null,
      id_measurement_1: formData.id1 ? parseFloat(formData.id1) : null,
      id_measurement_2: formData.id2 ? parseFloat(formData.id2) : null,
      length_measurement_1: formData.length1 ? parseFloat(formData.length1) : null,
      material_appearance: formData.materialAppearance || null,
      dimensional_status: formData.dimensionalStatus,
      heat_treat_approved: formData.heatTreatApproved === 'true',
      surface_condition: formData.surfaceCondition || null,
      notes: formData.notes || null,
      measurement_method: 'CAT_BLAST_EXIT_APP_V1'
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

      setSuccessMessage(
        `✅ ${formData.productNumber || 'Measurement'} recorded! Heat: ${measurementData.heat_number} | Status: ${measurementData.dimensional_status}`
      )

      setTimeout(() => {
        resetFormFields()
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      setErrorMessage(error.message || 'Error submitting measurement. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStatusBadge = (statusKey) => {
    if (!statusKey || statusKey === 'NONE') {
      return null
    }

    const styles = statusStyles[statusKey] || statusStyles.NONE

    return (
      <div className={`flex items-center space-x-2 text-sm font-semibold ${styles.badge}`}>
        <span className={`h-3 w-3 rounded-full ${styles.indicator}`} />
        <span>{styles.label}</span>
      </div>
    )
  }

  const productDetailsMessage = useMemo(() => {
    if (selectedSpec?.info) {
      return selectedSpec.info
    }

    if (formData.productNumber === 'OTHER') {
      return 'Manual entry for other CAT products. Use standard measurement procedures.'
    }

    return ''
  }, [formData.productNumber, selectedSpec])

  return (
    <>
      <Head>
        <title>📏 CAT Measurement System</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-white px-6 py-8 shadow-2xl sm:px-10 sm:py-10">
            <header className="mb-8 text-center text-gray-800">
              <h1 className="text-3xl font-bold text-amber-500 sm:text-4xl">🏗️ CAT Measurement System</h1>
              <p className="mt-2 text-lg">Blast Exit Dimensional Control - Phase 1</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm font-semibold text-white">
                <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2">Starting with Top CAT Products</span>
                <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2">536 &amp; 4T Series Priority</span>
                <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2">Ready for Production</span>
              </div>
            </header>

            {successMessage && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-emerald-700 font-semibold">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-rose-700 font-semibold">
                ❌ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <section className="rounded-2xl border-2 border-amber-200 bg-amber-50/70 p-5">
                <label className="block text-sm font-semibold text-gray-700" htmlFor="productNumber">
                  CAT Product Number <span className="text-rose-500">*</span>
                </label>
                <select
                  id="productNumber"
                  name="productNumber"
                  required
                  value={formData.productNumber}
                  onChange={handleFieldChange}
                  className="mt-2 w-full rounded-xl border-2 border-amber-200 bg-white px-4 py-3 font-semibold text-gray-800 focus:outline-none focus:ring-4 focus:ring-amber-100"
                >
                  <option value="">Select CAT Product</option>
                  <option value="CAT536-6765">CAT536-6765 (Cylinder - HIGHEST Priority)</option>
                  <option value="CAT536-6763">CAT536-6763 (Cylinder - HIGH Priority)</option>
                  <option value="CAT536-6764">CAT536-6764 (Cylinder - HIGH Priority)</option>
                  <option value="CAT150-3014">CAT150-3014 (Large Casting)</option>
                  <option value="CAT150-3011">CAT150-3011 (Large Casting)</option>
                  <option value="CAT4T-6051">CAT4T-6051 (Heavy Duty - HIGH Priority)</option>
                  <option value="CAT4T-5937">CAT4T-5937 (Heavy Duty - HIGH Priority)</option>
                  <option value="CAT4T-4774">CAT4T-4774 (Heavy Duty - MEDIUM Priority)</option>
                  <option value="CAT121-2077">CAT121-2077 (Large Assembly)</option>
                  <option value="CAT522-7552">CAT522-7552 (Large Assembly)</option>
                  <option value="OTHER">Other CAT Product</option>
                </select>

                {productDetailsMessage && (
                  <div className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-gray-600">
                    {productDetailsMessage}
                  </div>
                )}
              </section>

              <section className="grid gap-6 md:grid-cols-2">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="heatNumber">
                      Heat Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="heatNumber"
                      name="heatNumber"
                      required
                      value={formData.heatNumber}
                      onChange={handleFieldChange}
                      placeholder="Enter heat number"
                      className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="operator">
                      Operator <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="operator"
                      name="operator"
                      required
                      value={formData.operator}
                      onChange={handleFieldChange}
                      placeholder="Your name"
                      className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-amber-100"
                    />
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="trackingNumber">
                      Tracking Number
                    </label>
                    <input
                      type="number"
                      id="trackingNumber"
                      name="trackingNumber"
                      value={formData.trackingNumber}
                      onChange={handleFieldChange}
                      placeholder="Optional"
                      className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="shift">
                      Shift
                    </label>
                    <select
                      id="shift"
                      name="shift"
                      value={formData.shift}
                      onChange={handleFieldChange}
                      className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-amber-100"
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
                  onClick={autoFill536}
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500"
                >
                  ⚡ CAT536-6765
                </button>
                <button
                  type="button"
                  onClick={autoFill4T}
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500"
                >
                  ⚡ CAT4T-6051
                </button>
                <button
                  type="button"
                  onClick={autoFillLarge}
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500"
                >
                  ⚡ CAT150-3011
                </button>
              </section>

              {isCylinder && (
                <section className="space-y-4 rounded-2xl border-l-4 border-amber-400 bg-slate-50 p-5">
                  <h3 className="text-xl font-semibold text-amber-500">Cylinder Casting Measurements</h3>
                  <p className="text-sm text-gray-600">
                    Use existing measurement sheet procedures. Pi tape for ODs, calipers for lengths.
                  </p>

                  <div className="space-y-4">
                    {cylinderMeasurements.map((measurement) => {
                      const statusKey = toleranceStatuses[measurement.key]
                      const styles = statusStyles[statusKey] || statusStyles.NONE

                      return (
                        <div key={measurement.key} className="grid gap-4 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-[1.5fr_1fr_auto] sm:items-end">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">{measurement.label}</p>
                            <p className="text-xs text-gray-500">Target {measurement.target?.toFixed(4)} ±{measurement.tolerance?.toFixed(4)}</p>
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.0001"
                              inputMode="decimal"
                              name={measurement.key}
                              id={measurement.key}
                              placeholder={measurement.target?.toFixed(4) || '0.0000'}
                              value={formData[measurement.key]}
                              onChange={handleFieldChange}
                              className={`w-full rounded-xl border-2 px-4 py-3 text-center text-lg font-semibold text-gray-800 focus:outline-none focus:ring-4 focus:ring-amber-100 ${styles.input}`}
                            />
                          </div>
                          <div className="text-right">
                            {renderStatusBadge(statusKey)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {showGenericMeasurements && (
                <section className="rounded-2xl border-l-4 border-amber-400 bg-slate-50 p-5">
                  <h3 className="text-xl font-semibold text-amber-500">
                    {formData.productNumber === 'OTHER'
                      ? 'Other CAT Product Measurements'
                      : `${formData.productNumber} Measurements`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Standard measurement procedures for non-cylinder CAT products.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {[{ id: 'od1', label: 'Primary OD Measurement' },
                      { id: 'od2', label: 'Secondary OD Measurement' },
                      { id: 'od3', label: 'Third OD Measurement (if needed)' },
                      { id: 'length1', label: 'Critical Length' },
                      { id: 'id1', label: 'ID Measurement (if applicable)' },
                      { id: 'id2', label: 'Second ID Measurement (if applicable)' }].map((field) => (
                      <div key={field.id}>
                        <label className="block text-sm font-semibold text-gray-700" htmlFor={field.id}>
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
                          className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-amber-100"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-2xl border-l-4 border-amber-400 bg-slate-50 p-5">
                <h3 className="text-xl font-semibold text-amber-500">Casting Conditions &amp; Quality</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="materialAppearance">
                      Material Appearance
                    </label>
                    <select
                      id="materialAppearance"
                      name="materialAppearance"
                      value={formData.materialAppearance}
                      onChange={handleFieldChange}
                      className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-amber-100"
                    >
                      <option value="">Select Condition</option>
                      <option value="EXCELLENT">Excellent - Perfect Cast</option>
                      <option value="GOOD">Good - Minor Surface Issues</option>
                      <option value="FAIR">Fair - Some Defects</option>
                      <option value="POOR">Poor - Major Problems</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="dimensionalStatus">
                      Overall Dimensional Status
                    </label>
                    <select
                      id="dimensionalStatus"
                      name="dimensionalStatus"
                      required
                      value={formData.dimensionalStatus}
                      onChange={handleFieldChange}
                      className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-amber-100"
                    >
                      <option value="PASS">✅ PASS - All dimensions OK</option>
                      <option value="MARGINAL">⚠️ MARGINAL - Close to limits</option>
                      <option value="FAIL">❌ FAIL - Out of tolerance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="heatTreatApproved">
                      Heat Treatment Decision
                    </label>
                    <select
                      id="heatTreatApproved"
                      name="heatTreatApproved"
                      required
                      value={formData.heatTreatApproved}
                      onChange={handleFieldChange}
                      className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-amber-100"
                    >
                      <option value="true">✅ APPROVED - Send to Heat Treat</option>
                      <option value="false">❌ REJECTED - Hold/Scrap</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="surfaceCondition">
                      Surface Condition
                    </label>
                    <select
                      id="surfaceCondition"
                      name="surfaceCondition"
                      value={formData.surfaceCondition}
                      onChange={handleFieldChange}
                      className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-amber-100"
                    >
                      <option value="">Select Condition</option>
                      <option value="SMOOTH">Smooth - No Issues</option>
                      <option value="ROUGH">Rough Surface</option>
                      <option value="INCLUSIONS">Visible Inclusions</option>
                      <option value="POROSITY">Surface Porosity</option>
                      <option value="COLD_SHUT">Cold Shut Present</option>
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <label className="block text-sm font-semibold text-gray-700" htmlFor="notes">
                  Measurement Notes &amp; Observations
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleFieldChange}
                  placeholder="Record observations about casting quality, measurement issues, or recommendations..."
                  className="mt-2 w-full rounded-2xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-amber-100"
                />
              </section>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-4 text-lg font-semibold uppercase tracking-wide text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
                >
                  {isSubmitting ? '⏳ Submitting...' : '📏 Submit CAT Measurement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
