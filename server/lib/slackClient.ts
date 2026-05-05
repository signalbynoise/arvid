const SLACK_API_BASE = 'https://slack.com/api';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

interface SlackApiResponse {
  ok: boolean;
  error?: string;
  response_metadata?: { next_cursor?: string };
}

interface SlackMessage {
  ts: string;
  thread_ts?: string;
  user?: string;
  text?: string;
  reactions?: Array<{ name: string; count: number }>;
  reply_count?: number;
}

interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_im: boolean;
  num_members?: number;
}

interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  profile?: { display_name?: string };
}

export interface ExtractedMessage {
  slack_ts: string;
  thread_ts: string | null;
  user_id: string;
  username: string;
  text: string;
  reactions: Array<{ name: string; count: number }>;
}

export interface ChannelInfo {
  id: string;
  name: string;
  isPrivate: boolean;
  isIm: boolean;
  memberCount: number | null;
}

async function slackFetch<T extends SlackApiResponse>(
  token: string,
  method: string,
  params: Record<string, string> = {},
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }

    const url = new URL(`${SLACK_API_BASE}/${method}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '1', 10);
      console.warn(
        `[WARN] [slackClient:${method}] Rate limited, retrying after ${retryAfter}s`,
        JSON.stringify({ attempt }),
      );
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    if (res.status >= 500) {
      lastError = new Error(`Slack API ${method} returned ${res.status}`);
      console.warn(
        `[WARN] [slackClient:${method}] Server error, retrying`,
        JSON.stringify({ attempt, status: res.status }),
      );
      continue;
    }

    const data = (await res.json()) as T;

    if (!data.ok) {
      throw new Error(`Slack API ${method} error: ${data.error}`);
    }

    return data;
  }

  throw lastError ?? new Error(`Slack API ${method} failed after ${MAX_RETRIES} retries`);
}

export async function fetchChannels(token: string): Promise<ChannelInfo[]> {
  const channels: ChannelInfo[] = [];
  let cursor = '';

  do {
    const params: Record<string, string> = {
      types: 'public_channel,private_channel,im',
      limit: '200',
      exclude_archived: 'true',
    };
    if (cursor) params.cursor = cursor;

    const data = await slackFetch<SlackApiResponse & { channels: SlackChannel[] }>(
      token,
      'conversations.list',
      params,
    );

    for (const ch of data.channels) {
      channels.push({
        id: ch.id,
        name: ch.is_im ? `DM (${ch.id})` : ch.name,
        isPrivate: ch.is_private,
        isIm: ch.is_im,
        memberCount: ch.num_members ?? null,
      });
    }

    cursor = data.response_metadata?.next_cursor || '';
  } while (cursor);

  console.info(
    `[INFO] [slackClient:fetchChannels] Fetched channels`,
    JSON.stringify({ count: channels.length }),
  );

  return channels;
}

export async function fetchChannelHistory(
  token: string,
  channelId: string,
  limit = 100,
): Promise<SlackMessage[]> {
  const messages: SlackMessage[] = [];
  let cursor = '';

  do {
    const params: Record<string, string> = {
      channel: channelId,
      limit: String(Math.min(limit - messages.length, 100)),
    };
    if (cursor) params.cursor = cursor;

    const data = await slackFetch<SlackApiResponse & { messages: SlackMessage[] }>(
      token,
      'conversations.history',
      params,
    );

    messages.push(...data.messages);
    cursor = data.response_metadata?.next_cursor || '';
  } while (cursor && messages.length < limit);

  console.info(
    `[INFO] [slackClient:fetchChannelHistory] Fetched messages`,
    JSON.stringify({ channelId, count: messages.length }),
  );

  return messages;
}

export async function fetchThreadReplies(
  token: string,
  channelId: string,
  threadTs: string,
): Promise<SlackMessage[]> {
  const messages: SlackMessage[] = [];
  let cursor = '';

  do {
    const params: Record<string, string> = {
      channel: channelId,
      ts: threadTs,
      limit: '100',
    };
    if (cursor) params.cursor = cursor;

    const data = await slackFetch<SlackApiResponse & { messages: SlackMessage[] }>(
      token,
      'conversations.replies',
      params,
    );

    for (const msg of data.messages) {
      if (msg.ts !== threadTs) {
        messages.push(msg);
      }
    }

    cursor = data.response_metadata?.next_cursor || '';
  } while (cursor);

  return messages;
}

export async function resolveUsernames(
  token: string,
  userIds: string[],
): Promise<Map<string, string>> {
  const userMap = new Map<string, string>();
  const unique = [...new Set(userIds)];

  for (const userId of unique) {
    try {
      const data = await slackFetch<SlackApiResponse & { user: SlackUser }>(
        token,
        'users.info',
        { user: userId },
      );
      const name =
        data.user.profile?.display_name ||
        data.user.real_name ||
        data.user.name;
      userMap.set(userId, name);
    } catch (err) {
      console.warn(
        `[WARN] [slackClient:resolveUsernames] Failed to resolve user`,
        JSON.stringify({ userId, error: err instanceof Error ? err.message : 'Unknown' }),
      );
      userMap.set(userId, userId);
    }
  }

  return userMap;
}

export async function extractMessages(
  token: string,
  channelId: string,
  limit = 100,
): Promise<ExtractedMessage[]> {
  const history = await fetchChannelHistory(token, channelId, limit);

  const threadParents = history.filter(
    msg => msg.reply_count && msg.reply_count > 0,
  );

  let allMessages = [...history];

  for (const parent of threadParents) {
    const replies = await fetchThreadReplies(token, channelId, parent.ts);
    allMessages.push(...replies);
  }

  const userIds = allMessages
    .map(m => m.user)
    .filter((uid): uid is string => !!uid);

  const userMap = await resolveUsernames(token, userIds);

  const extracted: ExtractedMessage[] = allMessages.map(msg => ({
    slack_ts: msg.ts,
    thread_ts: msg.thread_ts && msg.thread_ts !== msg.ts ? msg.thread_ts : null,
    user_id: msg.user || 'unknown',
    username: userMap.get(msg.user || '') || msg.user || 'unknown',
    text: msg.text || '',
    reactions: msg.reactions || [],
  }));

  console.info(
    `[INFO] [slackClient:extractMessages] Extraction complete`,
    JSON.stringify({ channelId, totalMessages: extracted.length, threads: threadParents.length }),
  );

  return extracted;
}

export async function postMessage(
  token: string,
  channelId: string,
  blocks: unknown[],
  text: string,
): Promise<void> {
  const res = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel: channelId, blocks, text }),
  });

  const data = (await res.json()) as SlackApiResponse;

  if (!data.ok) {
    throw new Error(`Slack chat.postMessage failed: ${data.error}`);
  }
}
