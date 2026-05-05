import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('./slackClient', () => ({
  postMessage: vi.fn(),
}));

import { sendSlackNotification } from './slackNotifier';
import { supabase } from '../supabase';
import { postMessage } from './slackClient';

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;
const mockPostMessage = postMessage as ReturnType<typeof vi.fn>;

function mockSelect(data: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendSlackNotification', () => {
  it('sends a notification when project has a notification channel configured', async () => {
    const projectData = { slack_notification_channel_id: 'ch-uuid', user_id: 'u1' };
    const channelData = { slack_channel_id: 'C123', connection_id: 'conn-uuid' };
    const connectionData = { access_token: 'xoxb-test' };

    mockFrom
      .mockReturnValueOnce(mockSelect(projectData))
      .mockReturnValueOnce(mockSelect(channelData))
      .mockReturnValueOnce(mockSelect(connectionData));

    mockPostMessage.mockResolvedValueOnce(undefined);

    await sendSlackNotification({
      projectId: 'proj-1',
      eventType: 'question_posed',
      title: 'What is the deployment process?',
      summary: 'New question on requirement "CI/CD Pipeline"',
      entityId: 'q-123',
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    const [token, channelId, blocks, text] = mockPostMessage.mock.calls[0];
    expect(token).toBe('xoxb-test');
    expect(channelId).toBe('C123');
    expect(blocks).toHaveLength(4);
    expect(blocks[0].type).toBe('section');
    expect(blocks[0].text.text).toContain('New Question');
    expect(text).toContain('What is the deployment process?');
  });

  it('does nothing when no notification channel is configured', async () => {
    mockFrom.mockReturnValueOnce(mockSelect({ slack_notification_channel_id: null, user_id: 'u1' }));

    await sendSlackNotification({
      projectId: 'proj-1',
      eventType: 'summary_generated',
      title: 'Test',
      summary: 'Test summary',
      entityId: 's-1',
    });

    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('gracefully handles missing connection', async () => {
    const projectData = { slack_notification_channel_id: 'ch-uuid', user_id: 'u1' };
    const channelData = { slack_channel_id: 'C123', connection_id: 'conn-uuid' };

    mockFrom
      .mockReturnValueOnce(mockSelect(projectData))
      .mockReturnValueOnce(mockSelect(channelData))
      .mockReturnValueOnce(mockSelect(null, { message: 'not found' }));

    await sendSlackNotification({
      projectId: 'proj-1',
      eventType: 'question_answered',
      title: 'Test',
      summary: 'Test',
      entityId: 'a-1',
    });

    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('does not throw when postMessage fails', async () => {
    const projectData = { slack_notification_channel_id: 'ch-uuid', user_id: 'u1' };
    const channelData = { slack_channel_id: 'C123', connection_id: 'conn-uuid' };
    const connectionData = { access_token: 'xoxb-test' };

    mockFrom
      .mockReturnValueOnce(mockSelect(projectData))
      .mockReturnValueOnce(mockSelect(channelData))
      .mockReturnValueOnce(mockSelect(connectionData));

    mockPostMessage.mockRejectedValueOnce(new Error('network error'));

    await expect(
      sendSlackNotification({
        projectId: 'proj-1',
        eventType: 'requirement_created',
        title: 'Test',
        summary: 'Test',
        entityId: 'r-1',
      }),
    ).resolves.toBeUndefined();
  });
});
