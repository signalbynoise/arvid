import { z } from 'zod';

export const DeployStatusEnum = z.enum(['live', 'not_deployed', 'deploy_failed', 'unknown']);

export const RenderConnectionRowSchema = z.object({
  user_id: z.string(),
  render_owner_id: z.string().nullable(),
  render_owner_name: z.string().nullable(),
  connected_at: z.string(),
  updated_at: z.string(),
});

export const RenderConnectionSchema = RenderConnectionRowSchema.transform(row => ({
  userId: row.user_id,
  renderOwnerId: row.render_owner_id ?? undefined,
  renderOwnerName: row.render_owner_name ?? undefined,
  connectedAt: row.connected_at,
  updatedAt: row.updated_at,
}));

export const RenderServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  url: z.string().nullable(),
  branch: z.string().nullable(),
  repo: z.string().nullable(),
  suspended: z.string().nullable(),
});

export type DeployStatus = z.infer<typeof DeployStatusEnum>;
export type RenderConnectionRow = z.infer<typeof RenderConnectionRowSchema>;
export type RenderConnection = z.output<typeof RenderConnectionSchema>;
export type RenderService = z.infer<typeof RenderServiceSchema>;
