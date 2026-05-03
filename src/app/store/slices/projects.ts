import { StateCreator } from 'zustand';
import { Project } from '../../types';
import { DEFAULT_PROJECTS } from '../../constants';
import { logger } from '../../logger';

const log = logger.create('store:projects');

export interface ProjectsSlice {
  projects: Project[];
  createProject: (name: string, parentId?: string) => void;
}

export const createProjectsSlice: StateCreator<ProjectsSlice, [], [], ProjectsSlice> = (set, get) => ({
  projects: DEFAULT_PROJECTS,

  createProject: (name: string, parentId?: string) => {
    const newProject: Project = { id: `p${Date.now()}`, name, subProjects: [] };
    log.info('createProject', 'Creating project', { name, parentId });

    if (parentId) {
      const addSubProject = (projs: Project[]): Project[] => {
        return projs.map(p => {
          if (p.id === parentId) {
            return { ...p, subProjects: [...(p.subProjects || []), newProject] };
          }
          if (p.subProjects) {
            return { ...p, subProjects: addSubProject(p.subProjects) };
          }
          return p;
        });
      };
      set({ projects: addSubProject(get().projects) });
    } else {
      set(state => ({ projects: [...state.projects, newProject] }));
    }
  },
});
