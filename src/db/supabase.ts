import { createClient } from '@supabase/supabase-js'

// TODO: Masukkan URL dan ANON_KEY dari dashboard Supabase Anda.
// Sangat disarankan memindahkannya ke file .env (VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
