import { Router } from 'express';
import crypto from 'crypto';
import { supabase, supabaseAdmin, createUserClient } from '../supabase';
import { fetchChannels, extractMessages } from '../lib/slackClient';
import { analyzeSlackMessages } from '../openrouter';

export const slackRouter = Router();
export const slackCallbackRouter = Router();

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';

const SLACK_SCOPES = [
  'channels:read',
  'channels:history',
  'groups:read',
  'groups:history',
  'im:read',
  'im:history',
  'chat:write',
  'users:read',
].join(',');

if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET) {
  console.warn('[WARN] [slack:init] SLACK_CLIENT_ID or SLACK_CLIENT_SECRET not set — Slack integration will not work');
}

const pendingOAuthStates = new Map<string, { userId: string; expiresAt: number }>();

slackRouter.get('/auth', (req, res) => {
  if (!SLACK_CLIENT_ID) {
    return res.status(500).json({ error: 'Slack OAuth not configured on server' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  pendingOAuthStates.set(state, {
    userId: req.user!.id,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: SLACK_CLIENT_ID,
    scope: SLACK_SCOPES,
    redirect_uri: `${req.protocol}://${req.get('host')}/api/slack/callback`,
    state,
  });

  console.info(
    `[INFO] [slack:auth] Redirecting to Slack OAuth`,
    JSON.stringify({ userId: req.user!.id }),
  );

  res.json({ url: `https://slack.com/oauth/v2/authorize?${params.toString()}` });
});

slackCallbackRouter.get('/', async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code || !state) {
    return res.redirect(`${APP_ORIGIN}?slack_error=missing_params`);
  }

  const pending = pendingOAuthStates.get(state);
  if (!pending || pending.expiresAt < Date.now()) {
    pendingOAuthStates.delete(state);
    return res.redirect(`${APP_ORIGIN}?slack_error=invalid_state`);
  }

  pendingOAuthStates.delete(state);
  const { userId } = pending;

  try {
    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID!,
        client_secret: SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: `${req.protocol}://${req.get('host')}/api/slack/callback`,
      }),
    });

    const tokenData = await tokenRes.json() as {
      ok: boolean;
      error?: string;
      access_token?: string;
      team?: { id: string; name: string };
      authed_user?: { id: string };
      bot_user_id?: string;
      scope?: string;
    };

    if (!tokenData.ok || !tokenData.access_token) {
      console.error(
        `[ERROR] [slack:callback] Token exchange failed`,
        JSON.stringify({ error: tokenData.error }),
      );
      return res.redirect(`${APP_ORIGIN}?slack_error=token_exchange_failed`);
    }

    const { error: upsertError } = await supabase
      .from('slack_connections')
      .upsert(
        {
          user_id: userId,
          team_id: tokenData.team?.id ?? '',
          team_name: tokenData.team?.name ?? '',
          access_token: tokenData.access_token,
          authed_user_id: tokenData.authed_user?.id ?? '',
          bot_user_id: tokenData.bot_user_id ?? null,
          scopes: tokenData.scope ?? '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (upsertError) {
      console.error(
        `[ERROR] [slack:callback] Failed to store connection`,
        JSON.stringify({ error: upsertError.message }),
      );
      return res.redirect(`${APP_ORIGIN}?slack_error=storage_failed`);
    }

    console.info(
      `[INFO] [slack:callback] Slack connected successfully`,
      JSON.stringify({ userId, teamName: tokenData.team?.name }),
    );

    res.redirect(`${APP_ORIGIN}?slack_connected=true`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [slack:callback] OAuth flow failed`,
      JSON.stringify({ error: message }),
    );
    res.redirect(`${APP_ORIGIN}?slack_error=unknown`);
  }
});

slackRouter.get('/status', async (req, res) => {
  const { data, error } = await supabase
    .from('slack_connections')
    .select('team_id, team_name, authed_user_id, scopes, created_at, updated_at')
    .eq('user_id', req.user!.id)
    .single();

  if (error || !data) {
    return res.json({ connected: false });
  }

  res.json({
    connected: true,
    teamName: data.team_name,
    teamId: data.team_id,
  });
});

slackRouter.delete('/connect', async (req, res) => {
  const { error } = await supabase
    .from('slack_connections')
    .delete()
    .eq('user_id', req.user!.id);

  if (error) {
    console.error(
      `[ERROR] [slack:disconnect] Failed to disconnect`,
      JSON.stringify({ userId: req.user!.id, error: error.message }),
    );
    return res.status(500).json({ error: error.message });
  }

  console.info(
    `[INFO] [slack:disconnect] Slack disconnected`,
    JSON.stringify({ userId: req.user!.id }),
  );

  res.status(204).send();
});

slackRouter.get('/channels', async (req, res) => {
  const { data: connection, error: connError } = await supabase
    .from('slack_connections')
    .select('id, access_token')
    .eq('user_id', req.user!.id)
    .single();

  if (connError || !connection) {
    return res.status(403).json({ error: 'Slack not connected' });
  }

  try {
    const channels = await fetchChannels(connection.access_token);

    for (const channel of channels) {
      await supabase
        .from('slack_channels')
        .upsert(
          {
            slack_channel_id: channel.id,
            connection_id: connection.id,
            name: channel.name,
            is_private: channel.isPrivate,
            is_im: channel.isIm,
            member_count: channel.memberCount,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: 'connection_id,slack_channel_id' },
        );
    }

    const { data: cachedChannels } = await supabase
      .from('slack_channels')
      .select('*')
      .eq('connection_id', connection.id)
      .order('name');

    res.json(cachedChannels || []);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [slack:channels] Failed to fetch channels`,
      JSON.stringify({ userId: req.user!.id, error: message }),
    );
    res.status(500).json({ error: message });
  }
});

