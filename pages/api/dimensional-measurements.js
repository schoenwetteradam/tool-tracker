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

    const attemptInsert = async (payload) =>
      supabase.from('dimensional_measurements').insert([payload]).select()

    let { data, error } = await attemptInsert(sanitizedData)

    if (error) {
      const missingProductFamily =
        error.message &&
        error.message.includes("Could not find the 'product_family' column of 'dimensional_measurements'")

      if (missingProductFamily && 'product_family' in sanitizedData) {
        console.warn(
          "Supabase schema cache is missing 'product_family'. Retrying insert without this field.",
          error
        )

        const { product_family, ...fallbackData } = sanitizedData
        const fallbackResult = await attemptInsert(fallbackData)

        data = fallbackResult.data
        error = fallbackResult.error

        if (!error) {
          console.warn(
            "Inserted dimensional measurement without 'product_family' due to schema cache mismatch."
          )
        }
      }
    }

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
