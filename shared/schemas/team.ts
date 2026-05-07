import { z } from 'zod';

export const TeamRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  short_id: z.string().nullable().optional(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  is_deleted: z.boolean(),
  deleted_at: z.string().nullable(),
});

export const TeamSchema = TeamRowSchema.transform(row => ({
  id: row.id,
  workspaceId: row.workspace_id,
  name: row.name,
  slug: row.slug,
  shortId: row.short_id ?? undefined,
  createdBy: row.created_by,
  createdAt: row.created_at,
  isDeleted: row.is_deleted,
  deletedAt: row.deleted_at ?? undefined,
}));

export const CreateTeamBodySchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
  workspace_id: z.string().uuid(),
});

export const UpdateTeamBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type TeamRow = z.infer<typeof TeamRowSchema>;
export type Team = z.output<typeof TeamSchema>;
