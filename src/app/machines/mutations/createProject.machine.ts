import { setup, assign, fromPromise } from 'xstate';
import type { Workspace, Team, Project } from '../../types';
import { logger } from '../../logger';

const log = logger.create('machines:createProject');

interface Context {
  name: string;
  workspaceId: string;
  teamId: string;
  parentId: string | undefined;
  error: string | null;
  created: Project | null;
}

type Events =
  | { type: 'SUBMIT'; name: string; workspaceId: string; teamId: string; parentId?: string }
  | { type: 'RESET' };

export interface CreateProjectActions {
  createProject: (name: string, parentId?: string, workspaceId?: string, teamId?: string) => Promise<Project | undefined>;
  navigate: (path: string) => void;
  getState: () => { workspaces: Workspace[]; teams: Team[]; activeWorkspaceId: string | null };
  buildProjectPath: (workspace: Workspace, teams: Team[], project: Project) => string | null;
  onClose: () => void;
}

export function createCreateProjectMachine(actions: CreateProjectActions) {
  const submitLogic = fromPromise(async ({ input }: { input: { name: string; parentId?: string; workspaceId: string; teamId: string } }) => {
    const result = await actions.createProject(input.name, input.parentId, input.workspaceId, input.teamId);
    if (!result) throw new Error('Failed to create project. The name may already be taken.');
    return result;
  });

  return setup({
    types: {
      context: {} as Context,
      events: {} as Events,
    },
    actors: { submitLogic },
  }).createMachine({
    id: 'createProject',
    initial: 'idle',
    context: {
      name: '',
      workspaceId: '',
      teamId: '',
      parentId: undefined,
      error: null,
      created: null,
    },
    states: {
      idle: {
        on: {
          SUBMIT: {
            target: 'submitting',
            guard: ({ event }) => event.name.trim().length > 0,
            actions: assign(({ event }) => ({
              name: event.name.trim(),
              workspaceId: event.workspaceId,
              teamId: event.teamId,
              parentId: event.parentId,
              error: null,
            })),
          },
        },
      },

      submitting: {
        invoke: {
          src: 'submitLogic',
          input: ({ context }) => ({
            name: context.name,
            parentId: context.parentId,
            workspaceId: context.workspaceId,
            teamId: context.teamId,
          }),
          onDone: {
            target: 'success',
            actions: assign(({ event }) => ({
              created: event.output,
            })),
          },
          onError: {
            target: 'failure',
            actions: assign(({ event }) => ({
              error: (event.error as Error).message,
            })),
          },
        },
        entry: ({ context }) => log.info('submit', 'Creating project', { name: context.name }),
      },

      success: {
        entry: ({ context }) => {
          log.info('success', 'Project created', { id: context.created?.id });
          if (context.created) {
            const state = actions.getState();
            const ws = state.workspaces.find(w => w.id === state.activeWorkspaceId);
            log.debug('success', 'Building navigation path', {
              hasWorkspace: !!ws,
              teamsCount: state.teams.length,
              projectTeamId: context.created.teamId,
              projectShortId: context.created.shortId,
            });
            if (ws) {
              const path = actions.buildProjectPath(ws, state.teams, context.created);
              if (path) {
                log.info('success', 'Navigating to new project', { path });
                actions.navigate(path);
              } else {
                log.error('success', 'Failed to build project path — team not found in store', {
                  teamId: context.created.teamId,
                  availableTeamIds: state.teams.map(t => t.id),
                });
              }
            }
          }
          actions.onClose();
        },
        type: 'final',
      },

      failure: {
        entry: ({ context }) => log.error('failure', 'Failed to create project', { error: context.error }),
        on: {
          SUBMIT: {
            target: 'submitting',
            guard: ({ event }) => event.name.trim().length > 0,
            actions: assign(({ event }) => ({
              name: event.name.trim(),
              workspaceId: event.workspaceId,
              teamId: event.teamId,
              parentId: event.parentId,
              error: null,
            })),
          },
          RESET: { target: 'idle', actions: assign({ name: '', error: null, created: null, workspaceId: '', teamId: '', parentId: undefined }) },
        },
      },
    },
  });
}
