import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite env and sanitize URL
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Normalize URL: remove any trailing slashes and accidental '/rest/v1' suffix pasted by users
export const supabaseUrl = rawUrl
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
