import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const hasServiceKey = !!SUPABASE_SERVICE_KEY;

export const supabaseAdmin = SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : supabase;

if (!SUPABASE_SERVICE_KEY) {
  console.warn(
    '[WARN] [supabase] SUPABASE_SERVICE_KEY is not set — supabaseAdmin falls back to the anon-key client. ' +
    'Background operations that bypass RLS (e.g. document processing) will fail. ' +
    'Set SUPABASE_SERVICE_KEY to the service_role key in your .env file.',
  );
}

export function createUserClient(accessToken: string) {
  return createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
