import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Supabase credentials are missing for dimensional measurements API route.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const measurementData = req.body

    if (!measurementData || typeof measurementData !== 'object') {
      return res.status(400).json({ message: 'Invalid measurement payload' })
    }

    const sanitizedData = Object.fromEntries(
      Object.entries(measurementData).filter(([_, value]) => value !== undefined)
    )

    const { data, error } = await supabase
      .from('dimensional_measurements')
      .insert([sanitizedData])
      .select()

    if (error) {
      console.error('Error inserting dimensional measurement:', error)
      return res.status(400).json({ message: 'Failed to record measurement', error: error.message })
    }

    return res.status(200).json({ data })
  } catch (error) {
    console.error('Unexpected error inserting dimensional measurement:', error)
    return res.status(500).json({ message: 'Unexpected error recording measurement' })
  }
}
