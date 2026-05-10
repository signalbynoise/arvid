import { setup, assign, fromPromise } from 'xstate';
import { logger } from '../../logger';

const log = logger.create('machines:deleteEntity');

export type DeleteEntityType = 'workspace' | 'team' | 'project';

interface Context {
  entityType: DeleteEntityType;
  entityId: string;
  entityName: string;
  error: string | null;
}

type Events =
  | { type: 'CONFIRM' }
  | { type: 'RESET' };

export interface DeleteEntityActions {
  deleteEntity: () => Promise<void>;
  onClose: () => void;
  onSuccess?: () => void;
}

export function createDeleteEntityMachine(actions: DeleteEntityActions) {
  const submitLogic = fromPromise(async () => {
    await actions.deleteEntity();
  });

  return setup({
    types: {
      context: {} as Context,
      events: {} as Events,
    },
    actors: { submitLogic },
  }).createMachine({
    id: 'deleteEntity',
    initial: 'confirming',
    context: {
      entityType: 'project',
      entityId: '',
      entityName: '',
      error: null,
    },
    states: {
      confirming: {
        on: {
          CONFIRM: { target: 'submitting' },
        },
      },

      submitting: {
        invoke: {
          src: 'submitLogic',
          onDone: { target: 'success' },
          onError: {
            target: 'failure',
            actions: assign(({ event }) => ({
              error: (event.error as Error).message,
            })),
          },
        },
        entry: ({ context }) => log.info('submit', `Deactivating ${context.entityType}`, { id: context.entityId }),
      },

      success: {
        entry: ({ context }) => {
          log.info('success', `${context.entityType} deactivated`, { id: context.entityId });
          actions.onSuccess?.();
          actions.onClose();
        },
        type: 'final',
      },

      failure: {
        entry: ({ context }) => log.error('failure', `Failed to deactivate ${context.entityType}`, { error: context.error }),
        on: {
          CONFIRM: { target: 'submitting', actions: assign({ error: null }) },
          RESET: { target: 'confirming', actions: assign({ error: null }) },
        },
      },
    },
  });
}
