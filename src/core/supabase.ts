import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import { supabaseAuthStorage } from './secureStorage';

let client: SupabaseClient | null = null;

if (env.isSupabaseConfigured) {
  client = createClient(env.supabaseUrl!, env.supabasePublishableKey!, {
    auth: {
      storage: supabaseAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: { headers: { 'x-client-info': 'dentaflow-mobile/1.0.0' } }
  });
}

export const supabase = client;

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured. Add the public project URL and publishable key.');
  return supabase;
}
