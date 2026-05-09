import { StateCreator } from 'zustand';
import { api } from '../../api';
import { logger } from '../../logger';

const log = logger.create('store:supabaseConnect');

export type SupabaseConnectionStatus = 'idle' | 'loading' | 'connected' | 'disconnected' | 'error';
export type DbFetchStatus = 'idle' | 'fetching' | 'ready' | 'error';

export interface SupabaseConnectionState {
  status: SupabaseConnectionStatus;
  orgName?: string;
  error?: string;
}

export interface SupabaseProject {
  id: string;
  name: string;
  organizationId: string;
  region: string;
}

export interface SupabaseConnectSlice {
  supabaseConnection: SupabaseConnectionState;
  supabaseProjects: SupabaseProject[];
  dbFetchStatus: DbFetchStatus;

  loadSupabaseConnectStatus: () => Promise<void>;
  loadSupabaseProjects: () => Promise<void>;
  disconnectSupabase: () => Promise<void>;
  linkSupabaseToProject: (projectId: string, supabaseProjectRef: string) => Promise<void>;
  fetchDbContext: (projectId: string) => Promise<void>;
}

export const createSupabaseConnectSlice: StateCreator<SupabaseConnectSlice, [], [], SupabaseConnectSlice> = (set) => ({
  supabaseConnection: { status: 'idle' },
  supabaseProjects: [],
  dbFetchStatus: 'idle',

  loadSupabaseConnectStatus: async () => {
    set({ supabaseConnection: { status: 'loading' } });
    log.info('loadStatus', 'Checking Supabase connection');

    try {
      const result = await api.getSupabaseConnectStatus();
      if (result.connected) {
        set({
          supabaseConnection: {
            status: 'connected',
            orgName: result.orgName,
          },
        });
        log.info('loadStatus', 'Supabase connected', { orgName: result.orgName });
      } else {
        set({ supabaseConnection: { status: 'disconnected' } });
        log.info('loadStatus', 'Supabase not connected');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ supabaseConnection: { status: 'error', error: message } });
      log.error('loadStatus', 'Failed to check Supabase status', { error: message });
    }
  },

  loadSupabaseProjects: async () => {
    log.info('loadProjects', 'Fetching Supabase project list');

    try {
      const projects = await api.getSupabaseProjects();
      set({ supabaseProjects: projects });
      log.info('loadProjects', 'Projects loaded', { count: projects.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('loadProjects', 'Failed to load projects', { error: message });
    }
  },

  disconnectSupabase: async () => {
    log.info('disconnect', 'Disconnecting Supabase');

    try {
      await api.disconnectSupabase();
      set({
        supabaseConnection: { status: 'disconnected' },
        supabaseProjects: [],
      });
      log.info('disconnect', 'Supabase disconnected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('disconnect', 'Failed to disconnect', { error: message });
    }
  },

  linkSupabaseToProject: async (projectId: string, supabaseProjectRef: string) => {
    log.info('linkToProject', 'Linking Supabase project', { projectId, supabaseProjectRef });

    try {
      await api.updateProject(projectId, {
        supabase_project_ref: supabaseProjectRef,
      } as Record<string, string>);
      log.info('linkToProject', 'Supabase project linked successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('linkToProject', 'Failed to link Supabase project', { error: message });
      throw err;
    }
  },

  fetchDbContext: async (projectId: string) => {
    set({ dbFetchStatus: 'fetching' });
    log.info('fetchDbContext', 'Starting DB context fetch', { projectId });

    try {
      await api.fetchDbContext(projectId);
      set({ dbFetchStatus: 'ready' });
      log.info('fetchDbContext', 'DB context fetched successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ dbFetchStatus: 'error' });
      log.error('fetchDbContext', 'Fetch failed', { error: message });
    }
  },
});
