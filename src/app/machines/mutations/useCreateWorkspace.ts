import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMachine } from '@xstate/react';
import { useStore } from '../../store';
import { buildWorkspacePath } from '../../domain/paths';
import { createCreateWorkspaceMachine } from './createWorkspace.machine';

export function useCreateWorkspace(onClose: () => void) {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const createWorkspace = useStore(s => s.createWorkspace);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const machine = useMemo(
    () => createCreateWorkspaceMachine({
      createWorkspace,
      navigate: (path) => navigateRef.current(path),
      buildWorkspacePath,
      onClose: () => onCloseRef.current(),
    }),
    [createWorkspace],
  );

  const [state, send] = useMachine(machine);

  return {
    state: state.value as string,
    error: state.context.error,
    isSubmitting: state.matches('submitting'),
    submit: (name: string) => send({ type: 'SUBMIT', name }),
    reset: () => send({ type: 'RESET' }),
  };
}
