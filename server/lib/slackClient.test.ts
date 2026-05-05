import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { fetchChannelHistory, fetchThreadReplies, resolveUsernames, extractMessages } from './slackClient';

function slackOk<T>(data: T) {
  return { ok: true, status: 200, json: () => Promise.resolve({ ok: true, ...data }) };
}

function slackRateLimit(retryAfter = 1) {
  return {
    ok: false,
    status: 429,
    headers: { get: (key: string) => key === 'Retry-After' ? String(retryAfter) : null },
    json: () => Promise.resolve({ ok: false, error: 'ratelimited' }),
  };
}

function slackServerError() {
  return { ok: false, status: 500, json: () => Promise.resolve({ ok: false, error: 'server_error' }) };
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.useFakeTimers();
});

describe('fetchChannelHistory', () => {
  it('fetches messages with pagination', async () => {
    mockFetch
      .mockResolvedValueOnce(slackOk({
        messages: [{ ts: '1.0', text: 'first' }],
        response_metadata: { next_cursor: 'abc' },
      }))
      .mockResolvedValueOnce(slackOk({
        messages: [{ ts: '2.0', text: 'second' }],
        response_metadata: { next_cursor: '' },
      }));

    vi.useRealTimers();
    const messages = await fetchChannelHistory('xoxb-token', 'C123', 200);

    expect(messages).toHaveLength(2);
    expect(messages[0].ts).toBe('1.0');
    expect(messages[1].ts).toBe('2.0');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('stops at the limit', async () => {
    const msgs = Array.from({ length: 100 }, (_, i) => ({ ts: `${i}.0`, text: `msg${i}` }));
    mockFetch.mockResolvedValueOnce(slackOk({
      messages: msgs,
      response_metadata: { next_cursor: 'more' },
    }));

    vi.useRealTimers();
    const messages = await fetchChannelHistory('xoxb-token', 'C123', 100);

    expect(messages).toHaveLength(100);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on rate limit', async () => {
    mockFetch
      .mockResolvedValueOnce(slackRateLimit(0))
      .mockResolvedValueOnce(slackOk({
        messages: [{ ts: '1.0', text: 'ok' }],
        response_metadata: {},
      }));

    vi.useRealTimers();
    const messages = await fetchChannelHistory('xoxb-token', 'C123', 100);

    expect(messages).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on server error with backoff', async () => {
    mockFetch
      .mockResolvedValueOnce(slackServerError())
      .mockResolvedValueOnce(slackOk({
        messages: [{ ts: '1.0', text: 'recovered' }],
        response_metadata: {},
      }));

    vi.useRealTimers();
    const messages = await fetchChannelHistory('xoxb-token', 'C123', 100);

    expect(messages).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws after max retries on persistent server error', async () => {
    mockFetch.mockResolvedValue(slackServerError());

    vi.useRealTimers();
    await expect(fetchChannelHistory('xoxb-token', 'C123', 10))
      .rejects.toThrow(/Slack API.*500/);

    expect(mockFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  }, 15000);
});

describe('fetchThreadReplies', () => {
  it('fetches replies excluding the parent message', async () => {
    mockFetch.mockResolvedValueOnce(slackOk({
      messages: [
        { ts: '1.0', text: 'parent' },
        { ts: '1.1', text: 'reply1' },
        { ts: '1.2', text: 'reply2' },
      ],
      response_metadata: {},
    }));

    vi.useRealTimers();
    const replies = await fetchThreadReplies('xoxb-token', 'C123', '1.0');

    expect(replies).toHaveLength(2);
    expect(replies[0].ts).toBe('1.1');
    expect(replies[1].ts).toBe('1.2');
  });
});

describe('resolveUsernames', () => {
  it('resolves user IDs to display names', async () => {
    mockFetch.mockResolvedValue(slackOk({
      user: { id: 'U1', name: 'john', real_name: 'John Doe', profile: { display_name: 'JD' } },
    }));

    vi.useRealTimers();
    const map = await resolveUsernames('xoxb-token', ['U1', 'U1']);

    expect(map.get('U1')).toBe('JD');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to user ID on error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: false, error: 'user_not_found' }),
    });

    vi.useRealTimers();
    const map = await resolveUsernames('xoxb-token', ['U404']);

    expect(map.get('U404')).toBe('U404');
  });
});

describe('extractMessages', () => {
  it('fetches history, threads, and resolves usernames', async () => {
    mockFetch
      .mockResolvedValueOnce(slackOk({
        messages: [
          { ts: '1.0', user: 'U1', text: 'parent', reply_count: 1 },
          { ts: '2.0', user: 'U2', text: 'standalone' },
        ],
        response_metadata: {},
      }))
      .mockResolvedValueOnce(slackOk({
        messages: [
          { ts: '1.0', user: 'U1', text: 'parent' },
          { ts: '1.1', user: 'U3', text: 'reply', thread_ts: '1.0' },
        ],
        response_metadata: {},
      }))
      .mockResolvedValueOnce(slackOk({ user: { id: 'U1', name: 'alice', profile: {} } }))
      .mockResolvedValueOnce(slackOk({ user: { id: 'U2', name: 'bob', profile: {} } }))
      .mockResolvedValueOnce(slackOk({ user: { id: 'U3', name: 'charlie', profile: {} } }));

    vi.useRealTimers();
    const extracted = await extractMessages('xoxb-token', 'C123', 100);

    expect(extracted.length).toBe(3);
    const reply = extracted.find(m => m.slack_ts === '1.1');
    expect(reply?.thread_ts).toBe('1.0');
    expect(reply?.username).toBe('charlie');
  });
});
