/**
 * Heat Treatment Utility Functions
 * Helper functions for data processing, calculations, and formatting
 */

/**
 * Calculate total cycle time from all temperature stages
 */
export function calculateTotalCycleTime(treatment) {
  const time1 = parseFloat(treatment.time1_hours) || 0
  const time2 = parseFloat(treatment.time2_hours) || 0
  const time3 = parseFloat(treatment.time3_hours) || 0
  const time4 = parseFloat(treatment.time4_hours) || 0
  return time1 + time2 + time3 + time4
}

/**
 * Calculate average BHN from hot and cold end measurements
 */
export function calculateAvgBHN(treatment) {
  const hot = parseFloat(treatment.hot_end_bhn) || 0
  const cold = parseFloat(treatment.cold_end_bhn) || 0
  if (hot === 0 && cold === 0) return 0
  if (hot === 0) return cold
  if (cold === 0) return hot
  return Math.round((hot + cold) / 2)
}

/**
 * Format load type for display
 */
export function formatLoadType(loadType) {
  const types = {
    'WQ': 'Water Quench',
    'AC': 'Air Cool',
    'F.C.A.': 'Furnace Cool Anneal',
    'TEMPER': 'Tempering',
    'NORM': 'Normalize',
    'AQ': 'Air Quench',
    'A.H.': 'Anneal Harden',
    'S.R.': 'Stress Relief'
  }
  return types[loadType] || loadType
}

/**
 * Get load type color for badges
 */
export function getLoadTypeColor(loadType) {
  const colors = {
    'WQ': 'bg-blue-100 text-blue-800',
    'AC': 'bg-green-100 text-green-800',
    'F.C.A.': 'bg-purple-100 text-purple-800',
    'TEMPER': 'bg-orange-100 text-orange-800',
    'NORM': 'bg-yellow-100 text-yellow-800',
    'AQ': 'bg-cyan-100 text-cyan-800',
    'A.H.': 'bg-pink-100 text-pink-800',
    'S.R.': 'bg-indigo-100 text-indigo-800'
  }
  return colors[loadType] || 'bg-gray-100 text-gray-800'
}

/**
 * Validate treatment data before submission
 */
