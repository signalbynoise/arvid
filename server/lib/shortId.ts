import type { SupabaseClient } from '@supabase/supabase-js';

export function formatShortId(prefix: string, count: number): string {
  return `${prefix}${String(count + 1).padStart(2, '0')}`;
}

export async function nextShortId(
  db: SupabaseClient,
  table: string,
  prefix: string,
  scopeColumn: string,
  scopeValue: string,
): Promise<string> {
  const { count } = await db
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(scopeColumn, scopeValue);

  return formatShortId(prefix, count ?? 0);
}
