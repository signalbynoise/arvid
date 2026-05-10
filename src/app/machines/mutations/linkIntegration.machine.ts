import { setup, assign, fromPromise } from 'xstate';
import { logger } from '../../logger';

const log = logger.create('machines:linkIntegration');

export type IntegrationType = 'github' | 'linear' | 'supabase' | 'slack';

interface Context {
  integrationType: IntegrationType;
  error: string | null;
}

type Events =
  | { type: 'LINK'; payload: Record<string, unknown> }
  | { type: 'RESET' };

export interface LinkIntegrationActions {
  link: (payload: Record<string, unknown>) => Promise<void>;
  onLinked?: () => void;
  onClose: () => void;
}

export function createLinkIntegrationMachine(actions: LinkIntegrationActions) {
  const linkLogic = fromPromise(async ({ input }: { input: { payload: Record<string, unknown> } }) => {
    await actions.link(input.payload);
  });

  return setup({
    types: {
      context: {} as Context,
      events: {} as Events,
    },
    actors: { linkLogic },
  }).createMachine({
    id: 'linkIntegration',
    initial: 'idle',
    context: { integrationType: 'github', error: null },
    states: {
      idle: {
        on: {
          LINK: { target: 'linking' },
        },
      },

      linking: {
        invoke: {
          src: 'linkLogic',
          input: ({ event }) => ({ payload: (event as Extract<Events, { type: 'LINK' }>).payload }),
          onDone: { target: 'success' },
          onError: {
            target: 'failure',
            actions: assign(({ event }) => ({ error: (event.error as Error).message })),
          },
        },
        entry: ({ context }) => log.info('link', `Linking ${context.integrationType}`),
      },

      success: {
        entry: ({ context }) => {
          log.info('success', `${context.integrationType} linked`);
          actions.onLinked?.();
          actions.onClose();
        },
        type: 'final',
      },

      failure: {
        entry: ({ context }) => log.error('failure', `Failed to link ${context.integrationType}`, { error: context.error }),
        on: {
          LINK: { target: 'linking', actions: assign({ error: null }) },
          RESET: { target: 'idle', actions: assign({ error: null }) },
        },
      },
    },
  });
}
