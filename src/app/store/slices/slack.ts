import { StateCreator } from 'zustand';
import { api } from '../../api';
import { logger } from '../../logger';

const log = logger.create('store:slack');

export type SlackConnectionStatus = 'idle' | 'loading' | 'connected' | 'disconnected' | 'error';
export type ExtractionStatus = 'idle' | 'extracting' | 'done' | 'error';

export interface SlackConnectionState {
  status: SlackConnectionStatus;
  teamName?: string;
  teamId?: string;
  error?: string;
}

export interface SlackChannel {
  id: string;
  slackChannelId: string;
  projectId?: string;
  name: string;
  isPrivate: boolean;
  isIm: boolean;
  memberCount?: number;
}

export interface SlackSlice {
  slackConnection: SlackConnectionState;
  slackChannels: SlackChannel[];
  extractionStatus: Record<string, ExtractionStatus>;

  loadSlackStatus: () => Promise<void>;
  loadSlackChannels: () => Promise<void>;
  disconnectSlack: () => Promise<void>;
  linkChannelsToProject: (projectId: string, channelIds: string[]) => Promise<void>;
  extractMessages: (projectId: string) => Promise<void>;
  setNotificationChannel: (projectId: string, channelId: string | null) => Promise<void>;
}

export const createSlackSlice: StateCreator<SlackSlice, [], [], SlackSlice> = (set) => ({
  slackConnection: { status: 'idle' },
  slackChannels: [],
  extractionStatus: {},

  loadSlackStatus: async () => {
    set({ slackConnection: { status: 'loading' } });
    log.info('loadSlackStatus', 'Checking Slack connection');

    try {
      const result = await api.getSlackStatus();
      if (result.connected) {
        set({
          slackConnection: {
            status: 'connected',
            teamName: result.teamName,
            teamId: result.teamId,
          },
        });
        log.info('loadSlackStatus', 'Slack connected', { teamName: result.teamName });
      } else {
        set({ slackConnection: { status: 'disconnected' } });
        log.info('loadSlackStatus', 'Slack not connected');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ slackConnection: { status: 'error', error: message } });
      log.error('loadSlackStatus', 'Failed to check Slack status', { error: message });
    }
  },

  loadSlackChannels: async () => {
    log.info('loadSlackChannels', 'Fetching Slack channels');

    try {
      const channels = await api.getSlackChannels();
      const mapped: SlackChannel[] = channels.map((ch: Record<string, unknown>) => ({
        id: ch.id as string,
        slackChannelId: ch.slack_channel_id as string,
        projectId: (ch.project_id as string) || undefined,
        name: ch.name as string,
        isPrivate: ch.is_private as boolean,
        isIm: ch.is_im as boolean,
        memberCount: (ch.member_count as number) || undefined,
      }));
      set({ slackChannels: mapped });
      log.info('loadSlackChannels', 'Channels loaded', { count: mapped.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('loadSlackChannels', 'Failed to load channels', { error: message });
    }
  },

  disconnectSlack: async () => {
    log.info('disconnectSlack', 'Disconnecting Slack');

    try {
      await api.disconnectSlack();
      set({
        slackConnection: { status: 'disconnected' },
        slackChannels: [],
      });
      log.info('disconnectSlack', 'Slack disconnected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('disconnectSlack', 'Failed to disconnect', { error: message });
    }
  },

  linkChannelsToProject: async (projectId: string, channelIds: string[]) => {
    log.info('linkChannelsToProject', 'Linking channels', { projectId, count: channelIds.length });

    try {
      await api.linkSlackChannels(projectId, channelIds);
      set(state => ({
        slackChannels: state.slackChannels.map(ch => ({
          ...ch,
          projectId: channelIds.includes(ch.id) ? projectId : ch.projectId === projectId ? undefined : ch.projectId,
        })),
      }));
      log.info('linkChannelsToProject', 'Channels linked');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('linkChannelsToProject', 'Failed to link channels', { error: message });
      throw err;
    }
  },

  extractMessages: async (projectId: string) => {
    set(state => ({
      extractionStatus: { ...state.extractionStatus, [projectId]: 'extracting' as const },
    }));
    log.info('extractMessages', 'Starting extraction', { projectId });

    try {
      await api.extractSlackMessages(projectId);
      set(state => ({
        extractionStatus: { ...state.extractionStatus, [projectId]: 'done' as const },
      }));
      log.info('extractMessages', 'Extraction complete', { projectId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set(state => ({
        extractionStatus: { ...state.extractionStatus, [projectId]: 'error' as const },
      }));
      log.error('extractMessages', 'Extraction failed', { projectId, error: message });
      throw err;
    }
  },

  setNotificationChannel: async (projectId: string, channelId: string | null) => {
    log.info('setNotificationChannel', 'Setting notification channel', { projectId, channelId });

    try {
      await api.setSlackNotificationChannel(projectId, channelId);

      set((state) => {
        const projectsSlice = state as unknown as { projects: Array<{ id: string; slackNotificationChannelId?: string }> };
        return {
          projects: projectsSlice.projects.map(p =>
            p.id === projectId ? { ...p, slackNotificationChannelId: channelId ?? undefined } : p,
          ),
        } as Partial<SlackSlice>;
      });

      log.info('setNotificationChannel', 'Notification channel updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('setNotificationChannel', 'Failed to set notification channel', { error: message });
      throw err;
    }
  },
});
