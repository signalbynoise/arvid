import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { postMessage } from './slackClient';

export type SlackEventType =
  | 'question_posed'
  | 'question_answered'
  | 'requirement_created'
  | 'requirements_extracted'
  | 'summary_generated'
  | 'sent_to_linear'
  | 'sent_to_cursor';

export interface SlackNotification {
  projectId: string;
  eventType: SlackEventType;
  title: string;
  summary: string;
  entityId: string;
  db?: SupabaseClient;
}

const EVENT_LABELS: Record<SlackEventType, string> = {
  question_posed: 'New Question',
  question_answered: 'Question Answered',
  requirement_created: 'New Requirement',
  requirements_extracted: 'Requirements Extracted from Document',
  summary_generated: 'Summary Generated',
  sent_to_linear: 'Sent to Linear',
  sent_to_cursor: 'Sent to Cursor',
};

const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';

function buildBlocks(notification: SlackNotification): unknown[] {
  const label = EVENT_LABELS[notification.eventType];
  const appUrl = `${APP_ORIGIN}`;

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${label}*\n${notification.title}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: notification.summary,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `ID: \`${notification.entityId}\` | <${appUrl}|Open in Arvid>`,
        },
      ],
    },
    { type: 'divider' },
  ];
}

export async function sendSlackNotification(notification: SlackNotification): Promise<void> {
  const client = notification.db ?? supabase;

  try {
    const { data: project, error: projError } = await client
      .from('projects')
      .select('slack_notification_channel_id, user_id')
      .eq('id', notification.projectId)
      .single();

    if (projError || !project?.slack_notification_channel_id) {
      return;
    }

    const { data: channel, error: chanError } = await client
      .from('slack_channels')
      .select('slack_channel_id, connection_id')
      .eq('id', project.slack_notification_channel_id)
      .single();

    if (chanError || !channel) {
      console.warn(
        `[WARN] [slackNotifier] Notification channel not found`,
        JSON.stringify({ channelId: project.slack_notification_channel_id }),
      );
      return;
    }

    const { data: connection, error: connError } = await client
      .from('slack_connections')
      .select('access_token')
      .eq('id', channel.connection_id)
      .single();

    if (connError || !connection) {
      console.warn(
        `[WARN] [slackNotifier] Slack connection not found for notification`,
        JSON.stringify({ connectionId: channel.connection_id }),
      );
      return;
    }

    const blocks = buildBlocks(notification);
    const fallbackText = `${EVENT_LABELS[notification.eventType]}: ${notification.title}`;

    await postMessage(connection.access_token, channel.slack_channel_id, blocks, fallbackText);

    console.info(
      `[INFO] [slackNotifier] Notification sent`,
      JSON.stringify({
        projectId: notification.projectId,
        eventType: notification.eventType,
        channelId: channel.slack_channel_id,
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [slackNotifier] Failed to send notification`,
      JSON.stringify({
        projectId: notification.projectId,
        eventType: notification.eventType,
        error: message,
      }),
    );
  }
}
