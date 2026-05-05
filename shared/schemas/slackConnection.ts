import { z } from 'zod';

export const SlackConnectionRowSchema = z.object({
  user_id: z.string(),
  team_id: z.string(),
  team_name: z.string(),
  authed_user_id: z.string(),
  bot_user_id: z.string().nullable(),
  scopes: z.string(),
  connected_at: z.string(),
  updated_at: z.string(),
});

export const SlackConnectionSchema = SlackConnectionRowSchema.transform(row => ({
  userId: row.user_id,
  teamId: row.team_id,
  teamName: row.team_name,
  authedUserId: row.authed_user_id,
  botUserId: row.bot_user_id ?? undefined,
  scopes: row.scopes,
  connectedAt: row.connected_at,
  updatedAt: row.updated_at,
}));

export type SlackConnectionRow = z.infer<typeof SlackConnectionRowSchema>;
export type SlackConnection = z.output<typeof SlackConnectionSchema>;
