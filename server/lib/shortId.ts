import type { SupabaseClient } from '@supabase/supabase-js';

export function formatShortId(prefix: string, num: number): string {
  return `${prefix}${String(num).padStart(2, '0')}`;
}

export async function nextShortId(
  db: SupabaseClient,
  table: string,
  prefix: string,
  scopeColumn: string,
  scopeValue: string,
): Promise<string> {
  const { data } = await db
    .from(table)
    .select('short_id')
    .eq(scopeColumn, scopeValue)
    .not('short_id', 'is', null)
    .order('short_id', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return formatShortId(prefix, 1);
  }

  const lastShortId = data[0].short_id as string;
  const numPart = parseInt(lastShortId.replace(prefix, ''), 10);
  return formatShortId(prefix, (isNaN(numPart) ? 0 : numPart) + 1);
}
