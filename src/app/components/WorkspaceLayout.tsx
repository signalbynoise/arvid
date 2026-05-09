import { useEffect, useRef } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { useStore, selectWorkspaces, selectTeams, selectRequirements, selectQuestions } from '../store';
import { buildProjectPathFromEntities } from '../domain/paths';
import { logger } from '../logger';

const log = logger.create('navigation');

export function WorkspaceLayout() {
  const { wsShortId, teamShortId, projectShortId, reqShortId, questionShortId } = useParams<{
    wsShortId: string;
    teamShortId?: string;
    projectShortId?: string;
    reqShortId?: string;
    questionShortId?: string;
  }>();

  const navigate = useNavigate();
  const workspaces = useStore(selectWorkspaces);
  const teams = useStore(selectTeams);
  const projects = useStore(s => s.projects);
  const requirements = useStore(selectRequirements);
  const questions = useStore(selectQuestions);
  const workspacesDataState = useStore(s => s.workspacesDataState);
  const projectsDataState = useStore(s => s.projectsDataState);
  const dataState = useStore(s => s.dataState);

  const setActiveWorkspace = useStore(s => s.setActiveWorkspace);
  const setSelectedProjectId = useStore(s => s.setSelectedProjectId);
  const selectRequirement = useStore(s => s.selectRequirement);
  const selectQuestion = useStore(s => s.selectQuestion);
  const loadWorkspaces = useStore(s => s.loadWorkspaces);
  const loadProjects = useStore(s => s.loadProjects);
  const loadTeams = useStore(s => s.loadTeams);
  const acceptPendingInvitations = useStore(s => s.acceptPendingInvitations);

  const syncedWsRef = useRef<string | null>(null);
  const syncedProjectRef = useRef<string | null>(null);
  const syncedReqRef = useRef<string | null>(null);
  const syncedQuestionRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      async function init() {
        await acceptPendingInvitations();
        if (workspacesDataState.status === 'idle') {
          loadWorkspaces();
        }
      }
      init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (workspacesDataState.status !== 'ready' || workspaces.length === 0 || !wsShortId) return;
    if (syncedWsRef.current === wsShortId) return;

    const workspace = workspaces.find(w => w.slug === wsShortId || w.shortId === wsShortId);
    if (!workspace) {
      log.warn('sync', 'Unknown workspace slug, redirecting', { wsShortId });
      navigate('/', { replace: true });
      return;
    }

    log.debug('sync', 'Syncing workspace from URL', { wsShortId, workspaceId: workspace.id });
    syncedWsRef.current = wsShortId;
    syncedProjectRef.current = null;
    syncedReqRef.current = null;
    syncedQuestionRef.current = null;
    setActiveWorkspace(workspace.id);
    loadProjects(workspace.id);
    loadTeams(workspace.id);
  }, [wsShortId, workspaces, workspacesDataState.status, setActiveWorkspace, loadProjects, loadTeams, navigate]);

  useEffect(() => {
    if (!projectShortId || projectsDataState.status !== 'ready' || projects.length === 0) return;
    if (syncedProjectRef.current === projectShortId) return;

    const project = projects.find(p => p.shortId === projectShortId);
    if (!project) {
      log.debug('sync', 'Unknown project short ID', { projectShortId });
      return;
    }

    log.debug('sync', 'Syncing project from URL', { projectShortId, projectId: project.id });
    syncedProjectRef.current = projectShortId;
    setSelectedProjectId(project.id);
  }, [projectShortId, projects, projectsDataState.status, setSelectedProjectId]);

  useEffect(() => {
    if (projectShortId || projectsDataState.status !== 'ready' || projects.length === 0 || workspaces.length === 0) return;

    const workspace = workspaces.find(w => w.shortId === wsShortId);
    if (!workspace) return;

    const firstProject = projects.find(p => !p.parentId);
    if (firstProject) {
      const path = buildProjectPathFromEntities(workspace, teams, firstProject);
      log.debug('sync', 'Auto-selecting first project', { path });
      navigate(path, { replace: true });
    }
  }, [projectShortId, projectsDataState.status, projects, workspaces, teams, wsShortId, navigate]);

  useEffect(() => {
    if (!reqShortId) {
      if (syncedReqRef.current) {
        log.debug('sync', 'Clearing requirement selection (URL has no reqShortId)');
        syncedReqRef.current = null;
        selectRequirement(null);
      }
      return;
    }
    if (dataState.status !== 'ready' || requirements.length === 0) return;
    if (syncedReqRef.current === reqShortId) return;

    const req = requirements.find(r => r.shortId === reqShortId);
    if (!req) {
      log.debug('sync', 'Unknown requirement short ID', { reqShortId });
      return;
    }

    log.debug('sync', 'Syncing requirement from URL', { reqShortId, reqId: req.id });
    syncedReqRef.current = reqShortId;
    selectRequirement(req.id);
  }, [reqShortId, requirements, dataState.status, selectRequirement]);

  useEffect(() => {
    if (!questionShortId) {
      if (syncedQuestionRef.current) {
        log.debug('sync', 'Clearing question selection (URL has no questionShortId)');
        syncedQuestionRef.current = null;
        selectQuestion(null);
      }
      return;
    }
    if (dataState.status !== 'ready' || questions.length === 0) return;
    if (syncedQuestionRef.current === questionShortId) return;

    const currentReq = requirements.find(r => r.shortId === reqShortId);
    if (!currentReq) return;

    const question = questions.find(q => q.shortId === questionShortId && q.requirementId === currentReq.id);
    if (!question) {
      log.debug('sync', 'Unknown question short ID', { questionShortId, reqShortId });
      return;
    }

    log.debug('sync', 'Syncing question from URL', { questionShortId, questionId: question.id });
    syncedQuestionRef.current = questionShortId;
    selectQuestion(question.id);
  }, [questionShortId, reqShortId, questions, requirements, dataState.status, selectQuestion]);

  return <Outlet />;
}
