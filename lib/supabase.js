import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const getToolChanges = async () => {
  const { data, error } = await supabase
    .from('tool_changes')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export const addToolChange = async (payload) => {
  const { data, error } = await supabase
    .from('tool_changes')
    .insert(payload)
    .select()
  if (error) throw error
  return data
}