export function validateTreatmentData(data) {
  const errors = []

  // Required fields
  if (!data.heat_number || data.heat_number.trim() === '') {
    errors.push('Heat number is required')
  }

  if (!data.day_finished) {
    errors.push('Day finished is required')
  }

  // Numeric validations
  if (data.cast_weight && isNaN(data.cast_weight)) {
    errors.push('Cast weight must be a number')
  }

  if (data.hot_end_bhn && (isNaN(data.hot_end_bhn) || data.hot_end_bhn < 0)) {
    errors.push('Hot end BHN must be a positive number')
  }

  if (data.cold_end_bhn && (isNaN(data.cold_end_bhn) || data.cold_end_bhn < 0)) {
    errors.push('Cold end BHN must be a positive number')
  }

  // Temperature/time validations
  for (let i = 1; i <= 4; i++) {
    const temp = data[`temp${i}_fahrenheit`]
    const time = data[`time${i}_hours`]

    if (temp && isNaN(temp)) {
      errors.push(`Temperature ${i} must be a number`)
    }

    if (time && isNaN(time)) {
      errors.push(`Time ${i} must be a number`)
    }

    // If temperature is set, time should be set too
    if (temp && !time) {
      errors.push(`Time ${i} is required when temperature ${i} is set`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format temperature with unit
 */
export function formatTemperature(temp) {
  if (!temp || isNaN(temp)) return 'N/A'
  return `${temp}°F`
}

/**
 * Format time with unit
 */
export function formatTime(hours) {
  if (!hours || isNaN(hours)) return 'N/A'
  const h = parseFloat(hours)
  if (h >= 1) return `${h} hrs`
  return `${Math.round(h * 60)} min`
}

/**
 * Calculate efficiency score based on cycle time and gas usage
 */
export function calculateEfficiencyScore(treatment) {
  const totalTime = calculateTotalCycleTime(treatment)
  const weight = parseFloat(treatment.cast_weight) || 0
  const gas = parseFloat(treatment.gas_usage) || 0

  if (totalTime === 0 || weight === 0) return 0

  // Lower is better: less time and gas per pound
  const timePerPound = totalTime / weight
  const gasPerPound = gas / weight

  // Simple efficiency score (0-100, higher is better)
  // This is a simplified formula - adjust based on your standards
  const score = Math.max(0, 100 - (timePerPound * 10 + gasPerPound * 5))
  return Math.round(score)
}

/**
 * Check if BHN is within acceptable range
 */
export function isBHNInRange(bhn, material) {
  if (!bhn) return null

  // Define acceptable ranges per material (customize as needed)
  const ranges = {
    'CAT3': { min: 269, max: 444 },
    'CAT4': { min: 241, max: 415 },
    'CA-40': { min: 388, max: 477 },
    'CF8': { min: 140, max: 220 },
    '52100-IC': { min: 207, max: 248 }
    // Add more materials as needed
  }

  const range = ranges[material]
  if (!range) return null

  return bhn >= range.min && bhn <= range.max
}

/**
 * Get temperature stage summary
 */
export function getTemperatureStageSummary(treatment) {
  const stages = []
  for (let i = 1; i <= 4; i++) {
    const temp = treatment[`temp${i}_fahrenheit`]
    const time = treatment[`time${i}_hours`]
    if (temp && time) {
      stages.push({
        stage: i,
        temperature: temp,
        time: time,
        formatted: `${temp}°F for ${time} hrs`
      })
    }
  }
  return stages
}

/**
 * Export treatment data to CSV format
 */
export function exportToCSV(treatments) {
  const headers = [
    'Heat Number', 'Furnace', 'Load Number', 'Load Type', 'Day Finished',
    'Job Number', 'Part Number', 'Material', 'Cast Weight',
    'Temp1', 'Time1', 'Temp2', 'Time2', 'Temp3', 'Time3', 'Temp4', 'Time4',
    'Hot End BHN', 'Cold End BHN', 'Gas Usage', 'Notes'
  ]

  const rows = treatments.map(t => [
    t.heat_number,
    t.furnace_number || '',
    t.load_number || '',
    t.load_type || '',
    t.day_finished,
    t.job_number || '',
    t.part_number || '',
    t.material_type || '',
    t.cast_weight || '',
    t.temp1_fahrenheit || '',
    t.time1_hours || '',
    t.temp2_fahrenheit || '',
    t.time2_hours || '',
    t.temp3_fahrenheit || '',
    t.time3_hours || '',
    t.temp4_fahrenheit || '',
    t.time4_hours || '',
    t.hot_end_bhn || '',
    t.cold_end_bhn || '',
    t.gas_usage || '',
    (t.notes || '').replace(/"/g, '""') // Escape quotes
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent, filename = 'heat-treatments.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Filter treatments by date range
 */
export function filterByDateRange(treatments, startDate, endDate) {
  return treatments.filter(t => {
    const date = new Date(t.day_finished)
    const start = new Date(startDate)
    const end = new Date(endDate)
    return date >= start && date <= end
  })
}

/**
 * Group treatments by furnace
 */
export function groupByFurnace(treatments) {
  return treatments.reduce((acc, treatment) => {
    const furnace = treatment.furnace_number || 'Unassigned'
    if (!acc[furnace]) {
      acc[furnace] = []
    }
    acc[furnace].push(treatment)
    return acc
  }, {})
}

/**
 * Group treatments by material
 */
export function groupByMaterial(treatments) {
  return treatments.reduce((acc, treatment) => {
    const material = treatment.material_type || 'Unknown'
    if (!acc[material]) {
      acc[material] = []
    }
    acc[material].push(treatment)
    return acc
  }, {})
}
