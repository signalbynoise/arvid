import { z } from 'zod';

export const FigmaConnectionRowSchema = z.object({
  user_id: z.string(),
  figma_user_id: z.string().nullable(),
  figma_username: z.string().nullable(),
  figma_email: z.string().nullable(),
  connected_at: z.string(),
  updated_at: z.string(),
});

export const FigmaConnectionSchema = FigmaConnectionRowSchema.transform(row => ({
  userId: row.user_id,
  figmaUserId: row.figma_user_id ?? undefined,
  figmaUsername: row.figma_username ?? undefined,
  figmaEmail: row.figma_email ?? undefined,
  connectedAt: row.connected_at,
  updatedAt: row.updated_at,
}));

export type FigmaConnectionRow = z.infer<typeof FigmaConnectionRowSchema>;
export type FigmaConnection = z.output<typeof FigmaConnectionSchema>;
