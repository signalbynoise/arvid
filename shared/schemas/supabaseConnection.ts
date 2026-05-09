import { z } from 'zod';

export const SupabaseConnectionRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  supabase_org_id: z.string().nullable(),
  supabase_org_name: z.string().nullable(),
  scopes: z.string(),
  connected_at: z.string(),
  updated_at: z.string(),
});

export const SupabaseConnectionSchema = SupabaseConnectionRowSchema.transform(row => ({
  id: row.id,
  userId: row.user_id,
  supabaseOrgId: row.supabase_org_id ?? undefined,
  supabaseOrgName: row.supabase_org_name ?? undefined,
  scopes: row.scopes,
  connectedAt: row.connected_at,
  updatedAt: row.updated_at,
}));

export const SupabaseProjectRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  organization_id: z.string(),
  region: z.string(),
  status: z.string(),
});

export type SupabaseConnectionRow = z.infer<typeof SupabaseConnectionRowSchema>;
export type SupabaseConnection = z.output<typeof SupabaseConnectionSchema>;
export type SupabaseProjectRef = z.infer<typeof SupabaseProjectRefSchema>;
