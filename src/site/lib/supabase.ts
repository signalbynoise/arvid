import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function initClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[warn] [site:supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — admin auth will not work.');
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = initClient();
