import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMachine } from '@xstate/react';
import { useStore } from '../../store';
import { buildProjectPathFromEntities } from '../../domain/paths';
import { createCreateProjectMachine } from './createProject.machine';

export function useCreateProject(onClose: () => void) {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const createProject = useStore(s => s.createProject);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const machine = useMemo(
    () => createCreateProjectMachine({
      createProject,
      navigate: (path) => navigateRef.current(path),
      getState: () => useStore.getState(),
      buildProjectPath: buildProjectPathFromEntities,
      onClose: () => onCloseRef.current(),
    }),
    [createProject],
  );

  const [state, send] = useMachine(machine);

  return {
    state: state.value as string,
    error: state.context.error,
    isSubmitting: state.matches('submitting'),
    submit: (name: string, workspaceId: string, teamId: string, parentId?: string) =>
      send({ type: 'SUBMIT', name, workspaceId, teamId, parentId }),
    reset: () => send({ type: 'RESET' }),
  };
}
