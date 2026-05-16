import { StateCreator } from 'zustand';
import { api } from '../../api';
import { logger } from '../../logger';

const log = logger.create('store:github');

export type GitHubConnectionStatus = 'idle' | 'loading' | 'connected' | 'disconnected' | 'error';
export type RepoFetchStatus = 'idle' | 'fetching' | 'ready' | 'error';

export interface GitHubConnectionState {
  status: GitHubConnectionStatus;
  username?: string;
  avatarUrl?: string;
  error?: string;
}

export interface GitHubRepo {
  id: number;
  fullName: string;
  isPrivate: boolean;
  defaultBranch: string;
  language: string | null;
  description: string | null;
}

export interface GitHubSlice {
  githubConnection: GitHubConnectionState;
  githubRepos: GitHubRepo[];
  repoFetchStatus: RepoFetchStatus;

  loadGitHubStatus: () => Promise<void>;
  loadGitHubRepos: () => Promise<void>;
  disconnectGitHub: () => Promise<void>;
  linkRepoToProject: (projectId: string, repoFullName: string, defaultBranch: string) => Promise<void>;
  fetchRepoContext: (projectId: string) => Promise<void>;
}

export const createGitHubSlice: StateCreator<GitHubSlice, [], [], GitHubSlice> = (set) => ({
  githubConnection: { status: 'idle' },
  githubRepos: [],
  repoFetchStatus: 'idle',

  loadGitHubStatus: async () => {
    set({ githubConnection: { status: 'loading' } });
    log.info('loadGitHubStatus', 'Checking GitHub connection');

    try {
      const result = await api.getGitHubStatus();
      if (result.connected) {
        set({
          githubConnection: {
            status: 'connected',
            username: result.username,
            avatarUrl: result.avatarUrl,
          },
        });
        log.info('loadGitHubStatus', 'GitHub connected', { username: result.username });
      } else {
        set({ githubConnection: { status: 'disconnected' } });
        log.info('loadGitHubStatus', 'GitHub not connected');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ githubConnection: { status: 'error', error: message } });
      log.error('loadGitHubStatus', 'Failed to check GitHub status', { error: message });
    }
  },

  loadGitHubRepos: async () => {
    log.info('loadGitHubRepos', 'Fetching repository list');

    try {
      const repos = await api.getGitHubRepos();
      const mapped: GitHubRepo[] = repos.map(r => ({
        id: r.id,
        fullName: r.full_name,
        isPrivate: r.private,
        defaultBranch: r.default_branch,
        language: r.language,
        description: r.description,
      }));
      set({ githubRepos: mapped });
      log.info('loadGitHubRepos', 'Repos loaded', { count: mapped.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('loadGitHubRepos', 'Failed to load repos', { error: message });
    }
  },

  disconnectGitHub: async () => {
    log.info('disconnectGitHub', 'Disconnecting GitHub');

    try {
      await api.disconnectGitHub();
      set({
        githubConnection: { status: 'disconnected' },
        githubRepos: [],
      });
      log.info('disconnectGitHub', 'GitHub disconnected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('disconnectGitHub', 'Failed to disconnect', { error: message });
    }
  },

  linkRepoToProject: async (projectId: string, repoFullName: string, defaultBranch: string) => {
    log.info('linkRepoToProject', 'Linking repo to project', { projectId, repoFullName });

    try {
      const updated = await api.updateProject(projectId, {
        github_repo_full_name: repoFullName,
        github_repo_default_branch: defaultBranch,
      });

      set(state => {
        const appState = state as unknown as {
          projects: Array<{ id: string }>;
          summary: unknown;
          summaryDataState: { status: string };
          similarities: Record<string, unknown>;
          requirements: Array<{ id: string; implStatus?: string }>;
        };
        return {
          repoFetchStatus: 'idle',
          projects: appState.projects.map(p =>
            p.id === projectId ? { ...p, ...updated } : p,
          ),
          summary: null,
          summaryDataState: { status: 'idle' },
          similarities: {},
          requirements: appState.requirements.map(r => ({
            ...r,
            implStatus: r.implStatus && r.implStatus !== 'Not Checked' ? 'Not Checked' : r.implStatus,
            implConfidence: undefined,
            implCheckedAt: undefined,
            implEvidence: undefined,
            implAnalysis: undefined,
          })),
        } as Partial<GitHubSlice>;
      });
      log.info('linkRepoToProject', 'Repo linked, stale context cleared');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('linkRepoToProject', 'Failed to link repo', { error: message });
      throw err;
    }
  },

  fetchRepoContext: async (projectId: string) => {
    set({ repoFetchStatus: 'fetching' });
    log.info('fetchRepoContext', 'Starting repo context fetch', { projectId });

    try {
      await api.fetchRepoContext(projectId);
      set({ repoFetchStatus: 'ready' });
      log.info('fetchRepoContext', 'Repo context fetched successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ repoFetchStatus: 'error' });
      log.error('fetchRepoContext', 'Fetch failed', { error: message });
    }
  },
});
