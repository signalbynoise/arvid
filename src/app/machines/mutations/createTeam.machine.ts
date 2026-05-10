import { setup, assign, fromPromise } from 'xstate';
import type { Team } from '../../types';
import { logger } from '../../logger';

const log = logger.create('machines:createTeam');

interface Context {
  name: string;
  workspaceId: string;
  error: string | null;
  created: Team | null;
}

type Events =
  | { type: 'SUBMIT'; name: string; workspaceId: string }
  | { type: 'RESET' };

export interface CreateTeamActions {
  createTeam: (name: string, workspaceId: string) => Promise<Team | undefined>;
  onClose: () => void;
}

export function createCreateTeamMachine(actions: CreateTeamActions) {
  const submitLogic = fromPromise(async ({ input }: { input: { name: string; workspaceId: string } }) => {
    const result = await actions.createTeam(input.name, input.workspaceId);
    if (!result) throw new Error('Failed to create team. The name may already be taken.');
    return result;
  });

  return setup({
    types: {
      context: {} as Context,
      events: {} as Events,
    },
    actors: { submitLogic },
  }).createMachine({
    id: 'createTeam',
    initial: 'idle',
    context: {
      name: '',
      workspaceId: '',
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
              error: null,
            })),
          },
        },
      },

      submitting: {
        invoke: {
          src: 'submitLogic',
          input: ({ context }) => ({ name: context.name, workspaceId: context.workspaceId }),
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
        entry: ({ context }) => log.info('submit', 'Creating team', { name: context.name }),
      },

      success: {
        entry: ({ context }) => {
          log.info('success', 'Team created', { id: context.created?.id });
          actions.onClose();
        },
        type: 'final',
      },

      failure: {
        entry: ({ context }) => log.error('failure', 'Failed to create team', { error: context.error }),
        on: {
          SUBMIT: {
            target: 'submitting',
            guard: ({ event }) => event.name.trim().length > 0,
            actions: assign(({ event }) => ({
              name: event.name.trim(),
              workspaceId: event.workspaceId,
              error: null,
            })),
          },
          RESET: { target: 'idle', actions: assign({ name: '', error: null, created: null, workspaceId: '' }) },
        },
      },
    },
  });
}