slackRouter.post('/extract/:projectId', async (req, res) => {
  const { projectId } = req.params;

  const { data: connection, error: connError } = await supabase
    .from('slack_connections')
    .select('id, access_token')
    .eq('user_id', req.user!.id)
    .single();

  if (connError || !connection) {
    return res.status(403).json({ error: 'Slack not connected' });
  }

  const { data: linkedChannels, error: chanError } = await supabase
    .from('slack_channels')
    .select('id, slack_channel_id, name')
    .eq('connection_id', connection.id)
    .eq('project_id', projectId);

  if (chanError || !linkedChannels || linkedChannels.length === 0) {
    return res.status(400).json({ error: 'No Slack channels linked to this project' });
  }

  console.info(
    `[INFO] [slack:extract] Starting extraction`,
    JSON.stringify({ projectId, channelCount: linkedChannels.length }),
  );

  const results: Record<string, number> = {};

  for (const channel of linkedChannels) {
    try {
      const messages = await extractMessages(
        connection.access_token,
        channel.slack_channel_id,
        100,
      );

      if (messages.length > 0) {
        const rows = messages.map(msg => ({
          project_id: projectId,
          channel_id: channel.id,
          slack_ts: msg.slack_ts,
          thread_ts: msg.thread_ts,
          user_id: msg.user_id,
          username: msg.username,
          text: msg.text,
          reactions: msg.reactions,
        }));

        const { error: insertError } = await supabase
          .from('slack_messages')
          .upsert(rows, { onConflict: 'channel_id,slack_ts' });

        if (insertError) {
          console.error(
            `[ERROR] [slack:extract] Failed to store messages`,
            JSON.stringify({ channelId: channel.id, error: insertError.message }),
          );
        }
      }

      results[channel.name] = messages.length;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        `[ERROR] [slack:extract] Channel extraction failed`,
        JSON.stringify({ channelId: channel.id, channelName: channel.name, error: message }),
      );
      results[channel.name] = -1;
    }
  }

  console.info(
    `[INFO] [slack:extract] Extraction complete`,
    JSON.stringify({ projectId, results }),
  );

  res.json({ results });
});

slackRouter.post('/link-channel/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { channelIds } = req.body as { channelIds: string[] };

  if (!channelIds || !Array.isArray(channelIds)) {
    return res.status(400).json({ error: 'channelIds array required' });
  }

  const { data: connection, error: connError } = await supabase
    .from('slack_connections')
    .select('id')
    .eq('user_id', req.user!.id)
    .single();

  if (connError || !connection) {
    return res.status(403).json({ error: 'Slack not connected' });
  }

  await supabase
    .from('slack_channels')
    .update({ project_id: null })
    .eq('connection_id', connection.id)
    .eq('project_id', projectId);

  if (channelIds.length > 0) {
    const { error } = await supabase
      .from('slack_channels')
      .update({ project_id: projectId })
      .eq('connection_id', connection.id)
      .in('id', channelIds);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  console.info(
    `[INFO] [slack:linkChannel] Channels linked to project`,
    JSON.stringify({ projectId, channelIds }),
  );

  res.json({ linked: channelIds.length });
});

slackRouter.patch('/notify-channel/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { channelId } = req.body as { channelId: string | null };

  const db = createUserClient(req.accessToken!);

  const { data: proj } = await db
    .from('projects')
    .select('workspace_id')
    .eq('id', projectId)
    .single();

  if (!proj) return res.status(404).json({ error: 'Project not found' });

  const { data: membership } = await supabaseAdmin
    .from('workspace_memberships')
    .select('role')
    .eq('workspace_id', proj.workspace_id)
    .eq('user_id', req.user!.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return res.status(403).json({ error: 'Only admins and owners can change project integrations' });
  }

  const { error } = await db
    .from('projects')
    .update({ slack_notification_channel_id: channelId })
    .eq('id', projectId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  console.info(
    `[INFO] [slack:notifyChannel] Notification channel updated`,
    JSON.stringify({ projectId, channelId }),
  );

  res.json({ success: true });
});

