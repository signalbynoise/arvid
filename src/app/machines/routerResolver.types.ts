import type { Workspace, Team, Project, WorkspaceRole } from '../types';

export interface RouterResolverContext {
  wsShortId: string | undefined;
  teamShortId: string | undefined;
  projectShortId: string | undefined;
  reqShortId: string | undefined;
  questionShortId: string | undefined;
  resolvedWorkspaceId: string | null;
  resolvedProjectId: string | null;
}

export type RouterResolverEvent =
  | { type: 'URL_CHANGED'; wsShortId?: string; teamShortId?: string; projectShortId?: string; reqShortId?: string; questionShortId?: string }
  | { type: 'DATA_LOADED'; workspaceId: string; projects: Project[]; teams: Team[] }
  | { type: 'ENTITIES_LOADED' }
  | { type: 'WORKSPACES_READY'; workspaces: Workspace[] };

export interface RouterResolverInput {
  navigate: (path: string) => void;
  setActiveWorkspace: (id: string) => void;
  loadProjects: (workspaceId: string) => void;
  loadTeams: (workspaceId: string) => void;
  setSelectedProjectId: (id: string) => void;
  selectRequirement: (id: string | null) => void;
  selectQuestion: (id: string | null) => void;
  getWorkspaces: () => Workspace[];
  getProjects: () => Project[];
  getTeams: () => Team[];
  buildProjectPath: (workspace: Workspace, teams: Team[], project: Project) => string | null;
}
