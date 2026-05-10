import { useMemo, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { createCreateEntityMachine, type CreateEntityType } from './createEntity.machine';

interface CreateEntityConfig {
  entityType: CreateEntityType;
  create: (payload: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}

export function useCreateEntity({ entityType, create, onClose }: CreateEntityConfig) {
  const createRef = useRef(create);
  createRef.current = create;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const machine = useMemo(
    () => createCreateEntityMachine({
      create: (payload) => createRef.current(payload),
      onClose: () => onCloseRef.current(),
    }),
    [],
  );

  const [state, send] = useMachine(machine, {
    context: { entityType, error: null },
  });

  return {
    state: state.value as string,
    error: state.context.error,
    isSubmitting: state.matches('submitting'),
    submit: (payload: Record<string, unknown>) => send({ type: 'SUBMIT', payload }),
    reset: () => send({ type: 'RESET' }),
  };
}
