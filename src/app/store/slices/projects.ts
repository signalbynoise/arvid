import { StateCreator } from 'zustand';
import { toast } from 'sonner';
import { Project } from '../../types';
import { api, ApiError } from '../../api';
import { logger } from '../../logger';
import { SelectionSlice } from './selection';
import type { WorkspacesSlice } from './workspaces';

const log = logger.create('store:projects');

const AUTO_CREATE_ROLES = new Set(['owner', 'admin']);

export type ProjectsDataStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ProjectsDataState {
  status: ProjectsDataStatus;
  error?: string;
}

export interface ProjectsSlice {
  projects: Project[];
  projectsDataState: ProjectsDataState;

  loadProjects: (workspaceId?: string) => Promise<void>;
  createProject: (name: string, parentId?: string, workspaceId?: string, teamId?: string) => Promise<Project | undefined>;
  updateProject: (id: string, name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

type CombinedState = ProjectsSlice & SelectionSlice & Pick<WorkspacesSlice, 'workspaces'>;

export const createProjectsSlice: StateCreator<CombinedState, [], [], ProjectsSlice> = (set, get) => ({
  projects: [],
  projectsDataState: { status: 'idle' },

  loadProjects: async (workspaceId?: string) => {
    set({
      projectsDataState: { status: 'loading' },
    });
    log.info('loadProjects', 'Fetching projects', { workspaceId });

    try {
      let projects = await api.getProjects(workspaceId);

      if (projects.length === 0 && workspaceId) {
        const ws = get().workspaces.find(w => w.id === workspaceId);
        const role = ws?.userRole ?? 'guest';

        if (AUTO_CREATE_ROLES.has(role)) {
          log.info('loadProjects', 'No projects found, creating default project', { role });
          const teams = await api.getTeams(workspaceId);
          const teamId = teams[0]?.id;
          const created = await api.createProject('My Project', undefined, workspaceId, teamId);
          projects = [created];
        } else {
          log.debug('loadProjects', 'No projects visible for this user, skipping auto-create', { role });
        }
      }

      set({ projects, projectsDataState: { status: 'ready' } });
      log.info('loadProjects', 'Projects loaded', { count: projects.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ projectsDataState: { status: 'error', error: message } });
      log.error('loadProjects', 'Failed to load projects', { error: message });
    }
  },

  createProject: async (name: string, parentId?: string, workspaceId?: string, teamId?: string) => {
    log.info('createProject', 'Creating project', { name, parentId, workspaceId, teamId });

    try {
      const created = await api.createProject(name, parentId, workspaceId, teamId);
      set(state => ({ projects: [...state.projects, created] }));
      log.info('createProject', 'Project created', { id: created.id });
      return created;
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error('Project limit reached', {
          description: 'Upgrade to Arvid Plus for unlimited projects.',
          action: { label: 'Upgrade', onClick: () => window.dispatchEvent(new CustomEvent('arvid:open-account-settings')) },
        });
        log.info('createProject', 'Plan limit reached');
        return undefined;
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('createProject', 'Failed to create project', { error: message });
      return undefined;
    }
  },

  updateProject: async (id: string, name: string) => {
    log.info('updateProject', 'Updating project', { id, name });

    const previous = get().projects;
    set(state => ({
      projects: state.projects.map(p => p.id === id ? { ...p, name } : p),
    }));

    try {
      await api.updateProject(id, { name });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('updateProject', 'Failed to update project, rolling back', { error: message });
      set({ projects: previous });
      throw err;
    }
  },

  deleteProject: async (id: string) => {
    log.info('deleteProject', 'Deleting project', { id });

    const { projects: previous, selectedProjectId } = get();
    const remaining = previous.filter(p => p.id !== id && p.parentId !== id);

    const updates: Partial<CombinedState> = { projects: remaining };

    if (selectedProjectId === id) {
      const nextRoot = remaining.find(p => !p.parentId);
      updates.selectedProjectId = nextRoot?.id ?? null;
      updates.selectedReqId = null;
      updates.selectedQuestionId = null;
      log.debug('deleteProject', 'Reselecting after deletion', { nextProjectId: updates.selectedProjectId });
    }

    set(updates);

    try {
      await api.deleteProject(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('deleteProject', 'Failed to delete project, rolling back', { error: message });
      set({ projects: previous, selectedProjectId });
    }
  },
});
