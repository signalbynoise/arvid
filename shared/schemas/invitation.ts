import { z } from 'zod';

export const InvitationStatusEnum = z.enum(['pending', 'accepted', 'expired']);
export type InvitationStatus = z.infer<typeof InvitationStatusEnum>;

export const InvitationScopeEnum = z.enum(['workspace', 'team', 'project']);
export type InvitationScope = z.infer<typeof InvitationScopeEnum>;

export const InvitationRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  team_id: z.string().uuid().nullable(),
  project_id: z.string().nullable().optional(),
  scope: InvitationScopeEnum,
  email: z.string(),
  role: z.enum(['admin', 'member']),
  status: InvitationStatusEnum,
  invited_by: z.string().uuid(),
  created_at: z.string(),
  expires_at: z.string(),
});

export const InvitationSchema = InvitationRowSchema.transform(row => ({
  id: row.id,
  workspaceId: row.workspace_id,
  teamId: row.team_id ?? undefined,
  projectId: row.project_id ?? undefined,
  scope: row.scope,
  email: row.email,
  role: row.role,
  status: row.status,
  invitedBy: row.invited_by,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
}));

export const CreateInvitationBodySchema = z.object({
  workspace_id: z.string().uuid(),
  team_id: z.string().uuid().optional(),
  project_id: z.string().optional(),
  scope: InvitationScopeEnum.default('workspace'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'member']),
});

export type InvitationRow = z.infer<typeof InvitationRowSchema>;
export type Invitation = z.output<typeof InvitationSchema>;
