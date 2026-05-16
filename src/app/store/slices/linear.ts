import { StateCreator } from 'zustand';
import { api } from '../../api';
import { logger } from '../../logger';

const log = logger.create('store:linear');

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearProject {
  id: string;
  name: string;
}

export type LinearConnectionStatus = 'idle' | 'loading' | 'connected' | 'disconnected' | 'error';
export type LinearLinkStatus = 'idle' | 'loading' | 'error';
export type SendToLinearStatus = 'idle' | 'sending' | 'sent' | 'error';

export interface LinearConnectionState {
  status: LinearConnectionStatus;
  username?: string;
  avatarUrl?: string;
  error?: string;
}

export interface LinearSlice {
  linearConnection: LinearConnectionState;
  linearTeams: LinearTeam[];
  linearProjects: LinearProject[];
  linearLinkStatus: LinearLinkStatus;
  sendToLinearStatus: SendToLinearStatus;
  sendToLinearError: string | undefined;

  loadLinearStatus: () => Promise<void>;
  disconnectLinear: () => Promise<void>;
  loadLinearTeams: () => Promise<void>;
  loadLinearProjects: (teamId: string) => Promise<void>;
  linkLinearProject: (projectId: string, linearProjectId: string, linearProjectName: string, linearTeamId: string) => Promise<void>;
  sendToLinear: (requirementId: string) => Promise<void>;
  autoCreateLinearIssue: (requirementId: string) => Promise<void>;
  autoSyncLinearIssue: (requirementId: string) => Promise<void>;
  resetSendToLinearStatus: () => void;
}

export const createLinearSlice: StateCreator<LinearSlice, [], [], LinearSlice> = (set, get) => ({
  linearConnection: { status: 'idle' },
  linearTeams: [],
  linearProjects: [],
  linearLinkStatus: 'idle',
  sendToLinearStatus: 'idle',
  sendToLinearError: undefined,

  loadLinearStatus: async () => {
    set({ linearConnection: { status: 'loading' } });
    log.info('loadLinearStatus', 'Checking Linear connection');

    try {
      const result = await api.getLinearStatus();
      if (result.connected) {
        set({
          linearConnection: {
            status: 'connected',
            username: result.username,
            avatarUrl: result.avatarUrl,
          },
        });
        log.info('loadLinearStatus', 'Linear connected', { username: result.username });
      } else {
        set({ linearConnection: { status: 'disconnected' } });
        log.info('loadLinearStatus', 'Linear not connected');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ linearConnection: { status: 'error', error: message } });
      log.error('loadLinearStatus', 'Failed to check Linear status', { error: message });
    }
  },

  disconnectLinear: async () => {
    log.info('disconnectLinear', 'Disconnecting Linear');

    try {
      await api.disconnectLinear();
      set({
        linearConnection: { status: 'disconnected' },
        linearTeams: [],
        linearProjects: [],
      });
      log.info('disconnectLinear', 'Linear disconnected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('disconnectLinear', 'Failed to disconnect', { error: message });
    }
  },

  loadLinearTeams: async () => {
    log.info('loadLinearTeams', 'Fetching Linear teams');

    try {
      const teams = await api.getLinearTeams();
      set({ linearTeams: teams });
      log.info('loadLinearTeams', 'Teams loaded', { count: teams.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('loadLinearTeams', 'Failed to load teams', { error: message });
    }
  },

  loadLinearProjects: async (teamId: string) => {
    log.info('loadLinearProjects', 'Fetching Linear projects', { teamId });

    try {
      const projects = await api.getLinearProjects(teamId);
      set({ linearProjects: projects });
      log.info('loadLinearProjects', 'Projects loaded', { count: projects.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('loadLinearProjects', 'Failed to load projects', { error: message });
    }
  },

  linkLinearProject: async (projectId: string, linearProjectId: string, linearProjectName: string, linearTeamId: string) => {
    log.info('linkLinearProject', 'Linking Linear project', { projectId, linearProjectId });
    set({ linearLinkStatus: 'loading' });

    try {
      await api.updateProject(projectId, {
        linear_project_id: linearProjectId,
        linear_project_name: linearProjectName,
        linear_team_id: linearTeamId,
      } as Record<string, string>);
      set({ linearLinkStatus: 'idle' });
      log.info('linkLinearProject', 'Linear project linked');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ linearLinkStatus: 'error' });
      log.error('linkLinearProject', 'Failed to link project', { error: message });
      throw err;
    }
  },

  sendToLinear: async (requirementId: string) => {
    log.info('sendToLinear', 'Sending requirement to Linear', { requirementId });
    set({ sendToLinearStatus: 'sending', sendToLinearError: undefined });

    try {
      const updated = await api.sendToLinear(requirementId);

      set(state => {
        const entities = state as unknown as { requirements: Array<{ id: string }> };
        return {
          sendToLinearStatus: 'sent' as const,
          requirements: entities.requirements.map(r =>
            r.id === requirementId ? updated : r,
          ),
        } as Partial<LinearSlice>;
      });

      log.info('sendToLinear', 'Requirement sent to Linear', {
        requirementId,
        linearIdentifier: updated.linearIssueIdentifier,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ sendToLinearStatus: 'error', sendToLinearError: message });
      log.error('sendToLinear', 'Failed to send to Linear', { requirementId, error: message });
    }
  },

  autoCreateLinearIssue: async (requirementId: string) => {
    log.info('autoCreateLinearIssue', 'Auto-creating Linear issue', { requirementId });

    try {
      const updated = await api.sendToLinear(requirementId);

      set(state => {
        const entities = state as unknown as { requirements: Array<{ id: string }> };
        return {
          requirements: entities.requirements.map(r =>
            r.id === requirementId ? updated : r,
          ),
        } as Partial<LinearSlice>;
      });

      log.info('autoCreateLinearIssue', 'Linear issue auto-created', {
        requirementId,
        linearIdentifier: updated.linearIssueIdentifier,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.debug('autoCreateLinearIssue', 'Auto-create failed silently', { requirementId, error: message });
    }
  },

  autoSyncLinearIssue: async (requirementId: string) => {
    log.info('autoSyncLinearIssue', 'Syncing Linear issue with latest summary', { requirementId });

    try {
      await api.syncLinearIssue(requirementId);
      log.info('autoSyncLinearIssue', 'Linear issue synced', { requirementId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.debug('autoSyncLinearIssue', 'Sync failed silently', { requirementId, error: message });
    }
  },

  resetSendToLinearStatus: () => {
    set({ sendToLinearStatus: 'idle', sendToLinearError: undefined });
  },
});
