import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const { method } = req

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      case 'PUT':
        return await handlePut(req, res)
      case 'DELETE':
        return await handleDelete(req, res)
      default:
        return res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}

async function handleGet(req, res) {
  const { id, heat_number, limit = 100, offset = 0 } = req.query

  let query = supabase
    .from('heat_treatment_log')
    .select('*')
    .order('day_finished', { ascending: false })
    .order('created_at', { ascending: false })

  if (id) {
    query = query.eq('id', id).single()
  }

  if (heat_number) {
    query = query.eq('heat_number', heat_number)
  }

  if (!id) {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error, count } = await query

  if (error) {
    return res.status(400).json({ message: 'Failed to fetch heat treatments', error: error.message })
  }

  return res.status(200).json({ 
    data, 
    count,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  })
}

async function handlePost(req, res) {
  const treatmentData = req.body

  // Validate required fields
  if (!treatmentData.heat_number || !treatmentData.day_finished) {
    return res.status(400).json({ 
      message: 'Missing required fields: heat_number and day_finished are required' 
    })
  }

  const { data, error } = await supabase
    .from('heat_treatment_log')
    .insert([treatmentData])
    .select()

  if (error) {
    return res.status(400).json({ message: 'Failed to create heat treatment', error: error.message })
  }

  return res.status(201).json({ data: data[0], message: 'Heat treatment created successfully' })
}

async function handlePut(req, res) {
  const { id } = req.query
  const treatmentData = req.body

  if (!id) {
    return res.status(400).json({ message: 'ID is required for updates' })
  }

  const { data, error } = await supabase
    .from('heat_treatment_log')
    .update(treatmentData)
    .eq('id', id)
    .select()

  if (error) {
    return res.status(400).json({ message: 'Failed to update heat treatment', error: error.message })
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ message: 'Heat treatment not found' })
  }

  return res.status(200).json({ data: data[0], message: 'Heat treatment updated successfully' })
}

async function handleDelete(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ message: 'ID is required for deletion' })
  }

  const { error } = await supabase
    .from('heat_treatment_log')
    .delete()
    .eq('id', id)

  if (error) {
    return res.status(400).json({ message: 'Failed to delete heat treatment', error: error.message })
  }

  return res.status(200).json({ message: 'Heat treatment deleted successfully' })
}
