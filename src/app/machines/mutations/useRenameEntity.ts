import { useMemo, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { createRenameEntityMachine, type EntityType } from './renameEntity.machine';

interface RenameConfig {
  entityType: EntityType;
  entityId: string;
  currentName: string;
  rename: (id: string, name: string) => Promise<void>;
  onClose: () => void;
}

export function useRenameEntity({ entityType, entityId, currentName, rename, onClose }: RenameConfig) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const renameRef = useRef(rename);
  renameRef.current = rename;

  const machine = useMemo(
    () => createRenameEntityMachine({
      rename: (id, name) => renameRef.current(id, name),
      onClose: () => onCloseRef.current(),
    }),
    [],
  );

  const [state, send] = useMachine(machine, {
    context: { entityType, entityId, currentName, name: currentName, error: null },
  });

  return {
    state: state.value as string,
    error: state.context.error,
    isSubmitting: state.matches('submitting'),
    submit: (name: string) => send({ type: 'SUBMIT', name }),
    reset: () => send({ type: 'RESET' }),
  };
}
