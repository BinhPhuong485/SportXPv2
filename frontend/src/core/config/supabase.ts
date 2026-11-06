import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://yjcqaxszvmpnlmypxjqq.supabase.co';
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqY3FheHN6dm1wbmxteXB4anFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNTA3MzcsImV4cCI6MjEwNjgyNjczN30.zj_iSMnx-18up87eeHbZGjVAbtnh00j6flp4OtqmTGs';

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

