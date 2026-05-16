import { z } from 'zod';

export const WorkspaceRoleEnum = z.enum(['owner', 'admin', 'member', 'guest']);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleEnum>;

export const MembershipRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: WorkspaceRoleEnum,
  joined_at: z.string(),
  email: z.string().optional(),
  display_name: z.string().optional(),
});

export const MembershipSchema = MembershipRowSchema.transform(row => ({
  id: row.id,
  workspaceId: row.workspace_id,
  userId: row.user_id,
  role: row.role,
  joinedAt: row.joined_at,
  email: row.email ?? undefined,
  displayName: row.display_name ?? undefined,
}));

export const CreateMembershipBodySchema = z.object({
  workspace_id: z.string().uuid(),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'member']),
});

export const UpdateMembershipBodySchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
});

export type MembershipRow = z.infer<typeof MembershipRowSchema>;
export type Membership = z.output<typeof MembershipSchema>;
