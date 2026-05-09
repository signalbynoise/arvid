import { useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMachine } from '@xstate/react';
import { useStore, selectWorkspaces } from '../store';
import { createRouterResolverMachine } from './routerResolver.machine';
import { buildProjectPathFromEntities } from '../domain/paths';
import { logger } from '../logger';

const log = logger.create('navigation');

export function useRouterResolver() {
  const params = useParams<{
    wsShortId?: string;
    teamShortId?: string;
    projectShortId?: string;
    reqShortId?: string;
    questionShortId?: string;
  }>();

  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const setActiveWorkspace = useStore(s => s.setActiveWorkspace);
  const loadProjects = useStore(s => s.loadProjects);
  const loadTeams = useStore(s => s.loadTeams);
  const setSelectedProjectId = useStore(s => s.setSelectedProjectId);
  const selectRequirement = useStore(s => s.selectRequirement);
  const selectQuestion = useStore(s => s.selectQuestion);
  const acceptPendingInvitations = useStore(s => s.acceptPendingInvitations);
  const loadWorkspaces = useStore(s => s.loadWorkspaces);
  const workspacesDataState = useStore(s => s.workspacesDataState);

  const actionsRef = useRef({
    navigate: (path: string) => navigateRef.current(path, { replace: true }),
    setActiveWorkspace,
    loadProjects,
    loadTeams,
    setSelectedProjectId,
    selectRequirement,
    selectQuestion,
    buildProjectPath: buildProjectPathFromEntities,
  });
  actionsRef.current = {
    navigate: (path: string) => navigateRef.current(path, { replace: true }),
    setActiveWorkspace,
    loadProjects,
    loadTeams,
    setSelectedProjectId,
    selectRequirement,
    selectQuestion,
    buildProjectPath: buildProjectPathFromEntities,
  };

  const machine = useMemo(
    () => createRouterResolverMachine(actionsRef.current),
    [],
  );

  const [state, send] = useMachine(machine);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      async function init() {
        await acceptPendingInvitations();
        if (useStore.getState().workspacesDataState.status === 'idle') {
          loadWorkspaces();
        }
      }
      init();
    }
  }, [acceptPendingInvitations, loadWorkspaces]);

  const workspaces = useStore(selectWorkspaces);
  const prevWsLenRef = useRef(0);
  useEffect(() => {
    if (workspaces.length > 0 && workspaces.length !== prevWsLenRef.current) {
      prevWsLenRef.current = workspaces.length;
      send({ type: 'WORKSPACES_READY', workspaces });
    }
  }, [workspaces, send]);

  const prevUrlRef = useRef<string>('');
  useEffect(() => {
    const key = `${params.wsShortId}|${params.projectShortId}|${params.reqShortId}|${params.questionShortId}`;
    if (key === prevUrlRef.current) return;
    prevUrlRef.current = key;

    send({
      type: 'URL_CHANGED',
      wsShortId: params.wsShortId,
      projectShortId: params.projectShortId,
      reqShortId: params.reqShortId,
      questionShortId: params.questionShortId,
    });
  }, [params.wsShortId, params.projectShortId, params.reqShortId, params.questionShortId, send]);

  useEffect(() => {
    return useStore.subscribe((s, prev) => {
      const bothReady = s.projectsDataState.status === 'ready' && s.teamsDataState.status === 'ready';
      const wasBothReady = prev.projectsDataState.status === 'ready' && prev.teamsDataState.status === 'ready';

      if (bothReady && !wasBothReady && s.activeWorkspaceId) {
        send({
          type: 'DATA_LOADED',
          workspaceId: s.activeWorkspaceId,
          projects: s.projects,
          teams: s.teams,
        });
      }
    });
  }, [send]);

  return state;
}