slackRouter.post('/extract-messages/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { channelId } = req.body as { channelId: string };

  if (!channelId) {
    return res.status(400).json({ error: 'channelId required' });
  }

  const { data: connection, error: connError } = await supabase
    .from('slack_connections')
    .select('id, access_token')
    .eq('user_id', req.user!.id)
    .single();

  if (connError || !connection) {
    return res.status(403).json({ error: 'Slack not connected' });
  }

  const { data: channel, error: chanError } = await supabase
    .from('slack_channels')
    .select('slack_channel_id, name')
    .eq('id', channelId)
    .eq('connection_id', connection.id)
    .single();

  if (chanError || !channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  console.info(
    `[INFO] [slack:extractMessages] Extracting messages only`,
    JSON.stringify({ projectId, channelName: channel.name }),
  );

  try {
    const rawMessages = await extractMessages(
      connection.access_token,
      channel.slack_channel_id,
      200,
    );

    const messages = rawMessages.map(m => ({
      slack_ts: m.slack_ts,
      thread_ts: m.thread_ts ?? undefined,
      username: m.username,
      text: m.text,
    }));

    console.info(
      `[INFO] [slack:extractMessages] Done`,
      JSON.stringify({ messageCount: messages.length }),
    );

    res.json({ messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [slack:extractMessages] Failed`,
      JSON.stringify({ error: message }),
    );
    res.status(500).json({ error: message });
  }
});

slackRouter.post('/analyze/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { channelId } = req.body as { channelId: string };

  if (!channelId) {
    return res.status(400).json({ error: 'channelId required' });
  }

  const { data: connection, error: connError } = await supabase
    .from('slack_connections')
    .select('id, access_token')
    .eq('user_id', req.user!.id)
    .single();

  if (connError || !connection) {
    return res.status(403).json({ error: 'Slack not connected' });
  }

  const { data: channel, error: chanError } = await supabase
    .from('slack_channels')
    .select('slack_channel_id, name')
    .eq('id', channelId)
    .eq('connection_id', connection.id)
    .single();

  if (chanError || !channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  console.info(
    `[INFO] [slack:analyze] Starting analysis`,
    JSON.stringify({ projectId, channelName: channel.name }),
  );

  try {
    const rawMessages = await extractMessages(
      connection.access_token,
      channel.slack_channel_id,
      100,
    );

    if (rawMessages.length === 0) {
      return res.json({ messages: [], suggestions: [] });
    }

    const messages = rawMessages.map(m => ({
      slack_ts: m.slack_ts,
      thread_ts: m.thread_ts ?? undefined,
      username: m.username,
      text: m.text,
    }));

    const { data: existingReqs } = await supabase
      .from('requirements')
      .select('title')
      .eq('project_id', projectId);

    const existingTitles = (existingReqs || []).map((r: { title: string }) => r.title);

    const suggestions = await analyzeSlackMessages(messages, existingTitles);

    console.info(
      `[INFO] [slack:analyze] Analysis complete`,
      JSON.stringify({ projectId, messageCount: messages.length, suggestionCount: suggestions.length }),
    );

    res.json({ messages, suggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [slack:analyze] Analysis failed`,
      JSON.stringify({ projectId, error: message }),
    );
    res.status(500).json({ error: message });
  }
});

slackRouter.post('/reanalyze/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { messages } = req.body as {
    messages: Array<{ slack_ts: string; thread_ts?: string; username: string; text: string }>;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  console.info(
    `[INFO] [slack:reanalyze] Re-analyzing selected messages`,
    JSON.stringify({ projectId, messageCount: messages.length }),
  );

  try {
    const { data: existingReqs } = await supabase
      .from('requirements')
      .select('title')
      .eq('project_id', projectId);

    const existingTitles = (existingReqs || []).map((r: { title: string }) => r.title);
    const suggestions = await analyzeSlackMessages(messages, existingTitles);

    console.info(
      `[INFO] [slack:reanalyze] Re-analysis complete`,
      JSON.stringify({ projectId, suggestionCount: suggestions.length }),
    );

    res.json({ suggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [slack:reanalyze] Re-analysis failed`,
      JSON.stringify({ projectId, error: message }),
    );
    res.status(500).json({ error: message });
  }
});
