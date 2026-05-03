import { StateCreator } from 'zustand';
import { Project } from '../../types';
import { api } from '../../api';
import { logger } from '../../logger';
import { SelectionSlice } from './selection';

const log = logger.create('store:projects');

export type ProjectsDataStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ProjectsDataState {
  status: ProjectsDataStatus;
  error?: string;
}

export interface ProjectsSlice {
  projects: Project[];
  projectsDataState: ProjectsDataState;

  loadProjects: () => Promise<void>;
  createProject: (name: string, parentId?: string) => Promise<void>;
  updateProject: (id: string, name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

type CombinedState = ProjectsSlice & SelectionSlice;

export const createProjectsSlice: StateCreator<CombinedState, [], [], ProjectsSlice> = (set, get) => ({
  projects: [],
  projectsDataState: { status: 'idle' },

  loadProjects: async () => {
    set({ projectsDataState: { status: 'loading' } });
    log.info('loadProjects', 'Fetching projects');

    try {
      const projects = await api.getProjects();
      set({ projects, projectsDataState: { status: 'ready' } });
      log.info('loadProjects', 'Projects loaded', { count: projects.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ projectsDataState: { status: 'error', error: message } });
      log.error('loadProjects', 'Failed to load projects', { error: message });
    }
  },

  createProject: async (name: string, parentId?: string) => {
    log.info('createProject', 'Creating project', { name, parentId });

    try {
      const created = await api.createProject(name, parentId);
      set(state => ({ projects: [...state.projects, created] }));
      log.info('createProject', 'Project created', { id: created.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('createProject', 'Failed to create project', { error: message });
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
