import { supabase } from '../../../lib/supabase'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data: rawData, skipDuplicates = true } = req.body

    if (!rawData || !Array.isArray(rawData)) {
      return res.status(400).json({
        error: 'Invalid request body. Expected { data: [...] }',
      })
    }

    const transformedData = []
    const rowErrors = []

    rawData.forEach((row, index) => {
      try {
        const transformed = transformPourReportRow(row)
        if (transformed.heat_number) {
          transformedData.push(transformed)
        } else {
          rowErrors.push(`Row ${index + 1}: Missing heat_number`)
        }
      } catch (error) {
        rowErrors.push(`Row ${index + 1}: ${error.message}`)
      }
    })

    if (transformedData.length === 0) {
      return res.status(400).json({
        error: 'No valid records to import',
        errors: rowErrors,
      })
    }

    const batchSize = 500
    let successCount = 0
    let failCount = 0
    const batchErrors = []

    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize)

      try {
        const { error } = await supabase
          .from('pour_reports')
          .upsert(batch, {
            onConflict: 'full_heat_number',
            ignoreDuplicates: skipDuplicates,
          })
          .select()

        if (error) {
          batchErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
          failCount += batch.length
        } else {
          successCount += batch.length
        }
      } catch (error) {
        batchErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        failCount += batch.length
      }
    }

    if (successCount > 0) {
      try {
        await supabase.rpc('refresh_all_kpis', {
          p_start_date: '2024-01-01',
          p_end_date: new Date().toISOString().split('T')[0],
        })
      } catch (refreshError) {
        console.warn('KPI refresh failed:', refreshError)
      }
    }

    return res.status(200).json({
      success: true,
      results: {
        total: rawData.length,
        imported: successCount,
        failed: failCount,
        skipped: rawData.length - transformedData.length,
      },
      errors: [...rowErrors, ...batchErrors],
    })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({
      error: error.message,
    })
  }
}
