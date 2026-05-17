import { setup, assign, fromPromise } from 'xstate';
import { toast } from 'sonner';
import type { Invitation } from '../../types';
import { logger } from '../../logger';

const log = logger.create('machines:sendInvitation');

interface Context {
  email: string;
  error: string | null;
}

type Events =
  | { type: 'SUBMIT'; email: string; workspaceId: string; scope: string; scopeId?: string }
  | { type: 'RESET' };

export interface SendInvitationActions {
  sendInvitation: (workspaceId: string, opts: Record<string, unknown>) => Promise<Invitation | undefined>;
  onClose: () => void;
}

export function createSendInvitationMachine(actions: SendInvitationActions) {
  const submitLogic = fromPromise(async ({ input }: { input: { email: string; workspaceId: string; scope: string; scopeId?: string } }) => {
    const payload: Record<string, unknown> = { email: input.email, role: 'member', scope: input.scope };
    if (input.scope === 'team') payload.teamId = input.scopeId;
    if (input.scope === 'project') payload.projectId = input.scopeId;
    const result = await actions.sendInvitation(input.workspaceId, payload);
    if (!result) throw new Error('Failed to send invitation. The email may already be invited.');
    return result;
  });

  return setup({
    types: {
      context: {} as Context,
      events: {} as Events,
    },
    actors: { submitLogic },
  }).createMachine({
    id: 'sendInvitation',
    initial: 'idle',
    context: { email: '', error: null },
    states: {
      idle: {
        on: {
          SUBMIT: {
            target: 'submitting',
            guard: ({ event }) => event.email.trim().length > 0,
            actions: assign(({ event }) => ({ email: event.email.trim(), error: null })),
          },
        },
      },

      submitting: {
        invoke: {
          src: 'submitLogic',
          input: ({ context, event }) => {
            const e = event as Extract<Events, { type: 'SUBMIT' }>;
            return { email: context.email, workspaceId: e.workspaceId, scope: e.scope, scopeId: e.scopeId };
          },
          onDone: { target: 'success' },
          onError: {
            target: 'failure',
            actions: assign(({ event }) => ({ error: (event.error as Error).message })),
          },
        },
        entry: ({ context }) => log.info('submit', 'Sending invitation', { email: context.email }),
      },

      success: {
        entry: ({ context }) => {
          log.info('success', 'Invitation sent');
          toast.success('Invitation sent', { description: `An invite has been sent to ${context.email}.` });
          actions.onClose();
        },
        type: 'final',
      },

      failure: {
        entry: ({ context }) => {
          log.error('failure', 'Failed to send invitation', { error: context.error });
          toast.error('Invitation failed', { description: context.error ?? 'Something went wrong.' });
        },
        on: {
          SUBMIT: {
            target: 'submitting',
            guard: ({ event }) => event.email.trim().length > 0,
            actions: assign(({ event }) => ({ email: event.email.trim(), error: null })),
          },
          RESET: { target: 'idle', actions: assign({ email: '', error: null }) },
        },
      },
    },
  });
}
