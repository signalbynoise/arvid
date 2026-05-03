import { z } from 'zod';

export const ProjectRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  parent_id: z.string().nullable(),
  created_at: z.string().nullable().optional(),
  user_id: z.string().optional(),
});

export const ProjectSchema = ProjectRowSchema.transform(row => ({
  id: row.id,
  name: row.name,
  parentId: row.parent_id ?? undefined,
  createdAt: row.created_at ?? undefined,
}));

export const CreateProjectBodySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  parent_id: z.string().nullable().optional(),
});

export const UpdateProjectBodySchema = z.object({
  name: z.string().min(1).optional(),
});

export type ProjectRow = z.infer<typeof ProjectRowSchema>;
export type Project = z.output<typeof ProjectSchema>;
