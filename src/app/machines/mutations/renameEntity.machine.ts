import { setup, assign, fromPromise } from 'xstate';
import { logger } from '../../logger';

const log = logger.create('machines:renameEntity');

export type EntityType = 'workspace' | 'team' | 'project';

interface Context {
  entityType: EntityType;
  entityId: string;
  currentName: string;
  name: string;
  error: string | null;
}

type Events =
  | { type: 'SUBMIT'; name: string }
  | { type: 'RESET' };

export interface RenameEntityActions {
  rename: (id: string, name: string) => Promise<void>;
  onClose: () => void;
}

export function createRenameEntityMachine(actions: RenameEntityActions) {
  const submitLogic = fromPromise(async ({ input }: { input: { entityId: string; name: string } }) => {
    await actions.rename(input.entityId, input.name);
  });

  return setup({
    types: {
      context: {} as Context,
      events: {} as Events,
    },
    actors: { submitLogic },
  }).createMachine({
    id: 'renameEntity',
    initial: 'idle',
    context: {
      entityType: 'project',
      entityId: '',
      currentName: '',
      name: '',
      error: null,
    },
    states: {
      idle: {
        on: {
          SUBMIT: {
            target: 'submitting',
            guard: ({ context, event }) => {
              const trimmed = event.name.trim();
              return trimmed.length > 0 && trimmed !== context.currentName;
            },
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
          input: ({ context }) => ({ entityId: context.entityId, name: context.name }),
          onDone: { target: 'success' },
          onError: {
            target: 'failure',
            actions: assign(({ event }) => ({
              error: (event.error as Error).message,
            })),
          },
        },
        entry: ({ context }) => log.info('submit', `Renaming ${context.entityType}`, { id: context.entityId, name: context.name }),
      },

      success: {
        entry: ({ context }) => {
          log.info('success', `${context.entityType} renamed`, { id: context.entityId });
          actions.onClose();
        },
        type: 'final',
      },

      failure: {
        entry: ({ context }) => log.error('failure', `Failed to rename ${context.entityType}`, { error: context.error }),
        on: {
          SUBMIT: {
            target: 'submitting',
            guard: ({ context, event }) => {
              const trimmed = event.name.trim();
              return trimmed.length > 0 && trimmed !== context.currentName;
            },
            actions: assign(({ event }) => ({
              name: event.name.trim(),
              error: null,
            })),
          },
          RESET: { target: 'idle', actions: assign({ error: null }) },
        },
      },
    },
  });
}
