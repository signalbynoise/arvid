import { setup, assign, fromPromise } from 'xstate';
import type { Workspace } from '../../types';
import { logger } from '../../logger';

const log = logger.create('machines:createWorkspace');

interface Context {
  name: string;
  error: string | null;
  created: Workspace | null;
}

type Events =
  | { type: 'SUBMIT'; name: string }
  | { type: 'RESET' };

export interface CreateWorkspaceActions {
  createWorkspace: (name: string) => Promise<Workspace | undefined>;
  navigate: (path: string) => void;
  buildWorkspacePath: (slug: string) => string;
  onClose: () => void;
}

export function createCreateWorkspaceMachine(actions: CreateWorkspaceActions) {
  const submitLogic = fromPromise(async ({ input }: { input: { name: string } }) => {
    const result = await actions.createWorkspace(input.name);
    if (!result) throw new Error('Failed to create workspace. The name may already be taken.');
    return result;
  });

  return setup({
    types: {
      context: {} as Context,
      events: {} as Events,
    },
    actors: { submitLogic },
  }).createMachine({
    id: 'createWorkspace',
    initial: 'idle',
    context: {
      name: '',
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
              error: null,
            })),
          },
        },
      },

      submitting: {
        invoke: {
          src: 'submitLogic',
          input: ({ context }) => ({ name: context.name }),
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
        entry: () => log.info('submit', 'Creating workspace'),
      },

      success: {
        entry: ({ context }) => {
          log.info('success', 'Workspace created', { id: context.created?.id });
          if (context.created) {
            const path = actions.buildWorkspacePath(context.created.slug);
            actions.navigate(path);
          }
          actions.onClose();
        },
        type: 'final',
      },

      failure: {
        entry: ({ context }) => log.error('failure', 'Failed to create workspace', { error: context.error }),
        on: {
          SUBMIT: {
            target: 'submitting',
            guard: ({ event }) => event.name.trim().length > 0,
            actions: assign(({ event }) => ({
              name: event.name.trim(),
              error: null,
            })),
          },
          RESET: { target: 'idle', actions: assign({ name: '', error: null, created: null }) },
        },
      },
    },
  });
}
