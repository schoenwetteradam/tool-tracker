import { createClient } from '@supabase/supabase-js'

// Fall back to local defaults so builds don't fail when env vars are missing
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

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
