import { useMemo, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { createDeleteEntityMachine, type DeleteEntityType } from './deleteEntity.machine';

interface DeleteConfig {
  entityType: DeleteEntityType;
  entityId: string;
  entityName: string;
  deleteEntity: () => Promise<void>;
  onClose: () => void;
  onSuccess?: () => void;
}

export function useDeleteEntity({ entityType, entityId, entityName, deleteEntity, onClose, onSuccess }: DeleteConfig) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const deleteRef = useRef(deleteEntity);
  deleteRef.current = deleteEntity;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const machine = useMemo(
    () => createDeleteEntityMachine({
      deleteEntity: () => deleteRef.current(),
      onClose: () => onCloseRef.current(),
      onSuccess: () => onSuccessRef.current?.(),
    }),
    [],
  );

  const [state, send] = useMachine(machine, {
    context: { entityType, entityId, entityName, error: null },
  });

  return {
    state: state.value as string,
    error: state.context.error,
    isSubmitting: state.matches('submitting'),
    confirm: () => send({ type: 'CONFIRM' }),
    reset: () => send({ type: 'RESET' }),
  };
}
