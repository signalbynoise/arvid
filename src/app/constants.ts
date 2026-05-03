import { Project } from './types';

export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Platform Migration',
    subProjects: [
      { id: 'p1-1', name: 'Auth V2' },
      { id: 'p1-2', name: 'Billing Engine' },
    ],
  },
  {
    id: 'p2',
    name: 'Enterprise Features',
    subProjects: [],
  },
  {
    id: 'p3',
    name: 'SOC2 Compliance',
    subProjects: [
      { id: 'p3-1', name: 'Access Reviews' },
    ],
  },
];
