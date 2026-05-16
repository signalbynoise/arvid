import { StateCreator } from 'zustand';
import { api } from '../../api';
import { logger } from '../../logger';

const log = logger.create('store:render');

export type RenderConnectionStatus = 'idle' | 'loading' | 'connected' | 'disconnected' | 'error';

export interface RenderConnectionState {
  status: RenderConnectionStatus;
  ownerName?: string;
  error?: string;
}

export interface RenderServiceItem {
  id: string;
  name: string;
  type: string;
  url: string | null;
  branch: string | null;
  repo: string | null;
  suspended: string | null;
}

export interface ProjectRenderService {
  id: string;
  name: string;
  type: string;
  url: string | null;
  deployStatus: string;
  commitSha: string | null;
  deployedAt: string | null;
}

export type ProjectServicesStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface RenderSlice {
  renderConnection: RenderConnectionState;
  renderServices: RenderServiceItem[];
  projectRenderServices: ProjectRenderService[];
  projectServicesStatus: ProjectServicesStatus;
  projectServicesMatched: boolean;

  loadRenderStatus: () => Promise<void>;
  connectRender: (apiKey: string, ownerId: string, ownerName: string) => Promise<boolean>;
  disconnectRender: () => Promise<void>;
  loadRenderServices: () => Promise<void>;
  loadProjectServices: (projectId: string) => Promise<void>;
}

export const createRenderSlice: StateCreator<RenderSlice, [], [], RenderSlice> = (set) => ({
  renderConnection: { status: 'idle' },
  renderServices: [],
  projectRenderServices: [],
  projectServicesStatus: 'idle',
  projectServicesMatched: false,

  loadRenderStatus: async () => {
    set({ renderConnection: { status: 'loading' } });
    log.info('loadStatus', 'Checking Render connection');

    try {
      const result = await api.getRenderStatus();
      if (result.connected) {
        set({
          renderConnection: {
            status: 'connected',
            ownerName: result.ownerName,
          },
        });
        log.info('loadStatus', 'Render connected', { ownerName: result.ownerName });
      } else {
        set({ renderConnection: { status: 'disconnected' } });
        log.info('loadStatus', 'Render not connected');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ renderConnection: { status: 'error', error: message } });
      log.error('loadStatus', 'Failed to check Render status', { error: message });
    }
  },

  connectRender: async (apiKey: string, ownerId: string, ownerName: string) => {
    set({ renderConnection: { status: 'loading' } });
    log.info('connect', 'Connecting Render', { ownerId, ownerName });

    try {
      const result = await api.connectRender(apiKey, ownerId, ownerName);
      if (result.connected) {
        set({
          renderConnection: {
            status: 'connected',
            ownerName: result.ownerName,
          },
        });
        log.info('connect', 'Render connected', { ownerName: result.ownerName });
        return true;
      }
      set({ renderConnection: { status: 'error', error: 'Connection failed' } });
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ renderConnection: { status: 'error', error: message } });
      log.error('connect', 'Failed to connect Render', { error: message });
      return false;
    }
  },

  disconnectRender: async () => {
    log.info('disconnect', 'Disconnecting Render');

    try {
      await api.disconnectRender();
      set({
        renderConnection: { status: 'disconnected' },
        renderServices: [],
        projectRenderServices: [],
        projectServicesStatus: 'idle',
        projectServicesMatched: false,
      });
      log.info('disconnect', 'Render disconnected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('disconnect', 'Failed to disconnect', { error: message });
    }
  },

  loadRenderServices: async () => {
    log.info('loadServices', 'Fetching Render service list');

    try {
      const services = await api.getRenderServices();
      set({ renderServices: services });
      log.info('loadServices', 'Services loaded', { count: services.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('loadServices', 'Failed to load services', { error: message });
    }
  },

  loadProjectServices: async (projectId: string) => {
    set({ projectServicesStatus: 'loading' });
    log.info('loadProjectServices', 'Fetching auto-matched services', { projectId });

    try {
      const result = await api.getProjectRenderServices(projectId);
      set({
        projectRenderServices: result.services,
        projectServicesStatus: 'loaded',
        projectServicesMatched: result.matched,
      });
      log.info('loadProjectServices', 'Project services loaded', {
        projectId,
        count: result.services.length,
        matched: result.matched,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ projectServicesStatus: 'error', projectRenderServices: [], projectServicesMatched: false });
      log.error('loadProjectServices', 'Failed to load project services', { error: message });
    }
  },
});
