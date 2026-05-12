import { StateCreator } from 'zustand';
import { api } from '../../api';
import { logger } from '../../logger';

const log = logger.create('store:figma');

export type FigmaConnectionStatus = 'idle' | 'loading' | 'connected' | 'disconnected' | 'error';

export interface FigmaConnectionState {
  status: FigmaConnectionStatus;
  username?: string;
  email?: string;
  error?: string;
}

export interface ResolvedFigmaDesign {
  url: string;
  fileKey: string;
  nodeId: string | null;
  nodeName: string;
  thumbnailUrl: string | null;
  structuralSummary: string;
}

export interface FigmaSlice {
  figmaConnection: FigmaConnectionState;
  resolvedDesigns: ResolvedFigmaDesign[];

  loadFigmaStatus: () => Promise<void>;
  disconnectFigma: () => Promise<void>;
  resolveFigmaDesigns: (urls: string[]) => Promise<ResolvedFigmaDesign[]>;
}

export const createFigmaSlice: StateCreator<FigmaSlice, [], [], FigmaSlice> = (set) => ({
  figmaConnection: { status: 'idle' },
  resolvedDesigns: [],

  loadFigmaStatus: async () => {
    set({ figmaConnection: { status: 'loading' } });
    log.info('loadFigmaStatus', 'Checking Figma connection');

    try {
      const result = await api.getFigmaStatus();
      if (result.connected) {
        set({
          figmaConnection: {
            status: 'connected',
            username: result.username,
            email: result.email,
          },
        });
        log.info('loadFigmaStatus', 'Figma connected', { username: result.username });
      } else {
        set({ figmaConnection: { status: 'disconnected' } });
        log.info('loadFigmaStatus', 'Figma not connected');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ figmaConnection: { status: 'error', error: message } });
      log.error('loadFigmaStatus', 'Failed to check Figma connection', { error: message });
    }
  },

  disconnectFigma: async () => {
    log.info('disconnectFigma', 'Disconnecting Figma');

    try {
      await api.disconnectFigma();
      set({
        figmaConnection: { status: 'disconnected' },
        resolvedDesigns: [],
      });
      log.info('disconnectFigma', 'Figma disconnected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('disconnectFigma', 'Failed to disconnect', { error: message });
    }
  },

  resolveFigmaDesigns: async (urls: string[]) => {
    log.info('resolveFigmaDesigns', 'Resolving Figma designs', { urlCount: urls.length });

    try {
      const result = await api.resolveFigmaDesigns(urls);
      set({ resolvedDesigns: result.designs });
      log.info('resolveFigmaDesigns', 'Designs resolved', { count: result.designs.length });
      return result.designs;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('resolveFigmaDesigns', 'Failed to resolve designs', { error: message });
      return [];
    }
  },
});
