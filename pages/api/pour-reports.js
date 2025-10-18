import { createClient } from '@supabase/supabase-js'
import { buildPourReportPayload } from '../../lib/pourReportService.js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const createAdminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })
}

const supabaseAdmin = createAdminClient()

const normalizeError = (error) => {
  if (!error) {
    return 'Failed to save pour report'
  }

  if (typeof error === 'string') {
    return error
  }

  return error.message || 'Failed to save pour report'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabaseAdmin) {
    console.error('Supabase service role key is not configured for pour report API route.')
    return res
      .status(500)
      .json({ error: 'Supabase credentials are not configured for pour reports.' })
  }

  const payload = buildPourReportPayload(req.body || {})

  try {
    const { data, error } = await supabaseAdmin.from('pour_reports').insert([payload]).select()

    if (error) {
      console.error('Error inserting pour report via API route:', error)
      return res.status(400).json({ error: normalizeError(error) })
    }

    return res.status(200).json({ data: data?.[0] ?? null })
  } catch (error) {
    console.error('Unexpected error inserting pour report:', error)
    return res.status(500).json({ error: normalizeError(error) })
  }
}

