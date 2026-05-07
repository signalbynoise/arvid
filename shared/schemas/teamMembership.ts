import { z } from 'zod';

export const TeamMembershipRowSchema = z.object({
  id: z.string().uuid(),
  team_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['admin', 'member']),
  joined_at: z.string(),
  email: z.string().optional(),
});

export const TeamMembershipSchema = TeamMembershipRowSchema.transform(row => ({
  id: row.id,
  teamId: row.team_id,
  userId: row.user_id,
  role: row.role,
  joinedAt: row.joined_at,
  email: row.email ?? undefined,
}));

export const CreateTeamMembershipBodySchema = z.object({
  team_id: z.string().uuid(),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'member']),
});

export type TeamMembershipRow = z.infer<typeof TeamMembershipRowSchema>;
export type TeamMembership = z.output<typeof TeamMembershipSchema>;
