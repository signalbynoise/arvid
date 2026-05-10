import { useMemo, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { useStore } from '../../store';
import { createSendInvitationMachine } from './sendInvitation.machine';

export function useSendInvitation(onClose: () => void) {
  const sendInvitation = useStore(s => s.sendInvitation);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const machine = useMemo(
    () => createSendInvitationMachine({
      sendInvitation,
      onClose: () => onCloseRef.current(),
    }),
    [sendInvitation],
  );

  const [state, send] = useMachine(machine);

  return {
    state: state.value as string,
    error: state.context.error,
    isSubmitting: state.matches('submitting'),
    submit: (email: string, workspaceId: string, scope: string, scopeId?: string) =>
      send({ type: 'SUBMIT', email, workspaceId, scope, scopeId }),
    reset: () => send({ type: 'RESET' }),
  };
}
