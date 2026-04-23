import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readSupabaseEnv() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = readSupabaseEnv();
  return Boolean(url && anonKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = readSupabaseEnv();

  if (!url || !anonKey) {
    return null;
  }

  if (!client) {
    client = createClient(url, anonKey);
  }

  return client;
}
