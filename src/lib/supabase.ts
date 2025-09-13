import { createClient } from '@supabase/supabase-js'

// Check for environment variables with proper fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL. Please check your Supabase integration.')
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase Anon Key. Please check your Supabase integration.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)