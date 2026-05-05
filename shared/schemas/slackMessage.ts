import { z } from 'zod';

export const SlackMessageRowSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  channel_id: z.string(),
  slack_ts: z.string(),
  thread_ts: z.string().nullable(),
  user_id: z.string(),
  username: z.string(),
  text: z.string(),
  reactions: z.array(z.unknown()),
  extracted_at: z.string(),
});

export const SlackMessageSchema = SlackMessageRowSchema.transform(row => ({
  id: row.id,
  projectId: row.project_id,
  channelId: row.channel_id,
  slackTs: row.slack_ts,
  threadTs: row.thread_ts ?? undefined,
  userId: row.user_id,
  username: row.username,
  text: row.text,
  reactions: row.reactions,
  extractedAt: row.extracted_at,
}));

export type SlackMessageRow = z.infer<typeof SlackMessageRowSchema>;
export type SlackMessage = z.output<typeof SlackMessageSchema>;
