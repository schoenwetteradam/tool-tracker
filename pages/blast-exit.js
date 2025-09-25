import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const statusStyles = {
  NONE: {
    input: 'border-slate-200 bg-white',
    badge: 'text-slate-500',
    indicator: 'bg-slate-300',
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

function evaluateTolerance(value, target, tolerance) {
  const numericValue = parseFloat(value)
  const numericTarget = parseFloat(target)
  const numericTolerance = parseFloat(tolerance)

  if (!Number.isFinite(numericValue) || !Number.isFinite(numericTarget) || !Number.isFinite(numericTolerance)) {
    return 'NONE'
  }

  const deviation = Math.abs(numericValue - numericTarget)

  if (deviation <= numericTolerance) {
    return 'PASS'
  }

  if (deviation <= numericTolerance * 1.5) {
    return 'MARGINAL'
  }

  return 'FAIL'
}

function getTolerance(value, fallback) {
  const numericValue = parseFloat(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

export default function BlastExitMeasurement() {
  const [formData, setFormData] = useState(() => ({ ...initialFormData }))
  const [toleranceStatuses, setToleranceStatuses] = useState(() => ({ ...initialToleranceStatuses }))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [loadingError, setLoadingError] = useState('')

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoadingTemplates(true)
        setLoadingError('')

        const { data, error } = await supabase
          .from('measurement_templates')
          .select('*')
          .like('product_number', 'CAT%')
          .eq('active', true)
          .order('priority_score', { ascending: false })
          .order('product_number', { ascending: true })

        if (error) {
          throw error
        }

        if (!data || data.length === 0) {
          throw new Error('No CAT products found in database')
        }

        setTemplates(data)
      } catch (error) {
        console.error('Error loading products:', error)
        setLoadingError(
          `Error loading products: ${error.message}. Please verify Supabase credentials, table structure, and CAT templates.`
        )
      } finally {
        setLoadingTemplates(false)
      }
    }

    loadTemplates()
  }, [])

  const templatesByNumber = useMemo(() => {
    return templates.reduce((accumulator, template) => {
      accumulator[template.product_number] = template
      return accumulator
    }, {})
  }, [templates])

  const selectedSpec = formData.productNumber ? templatesByNumber[formData.productNumber] : null

  const isCylinder = useMemo(() => {
    if (!selectedSpec) {
      return false
    }

    if (selectedSpec.product_family === '536_SERIES') {
      return true
    }

    if (selectedSpec.requires_barrel_diameter && selectedSpec.requires_flange_diameter) {
      return true
    }

    return Boolean(selectedSpec.barrel_diameter_target && selectedSpec.flange_diameter_target)
  }, [selectedSpec])

  const showLengthToFlange = Boolean(
    selectedSpec?.length_to_flange_target && (selectedSpec?.requires_length_to_flange ?? true)
  )

  const toleranceMap = useMemo(() => {
    if (!isCylinder || !selectedSpec) {
      return {}
    }

    const barrelTolerance = getTolerance(selectedSpec.barrel_diameter_tolerance, 0.02)
    const flangeTolerance = getTolerance(selectedSpec.flange_diameter_tolerance, 0.02)
    const overallTolerance = getTolerance(selectedSpec.overall_length_tolerance, 0.03)
    const flangeLengthTolerance = getTolerance(selectedSpec.length_to_flange_tolerance, 0.02)

    const map = {}

    if (selectedSpec.barrel_diameter_target) {
      map.barrelDiameter = {
        target: selectedSpec.barrel_diameter_target,
        tolerance: barrelTolerance
      }
    }

    if (selectedSpec.flange_diameter_target) {
      map.flangeDiameter = {
        target: selectedSpec.flange_diameter_target,
        tolerance: flangeTolerance
      }
    }

    if (selectedSpec.overall_length_target) {
      map.overallLength = {
        target: selectedSpec.overall_length_target,
        tolerance: overallTolerance
      }
    }

    if (showLengthToFlange && selectedSpec.length_to_flange_target) {
      map.lengthToFlange = {
        target: selectedSpec.length_to_flange_target,
        tolerance: flangeLengthTolerance
      }
    }

    return map
  }, [isCylinder, selectedSpec, showLengthToFlange])

  useEffect(() => {
    setToleranceStatuses((previous) => {
      const updated = { ...previous }

      cylinderFields.forEach((field) => {
        const config = toleranceMap[field]
        const value = formData[field]
        updated[field] = config ? evaluateTolerance(value, config.target, config.tolerance) : 'NONE'
      })

      return updated
    })
  }, [formData.barrelDiameter, formData.flangeDiameter, formData.overallLength, formData.lengthToFlange, toleranceMap])

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    if (name === 'productNumber') {
      setFormData((previous) => ({
        ...previous,
        productNumber: value,
        barrelDiameter: '',
        flangeDiameter: '',
        overallLength: '',
        lengthToFlange: '',
        od1: '',
        od2: '',
        od3: '',
        id1: '',
        id2: '',
        length1: ''
      }))
      return
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }))
  }

  const resetFormFields = () => {
    setFormData({ ...initialFormData })
    setToleranceStatuses({ ...initialToleranceStatuses })
  }

  const quickFillHeat = () => {
    const now = new Date()
    const generatedHeat = `H${now.getTime().toString().slice(-6)}`

    setFormData((previous) => ({
      ...previous,
      heatNumber: generatedHeat,
      operator: previous.operator || 'Operator',
      shift: previous.shift || '1'
    }))
  }

  const loadLastMeasurement = () => {
    alert('Load last measurement feature coming soon - will pull from recent measurements.')
  }

  const showInstructions = () => {
    if (selectedSpec?.measurement_instructions) {
      alert(`Measurement Instructions for ${formData.productNumber}:\n\n${selectedSpec.measurement_instructions}`)
      return
    }

    if (formData.productNumber) {
      alert('Standard measurement procedures apply for this product.')
      return
    }

    alert('Please select a product first to see specific instructions.')
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
      product_family: selectedSpec?.product_family || null,
      measurement_date: new Date().toISOString().split('T')[0],
      measurement_time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      operator: formData.operator,
      shift: formData.shift ? parseInt(formData.shift, 10) : null,
      barrel_diameter_actual: formData.barrelDiameter ? parseFloat(formData.barrelDiameter) : null,
      barrel_diameter_target: selectedSpec?.barrel_diameter_target ?? null,
      barrel_diameter_tolerance: selectedSpec?.barrel_diameter_tolerance ?? null,
      flange_diameter_actual: formData.flangeDiameter ? parseFloat(formData.flangeDiameter) : null,
      flange_diameter_target: selectedSpec?.flange_diameter_target ?? null,
      flange_diameter_tolerance: selectedSpec?.flange_diameter_tolerance ?? null,
      overall_length_actual: formData.overallLength ? parseFloat(formData.overallLength) : null,
      overall_length_target: selectedSpec?.overall_length_target ?? null,
      overall_length_tolerance: selectedSpec?.overall_length_tolerance ?? null,
      length_to_flange_actual: formData.lengthToFlange ? parseFloat(formData.lengthToFlange) : null,
      length_to_flange_target: selectedSpec?.length_to_flange_target ?? null,
      length_to_flange_tolerance: selectedSpec?.length_to_flange_tolerance ?? null,
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
      measurement_method: 'BLAST_EXIT_DYNAMIC_V1'
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

      const productLabel = formData.productNumber || 'Measurement'
      setSuccessMessage(
        `✅ ${productLabel} recorded successfully! Heat: ${measurementData.heat_number} | Status: ${measurementData.dimensional_status} | Heat Treat: ${measurementData.heat_treat_approved ? 'APPROVED' : 'REJECTED'}`
      )

      setTimeout(() => {
        resetFormFields()
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      console.error('Submission error:', error)
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

  const cylinderMeasurements = useMemo(() => {
    if (!isCylinder || !selectedSpec) {
      return []
    }

    const rows = []

    if (selectedSpec.barrel_diameter_target) {
      rows.push({
        key: 'barrelDiameter',
        label: 'Barrel Diameter',
        target: selectedSpec.barrel_diameter_target,
        tolerance: getTolerance(selectedSpec.barrel_diameter_tolerance, 0.02)
      })
    }

    if (selectedSpec.flange_diameter_target) {
      rows.push({
        key: 'flangeDiameter',
        label: 'Flange Diameter',
        target: selectedSpec.flange_diameter_target,
        tolerance: getTolerance(selectedSpec.flange_diameter_tolerance, 0.02)
      })
    }

    if (selectedSpec.overall_length_target) {
      rows.push({
        key: 'overallLength',
        label: 'Overall Length',
        target: selectedSpec.overall_length_target,
        tolerance: getTolerance(selectedSpec.overall_length_tolerance, 0.03)
      })
    }

    if (showLengthToFlange && selectedSpec.length_to_flange_target) {
      rows.push({
        key: 'lengthToFlange',
        label: 'Length to Flange',
        target: selectedSpec.length_to_flange_target,
        tolerance: getTolerance(selectedSpec.length_to_flange_tolerance, 0.02)
      })
    }

    return rows
  }, [isCylinder, selectedSpec, showLengthToFlange])

  const productFamilyGroups = useMemo(() => {
    const groups = templates.reduce((accumulator, template) => {
      const family = template.product_family || 'OTHER'
      if (!accumulator[family]) {
        accumulator[family] = []
      }
      accumulator[family].push(template)
      return accumulator
    }, {})

    Object.values(groups).forEach((group) => {
      group.sort((a, b) => a.product_number.localeCompare(b.product_number))
    })

    return groups
  }, [templates])

  return (
    <>
      <Head>
        <title>📏 Blast Exit Measurement - Dynamic Products</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-purple-700 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl bg-white px-6 py-8 shadow-2xl sm:px-10 sm:py-10">
            <header className="mb-8 text-center text-gray-800">
              <h1 className="text-3xl font-bold text-indigo-500 sm:text-4xl">📏 Blast Exit Measurement</h1>
              <p className="mt-2 text-lg text-slate-600">Dimensional Control System - Phase 1</p>
            </header>

            {loadingTemplates && (
              <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-5 text-center text-indigo-600">
                🔄 Loading CAT products from database...
              </div>
            )}

            {loadingError && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-center text-rose-600">
                ❌ {loadingError}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center text-emerald-700 font-semibold">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-center text-rose-700 font-semibold">
                ❌ {errorMessage}
              </div>
            )}

            {!loadingTemplates && !loadingError && (
              <form onSubmit={handleSubmit} className="space-y-8">
                <section className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/70 p-6">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="productNumber">
                    Product Number <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="productNumber"
                    name="productNumber"
                    required
                    value={formData.productNumber}
                    onChange={(event) => {
                      handleFieldChange(event)
                      setToleranceStatuses({ ...initialToleranceStatuses })
                    }}
                    className="mt-2 w-full rounded-xl border-2 border-indigo-100 bg-white px-4 py-3 font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">Select Product</option>
                    {Object.entries(productFamilyGroups).map(([family, familyTemplates]) => {
                      if (familyTemplates.length > 1) {
                        return (
                          <optgroup key={family} label={`${family.replace('_', ' ')} Series`}>
                            {familyTemplates.map((template) => (
                              <option key={template.product_number} value={template.product_number}>
                                {template.product_number} ({template.product_description || 'CAT Product'})
                              </option>
                            ))}
                          </optgroup>
                        )
                      }

                      const template = familyTemplates[0]
                      return (
                        <option key={template.product_number} value={template.product_number}>
                          {template.product_number} ({template.product_description || 'CAT Product'})
                        </option>
                      )
                    })}
                    <option value="OTHER">Other Product</option>
                  </select>

                  {formData.productNumber && formData.productNumber !== 'OTHER' && selectedSpec && (
                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <div className="text-sm text-slate-600">
                        <p className="font-semibold text-slate-700">{selectedSpec.product_description || 'CAT Product'}</p>
                        <p className="mt-1">Family: {selectedSpec.product_family || 'Standard'}</p>
                        <p className="mt-1">
                          Instructions:{' '}
                          {selectedSpec.measurement_instructions || 'Standard measurement procedures'}
                        </p>
                        <p className="mt-1">
                          Critical Dimensions:{' '}
                          {selectedSpec.critical_dimensions || 'Standard dimensions'}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedSpec.priority_score !== null && selectedSpec.priority_score !== undefined && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
                              selectedSpec.priority_score >= 9
                                ? 'bg-rose-500'
                                : selectedSpec.priority_score >= 7
                                  ? 'bg-orange-500'
                                  : 'bg-slate-500'
                            }`}
                          >
                            Priority {selectedSpec.priority_score}
                          </span>
                        )}
                        {selectedSpec.volume_classification && (
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                            {selectedSpec.volume_classification} Volume
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                <section className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="heatNumber">
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
                        className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="operator">
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
                        className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="trackingNumber">
                        Tracking Number
                      </label>
                      <input
                        type="number"
                        id="trackingNumber"
                        name="trackingNumber"
                        value={formData.trackingNumber}
                        onChange={handleFieldChange}
                        placeholder="Optional"
                        className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="shift">
                        Shift
                      </label>
                      <select
                        id="shift"
                        name="shift"
                        value={formData.shift}
                        onChange={handleFieldChange}
                        className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
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
                    onClick={quickFillHeat}
                    className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
                  >
                    ⚡ Quick Heat#
                  </button>
                  <button
                    type="button"
                    onClick={loadLastMeasurement}
                    className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
                  >
                    🔄 Load Last
                  </button>
                  <button
                    type="button"
                    onClick={showInstructions}
                    className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
                  >
                    📖 Instructions
                  </button>
                </section>

                {isCylinder && cylinderMeasurements.length > 0 && (
                  <section className="rounded-2xl border-l-4 border-indigo-400 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-indigo-500">CAT 536 Series - Cylinder Measurements</h3>
                    <p className="mt-2 text-sm italic text-slate-600">
                      {selectedSpec?.measurement_instructions || 'Use Pi tape for ODs, calipers for lengths.'}
                    </p>

                    <div className="mt-5 space-y-4">
                      {cylinderMeasurements.map((measurement) => {
                        const statusKey = toleranceStatuses[measurement.key]
                        const styles = statusStyles[statusKey] || statusStyles.NONE

                        return (
                          <div
                            key={measurement.key}
                            className="grid gap-4 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-[2fr_1fr_auto] sm:items-center"
                          >
                            <div>
                              <div className="font-semibold text-slate-700">{measurement.label}</div>
                              <div className="text-sm text-slate-500">
                                Target: {measurement.target}
                                {Number.isFinite(measurement.tolerance) ? ` ±${measurement.tolerance}` : ''}
                              </div>
                            </div>
                            <div>
                              <input
                                type="number"
                                step="0.0001"
                                name={measurement.key}
                                value={formData[measurement.key]}
                                onChange={handleFieldChange}
                                placeholder="0.0000"
                                className={`mt-1 w-full rounded-xl border-2 px-4 py-3 text-center text-lg font-semibold transition focus:outline-none focus:ring-4 focus:ring-indigo-100 ${styles.input}`}
                              />
                            </div>
                            <div className="flex justify-end">{renderStatusBadge(statusKey)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {!isCylinder && formData.productNumber && (
                  <section className="rounded-2xl border-l-4 border-indigo-400 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-indigo-500">
                      {formData.productNumber === 'OTHER'
                        ? 'Standard Measurements'
                        : `${formData.productNumber} Measurements`}
                    </h3>
                    <p className="mt-2 text-sm italic text-slate-600">
                      {selectedSpec?.measurement_instructions || 'Standard measurement procedures. Enter dimensions as available.'}
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {[
                        { id: 'od1', label: 'OD Measurement 1' },
                        { id: 'od2', label: 'OD Measurement 2' },
                        { id: 'od3', label: 'OD Measurement 3' },
                        { id: 'id1', label: 'ID Measurement 1' },
                        { id: 'id2', label: 'ID Measurement 2' },
                        { id: 'length1', label: 'Length Measurement' }
                      ].map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm font-semibold text-slate-700" htmlFor={field.id}>
                            {field.label}
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            id={field.id}
                            name={field.id}
                            value={formData[field.id]}
                            onChange={handleFieldChange}
                            placeholder="0.0000"
                            className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="rounded-2xl border-l-4 border-indigo-400 bg-slate-50 p-6">
                  <h3 className="text-xl font-semibold text-indigo-500">Quality Assessment</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="materialAppearance">
                        Material Appearance
                      </label>
                      <select
                        id="materialAppearance"
                        name="materialAppearance"
                        value={formData.materialAppearance}
                        onChange={handleFieldChange}
                        className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      >
                        <option value="">Select Condition</option>
                        <option value="EXCELLENT">Excellent - Perfect Cast</option>
                        <option value="GOOD">Good - Minor Issues</option>
                        <option value="FAIR">Fair - Some Defects</option>
                        <option value="POOR">Poor - Major Problems</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="dimensionalStatus">
                        Overall Dimensional Status
                      </label>
                      <select
                        id="dimensionalStatus"
                        name="dimensionalStatus"
                        required
                        value={formData.dimensionalStatus}
                        onChange={handleFieldChange}
                        className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      >
                        <option value="PASS">✅ PASS - All dimensions OK</option>
                        <option value="MARGINAL">⚠️ MARGINAL - Close to limits</option>
                        <option value="FAIL">❌ FAIL - Out of tolerance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="heatTreatApproved">
                        Heat Treatment Approval
                      </label>
                      <select
                        id="heatTreatApproved"
                        name="heatTreatApproved"
                        required
                        value={formData.heatTreatApproved}
                        onChange={handleFieldChange}
                        className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      >
                        <option value="true">✅ APPROVED - Send to Heat Treat</option>
                        <option value="false">❌ REJECTED - Hold/Scrap</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="surfaceCondition">
                        Surface Condition
                      </label>
                      <select
                        id="surfaceCondition"
                        name="surfaceCondition"
                        value={formData.surfaceCondition}
                        onChange={handleFieldChange}
                        className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
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
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="notes">
                    Notes &amp; Observations
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={handleFieldChange}
                    placeholder="Record observations about casting quality, measurement issues, or recommendations..."
                    className="mt-2 w-full rounded-2xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </section>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-lg font-semibold uppercase tracking-wide text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400"
                  >
                    {isSubmitting ? '⏳ Submitting...' : '📏 Submit Measurement'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
