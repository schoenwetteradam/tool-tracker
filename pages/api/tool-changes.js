import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const unsupportedToolChangeColumns = new Set()

const filterUnsupportedColumns = (data) =>
  Object.fromEntries(
    Object.entries(data || {}).filter(([column]) => !unsupportedToolChangeColumns.has(column))
  )

const normalizeSupabaseError = (error, status) => {
  const normalized = new Error(error?.message || 'Supabase request failed')

  if (status !== undefined) {
    normalized.status = status
  }

  if (error && typeof error === 'object') {
    if (error.code) normalized.code = error.code
    if (error.details) normalized.details = error.details
    if (error.hint) normalized.hint = error.hint
  }

  return normalized
}

async function insertToolChangeWithFallback(client, initialData) {
  let payload = filterUnsupportedColumns(initialData)
  const removedColumns = new Set()

  while (true) {
    const { data, error, status } = await client
      .from('tool_changes')
      .insert([payload])
      .select()

    if (!error) {
      if (removedColumns.size > 0) {
        console.warn(
          `⚠️ Insert succeeded after removing unsupported columns: ${Array.from(removedColumns).join(', ')}`
        )
      }
      return data
    }

    if (status === 401 || status === 403) {
      throw normalizeSupabaseError(error, status)
    }

    const missingColumnMatch =
      error?.code === 'PGRST204' && typeof error?.message === 'string'
        ? error.message.match(/'([^']+)' column/)
        : null

    if (missingColumnMatch) {
      const missingColumn = missingColumnMatch[1]

      if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
        console.warn(`⚠️ Column '${missingColumn}' not found in schema. Retrying without it...`)
        unsupportedToolChangeColumns.add(missingColumn)
        delete payload[missingColumn]
        removedColumns.add(missingColumn)
        continue
      }
    }

    throw normalizeSupabaseError(error, status)
  }
}

const sanitizePayload = (data) =>
  Object.fromEntries(
    Object.entries(data || {}).filter(([, value]) => value !== undefined)
  )

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase service role key is not configured.' })
  }

  const payload = sanitizePayload(req.body)

  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'Request body is required.' })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })

  try {
    const data = await insertToolChangeWithFallback(supabaseAdmin, payload)
    return res.status(200).json({ data })
  } catch (error) {
    console.error('❌ Tool change API error:', error)
    const status = error?.status || 500
    return res.status(status).json({
      error: error?.message || 'Failed to save tool change.',
      code: error?.code || null,
      details: error?.details || null,
      hint: error?.hint || null
    })
  }
}
