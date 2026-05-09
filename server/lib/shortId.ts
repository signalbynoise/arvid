import { randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

const CHARSET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const ID_LENGTH = 4;
const MAX_ATTEMPTS = 5;

function randomChars(length: number): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, b => CHARSET[b % CHARSET.length]).join('');
}

export async function generateShortId(
  db: SupabaseClient,
  table: string,
  prefix: string,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const id = `${prefix}-${randomChars(ID_LENGTH)}`;
    const { data } = await db
      .from(table)
      .select('id')
      .eq('short_id', id)
      .limit(1);

    if (!data || data.length === 0) return id;
  }
  return `${prefix}-${randomChars(ID_LENGTH + 2)}`;
}
