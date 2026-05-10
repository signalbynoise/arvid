import { setup, assign, fromPromise } from 'xstate';
import { logger } from '../../logger';

const log = logger.create('machines:createEntity');

export type CreateEntityType = 'requirement' | 'question' | 'answer';

interface Context {
  entityType: CreateEntityType;
  error: string | null;
}

type Events =
  | { type: 'SUBMIT'; payload: Record<string, unknown> }
  | { type: 'RESET' };

export interface CreateEntityActions {
  create: (payload: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}

export function createCreateEntityMachine(actions: CreateEntityActions) {
  const submitLogic = fromPromise(async ({ input }: { input: { payload: Record<string, unknown> } }) => {
    await actions.create(input.payload);
  });

  return setup({
    types: {
      context: {} as Context,
      events: {} as Events,
    },
    actors: { submitLogic },
  }).createMachine({
    id: 'createEntity',
    initial: 'idle',
    context: { entityType: 'question', error: null },
    states: {
      idle: {
        on: {
          SUBMIT: { target: 'submitting' },
        },
      },

      submitting: {
        invoke: {
          src: 'submitLogic',
          input: ({ event }) => ({ payload: (event as Extract<Events, { type: 'SUBMIT' }>).payload }),
          onDone: { target: 'success' },
          onError: {
            target: 'failure',
            actions: assign(({ event }) => ({ error: (event.error as Error).message })),
          },
        },
        entry: ({ context }) => log.info('submit', `Creating ${context.entityType}`),
      },

      success: {
        entry: ({ context }) => {
          log.info('success', `${context.entityType} created`);
          actions.onClose();
        },
        type: 'final',
      },

      failure: {
        entry: ({ context }) => log.error('failure', `Failed to create ${context.entityType}`, { error: context.error }),
        on: {
          SUBMIT: { target: 'submitting', actions: assign({ error: null }) },
          RESET: { target: 'idle', actions: assign({ error: null }) },
        },
      },
    },
  });
}
