import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function validateConfig(supabaseUrl: string, supabaseKey: string): boolean {
  if (!supabaseUrl || !supabaseKey) return false;
  try {
    const parsed = new URL(supabaseUrl);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && !!parsed.host;
  } catch {
    return false;
  }
}

export const isConfigValid = validateConfig(url, anonKey);

export const startupError: string | null = !isConfigValid
  ? 'Chưa cấu hình SUPABASE_URL và SUPABASE_ANON_KEY.'
  : null;

export const supabase: SupabaseClient | null = isConfigValid
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

