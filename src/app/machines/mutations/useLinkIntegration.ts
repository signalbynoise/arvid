import { useMemo, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { createLinkIntegrationMachine, type IntegrationType } from './linkIntegration.machine';

interface LinkConfig {
  integrationType: IntegrationType;
  link: (payload: Record<string, unknown>) => Promise<void>;
  onLinked?: () => void;
  onClose: () => void;
}

export function useLinkIntegration({ integrationType, link, onLinked, onClose }: LinkConfig) {
  const linkRef = useRef(link);
  linkRef.current = link;
  const onLinkedRef = useRef(onLinked);
  onLinkedRef.current = onLinked;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const machine = useMemo(
    () => createLinkIntegrationMachine({
      link: (payload) => linkRef.current(payload),
      onLinked: () => onLinkedRef.current?.(),
      onClose: () => onCloseRef.current(),
    }),
    [],
  );

  const [state, send] = useMachine(machine, {
    context: { integrationType, error: null },
  });

  return {
    state: state.value as string,
    error: state.context.error,
    isLinking: state.matches('linking'),
    link: (payload: Record<string, unknown>) => send({ type: 'LINK', payload }),
    reset: () => send({ type: 'RESET' }),
  };
}
