import { useMemo, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { useStore } from '../../store';
import { createCreateTeamMachine } from './createTeam.machine';

export function useCreateTeam(onClose: () => void) {
  const createTeam = useStore(s => s.createTeam);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const machine = useMemo(
    () => createCreateTeamMachine({
      createTeam,
      onClose: () => onCloseRef.current(),
    }),
    [createTeam],
  );

  const [state, send] = useMachine(machine);

  return {
    state: state.value as string,
    error: state.context.error,
    isSubmitting: state.matches('submitting'),
    submit: (name: string, workspaceId: string) => send({ type: 'SUBMIT', name, workspaceId }),
    reset: () => send({ type: 'RESET' }),
  };
}
