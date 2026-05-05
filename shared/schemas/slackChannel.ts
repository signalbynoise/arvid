import { z } from 'zod';

export const SlackChannelRowSchema = z.object({
  id: z.string(),
  slack_channel_id: z.string(),
  connection_id: z.string(),
  project_id: z.string().nullable(),
  name: z.string(),
  is_private: z.boolean(),
  is_im: z.boolean(),
  member_count: z.number().nullable(),
  last_synced_at: z.string().nullable(),
});

export const SlackChannelSchema = SlackChannelRowSchema.transform(row => ({
  id: row.id,
  slackChannelId: row.slack_channel_id,
  connectionId: row.connection_id,
  projectId: row.project_id ?? undefined,
  name: row.name,
  isPrivate: row.is_private,
  isIm: row.is_im,
  memberCount: row.member_count ?? undefined,
  lastSyncedAt: row.last_synced_at ?? undefined,
}));

export type SlackChannelRow = z.infer<typeof SlackChannelRowSchema>;
export type SlackChannel = z.output<typeof SlackChannelSchema>;
