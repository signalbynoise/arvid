import { useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMachine } from '@xstate/react';
import { useStore, selectWorkspaces } from '../store';
import { createRouterResolverMachine } from './routerResolver.machine';
import { buildProjectPathFromEntities } from '../domain/paths';

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
  const loadMembers = useStore(s => s.loadMembers);
  const setSelectedProjectId = useStore(s => s.setSelectedProjectId);

  const setReqId = (id: string | null) => {
    useStore.setState({
      selectedReqId: id,
      ...(id === null ? { selectedQuestionId: null } : {}),
    });
  };
  const setQuestionId = (id: string | null) => {
    useStore.setState({ selectedQuestionId: id });
  };

  const actionsRef = useRef({
    navigate: (path: string) => navigateRef.current(path, { replace: true }),
    setActiveWorkspace,
    loadProjects,
    loadTeams,
    loadMembers,
    setSelectedProjectId,
    selectRequirement: setReqId,
    selectQuestion: setQuestionId,
    buildProjectPath: buildProjectPathFromEntities,
    getProjects: () => useStore.getState().projects,
    getTeams: () => useStore.getState().teams,
    getRequirements: () => useStore.getState().requirements,
    getQuestions: () => useStore.getState().questions,
  });
  actionsRef.current = {
    navigate: (path: string) => navigateRef.current(path, { replace: true }),
    setActiveWorkspace,
    loadProjects,
    loadTeams,
    loadMembers,
    setSelectedProjectId,
    selectRequirement: setReqId,
    selectQuestion: setQuestionId,
    buildProjectPath: buildProjectPathFromEntities,
    getProjects: () => useStore.getState().projects,
    getTeams: () => useStore.getState().teams,
    getRequirements: () => useStore.getState().requirements,
    getQuestions: () => useStore.getState().questions,
  };

  const machine = useMemo(
    () => createRouterResolverMachine(actionsRef.current),
    [],
  );

  const [state, send] = useMachine(machine);

  // Workspaces ready → send to machine
  const workspaces = useStore(selectWorkspaces);
  const prevWsLenRef = useRef(0);
  useEffect(() => {
    if (workspaces.length > 0 && workspaces.length !== prevWsLenRef.current) {
      prevWsLenRef.current = workspaces.length;
      send({ type: 'WORKSPACES_READY', workspaces });
    }
  }, [workspaces, send]);

  // URL changes → send to machine
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

  // Zustand data readiness → DATA_LOADED event
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

  // Entities readiness → ENTITIES_LOADED event
  useEffect(() => {
    return useStore.subscribe((s, prev) => {
      const becameReady = s.dataState.status === 'ready' && prev.dataState.status !== 'ready';
      const entitiesChanged = s.dataState.status === 'ready' && (
        s.requirements !== prev.requirements || s.questions !== prev.questions
      );

      if (becameReady || entitiesChanged) {
        send({
          type: 'ENTITIES_LOADED',
          requirements: s.requirements,
          questions: s.questions,
        });
      }
    });
  }, [send]);

  return state;
}
