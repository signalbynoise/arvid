import { z } from 'zod';

export const LinearConnectionRowSchema = z.object({
  user_id: z.string(),
  linear_user_id: z.string(),
  linear_username: z.string(),
  linear_avatar_url: z.string().nullable(),
  scopes: z.string(),
  connected_at: z.string(),
  updated_at: z.string(),
});

export const LinearConnectionSchema = LinearConnectionRowSchema.transform(row => ({
  userId: row.user_id,
  linearUserId: row.linear_user_id,
  linearUsername: row.linear_username,
  linearAvatarUrl: row.linear_avatar_url ?? undefined,
  scopes: row.scopes,
  connectedAt: row.connected_at,
  updatedAt: row.updated_at,
}));

export type LinearConnectionRow = z.infer<typeof LinearConnectionRowSchema>;
export type LinearConnection = z.output<typeof LinearConnectionSchema>;
