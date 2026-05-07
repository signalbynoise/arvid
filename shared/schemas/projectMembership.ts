import { z } from 'zod';

export const ProjectMembershipRowSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string(),
  user_id: z.string().uuid(),
  role: z.enum(['admin', 'member']),
  joined_at: z.string(),
  email: z.string().optional(),
});

export const ProjectMembershipSchema = ProjectMembershipRowSchema.transform(row => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  role: row.role,
  joinedAt: row.joined_at,
  email: row.email ?? undefined,
}));

export const CreateProjectMembershipBodySchema = z.object({
  project_id: z.string(),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'member']),
});

export type ProjectMembershipRow = z.infer<typeof ProjectMembershipRowSchema>;
export type ProjectMembership = z.output<typeof ProjectMembershipSchema>;
