import { setup, assign, fromCallback } from 'xstate';
import type { Workspace, Team, Project } from '../types';
import { logger } from '../logger';

const log = logger.create('navigation');

export interface ResolverContext {
  wsShortId: string | undefined;
  projectShortId: string | undefined;
  reqShortId: string | undefined;
  questionShortId: string | undefined;
  workspaces: Workspace[];
  projects: Project[];
  teams: Team[];
}

export type ResolverEvent =
  | { type: 'URL_CHANGED'; wsShortId?: string; projectShortId?: string; reqShortId?: string; questionShortId?: string }
  | { type: 'WORKSPACES_READY'; workspaces: Workspace[] }
  | { type: 'DATA_LOADED'; workspaceId: string; projects: Project[]; teams: Team[] }
  | { type: 'ENTITIES_LOADED' };

export interface ResolverActions {
  navigate: (path: string) => void;
  setActiveWorkspace: (id: string) => void;
  loadProjects: (workspaceId: string) => void;
  loadTeams: (workspaceId: string) => void;
  setSelectedProjectId: (id: string) => void;
  selectRequirement: (id: string | null) => void;
  selectQuestion: (id: string | null) => void;
  buildProjectPath: (workspace: Workspace, teams: Team[], project: Project) => string | null;
}

function findWorkspace(workspaces: Workspace[], shortId: string | undefined): Workspace | undefined {
  if (!shortId) return undefined;
  return workspaces.find(w => w.slug === shortId || w.shortId === shortId);
}

export function createRouterResolverMachine(actions: ResolverActions) {
  return setup({
    types: {
      context: {} as ResolverContext,
      events: {} as ResolverEvent,
    },
    guards: {
      workspacesAvailable: ({ context }) => context.workspaces.length > 0,
      workspaceFound: ({ context }) => !!findWorkspace(context.workspaces, context.wsShortId),
      dataMatchesWorkspace: ({ context, event }) => {
        if (event.type !== 'DATA_LOADED') return false;
        const ws = findWorkspace(context.workspaces, context.wsShortId);
        return !!ws && event.workspaceId === ws.id;
      },
      projectFoundInUrl: ({ context }) =>
        !!context.projectShortId && !!context.projects.find(p => p.shortId === context.projectShortId),
      hasProjects: ({ context }) => context.projects.length > 0,
    },
  }).createMachine({
    id: 'routerResolver',
    initial: 'idle',
    context: {
      wsShortId: undefined,
      projectShortId: undefined,
      reqShortId: undefined,
      questionShortId: undefined,
      workspaces: [],
      projects: [],
      teams: [],
    },
    on: {
      URL_CHANGED: {
        target: '.resolvingWorkspace',
        actions: assign(({ context, event }) => {
          const workspaceChanged = event.wsShortId !== context.wsShortId;
          return {
            wsShortId: event.wsShortId,
            projectShortId: event.projectShortId,
            reqShortId: event.reqShortId,
            questionShortId: event.questionShortId,
            ...(workspaceChanged ? { projects: [], teams: [] } : {}),
          };
        }),
      },
      WORKSPACES_READY: {
        target: '.resolvingWorkspace',
        actions: assign(({ event }) => ({
          workspaces: event.workspaces,
        })),
      },
    },
    states: {
      idle: {},

      resolvingWorkspace: {
        always: [
          {
            guard: ({ context }) => {
              if (context.workspaces.length === 0) return false;
              const ws = findWorkspace(context.workspaces, context.wsShortId);
              if (!ws) return false;
              return context.projects.length > 0 && context.projects[0]?.workspaceId === ws.id;
            },
            target: 'resolvingProject',
          },
          {
            guard: ({ context }) => context.workspaces.length > 0 && !!findWorkspace(context.workspaces, context.wsShortId),
            target: 'loadingData',
          },
          {
            guard: ({ context }) => context.workspaces.length > 0 && !findWorkspace(context.workspaces, context.wsShortId),
            target: 'redirecting',
            actions: () => {
              log.warn('sync', 'Workspace not found, redirecting to root');
              actions.navigate('/');
            },
          },
        ],
      },

      loadingData: {
        entry: ({ context }) => {
          const ws = findWorkspace(context.workspaces, context.wsShortId);
          if (!ws) return;
          log.debug('sync', 'Loading workspace data', { workspaceId: ws.id });
          actions.setActiveWorkspace(ws.id);
          actions.loadProjects(ws.id);
          actions.loadTeams(ws.id);
        },
        on: {
          DATA_LOADED: {
            guard: 'dataMatchesWorkspace',
            target: 'resolvingProject',
            actions: assign(({ event }) => ({
              projects: event.projects,
              teams: event.teams,
            })),
          },
        },
      },

      resolvingProject: {
        always: [
          {
            guard: 'projectFoundInUrl',
            target: 'ready',
            actions: ({ context }) => {
              const project = context.projects.find(p => p.shortId === context.projectShortId);
              if (project) {
                log.debug('sync', 'Project resolved from URL', { projectId: project.id });
                actions.setSelectedProjectId(project.id);
              }
            },
          },
          {
            guard: 'hasProjects',
            target: 'redirecting',
            actions: ({ context }) => {
              const ws = findWorkspace(context.workspaces, context.wsShortId);
              if (!ws) return;
              const first = context.projects.find(p => !p.parentId);
              if (!first) return;
              const path = actions.buildProjectPath(ws, context.teams, first);
              if (path) {
                log.debug('sync', 'Auto-selecting first project', { path });
                actions.navigate(path);
              }
            },
          },
          { target: 'ready' },
        ],
      },

      redirecting: {},

      ready: {
        entry: ({ context }) => {
          if (!context.reqShortId) {
            actions.selectRequirement(null);
          }
          if (!context.questionShortId) {
            actions.selectQuestion(null);
          }
        },
      },
    },
  });
}
