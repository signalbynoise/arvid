import { z } from 'zod';

export const WorkspaceRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  logo_url: z.string().nullable().optional(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  is_deleted: z.boolean(),
  deleted_at: z.string().nullable(),
});

export const WorkspaceSchema = WorkspaceRowSchema.transform(row => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  logoUrl: row.logo_url ?? undefined,
  createdBy: row.created_by,
  createdAt: row.created_at,
  isDeleted: row.is_deleted,
  deletedAt: row.deleted_at ?? undefined,
}));

export const CreateWorkspaceBodySchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100),
});

export const UpdateWorkspaceBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logo_url: z.string().url().nullable().optional(),
});

export type WorkspaceRow = z.infer<typeof WorkspaceRowSchema>;
export type Workspace = z.output<typeof WorkspaceSchema>;
