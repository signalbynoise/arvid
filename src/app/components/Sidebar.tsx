import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Folder, LoaderPinwheel } from 'lucide-react';
import { SidebarFooter } from './SidebarFooter';
import { WorkspacePicker } from './WorkspacePicker';
import { TeamSection } from './TeamSection';
import { useSidebarModals } from './hooks/useSidebarModals';
import { useNavigate } from 'react-router-dom';
import { useStore, selectProjects, selectSelectedProjectId, selectPendingModal, selectActiveWorkspaceId, selectTeams, selectWorkspaces } from '../store';
import { buildProjectTree } from '../domain/projects';
import { buildProjectPathFromEntities } from '../domain/paths';

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const navigate = useNavigate();
  const projects = useStore(selectProjects);
  const projectsDataState = useStore(s => s.projectsDataState);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const slackConnection = useStore(s => s.slackConnection);
  const loadSlackStatus = useStore(s => s.loadSlackStatus);
  const loadSlackChannels = useStore(s => s.loadSlackChannels);
  const loadProjects = useStore(s => s.loadProjects);
  const pendingModal = useStore(selectPendingModal);
  const clearPendingModal = useStore(s => s.clearPendingModal);

  const workspaces = useStore(selectWorkspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const teams = useStore(selectTeams);
  const workspacesDataState = useStore(s => s.workspacesDataState);
  const loadDeactivationMap = useStore(s => s.loadDeactivationMap);

  const activeWorkspace = useMemo(
    () => workspaces.find(w => w.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId],
  );

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  const tree = useMemo(() => buildProjectTree(projects), [projects]);

  const projectsByTeam = useMemo(() => {
    const grouped = new Map<string, typeof projects>();
    const ungrouped: typeof projects = [];
    for (const p of projects) {
      if (p.teamId) {
        const list = grouped.get(p.teamId) ?? [];
        list.push(p);
        grouped.set(p.teamId, list);
      } else {
        ungrouped.push(p);
      }
    }
    return { grouped, ungrouped };
  }, [projects]);

  const hasTeams = teams.length > 0;

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    teams.forEach(t => { initial[t.id] = true; });
    return initial;
  });

  const modals = useSidebarModals(activeWorkspace, teams, projects);

  useEffect(() => {
    loadSlackStatus();
  }, [loadSlackStatus]);

  useEffect(() => {
    if (slackConnection.status === 'connected') {
      loadSlackChannels();
    }
  }, [slackConnection.status, loadSlackChannels]);

  useEffect(() => {
    if (activeWorkspaceId) {
      loadDeactivationMap(activeWorkspaceId);
    }
  }, [activeWorkspaceId, teams.length, projects.length, loadDeactivationMap]);

  useEffect(() => {
    if (pendingModal?.type === 'createProject') {
      const { selectedProjectId, projects: storeProjects } = useStore.getState();
      const currentProject = selectedProjectId ? storeProjects.find(p => p.id === selectedProjectId) : undefined;
      modals.openCreate(currentProject?.id, currentProject?.teamId);
      clearPendingModal();
    }
  }, [pendingModal, clearPendingModal]);

  useEffect(() => {
    if (projects.length > 0) {
      const roots = projects.filter(p => !p.parentId);
      const hasChildren = roots.reduce<Record<string, boolean>>((acc, root) => {
        const children = projects.filter(p => p.parentId === root.id);
        if (children.length > 0) acc[root.id] = true;
        return acc;
      }, {});
      setExpandedProjects(prev => {
        const updated = { ...prev };
        for (const id of Object.keys(hasChildren)) {
          if (!(id in updated)) updated[id] = true;
        }
        return updated;
      });
    }
  }, [projects]);

  const toggleExpand = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleTeamExpand = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedTeams(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSelectProject = useCallback((nodeId: string) => {
    const project = projects.find(p => p.id === nodeId);
    if (project && activeWorkspace) {
      navigate(buildProjectPathFromEntities(activeWorkspace, teams, project));
    }
  }, [projects, activeWorkspace, teams, navigate]);

  const getTeamId = useCallback((nodeId: string) => {
    return projects.find(p => p.id === nodeId)?.teamId;
  }, [projects]);

  const handleCreateSubProject = useCallback((nodeId: string, teamId?: string) => {
    modals.openCreate(nodeId, teamId);
  }, [modals]);

  if (!isOpen) return null;

  return (
    <div className="w-sidebar h-full flex-shrink-0 bg-surface-panel border-r border-border-subtle flex flex-col">
      <div className="border-b border-border-subtle shrink-0 flex items-center px-4 py-3">
        <WorkspacePicker
          onSettingsClick={modals.openSettings}
          onCreateClick={modals.openCreateWorkspace}
          onCreateTeamClick={modals.openCreateTeam}
          onInviteClick={() => {
            if (activeWorkspace) modals.openInvite('workspace', activeWorkspace.id, activeWorkspace.name);
          }}
          onRenameClick={modals.openSettings}
          onDeactivateClick={() => {
            const ws = workspaces.find(w => w.id === activeWorkspaceId);
            if (ws) modals.openDeactivate(ws.id, ws.name, 'workspace');
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar py-3">
        {(projectsDataState.status === 'loading' || workspacesDataState.status === 'loading') && projects.length === 0 ? (
          <div className="flex justify-center py-4">
            <LoaderPinwheel size={16} className="text-text-quaternary animate-spin" />
          </div>
        ) : hasTeams || tree.length > 0 ? (
          <TeamSection
            teams={teams}
            projectsByTeam={projectsByTeam.grouped}
            ungroupedProjects={projectsByTeam.ungrouped}
            tree={tree}
            expandedMap={expandedProjects}
            teamExpandedMap={expandedTeams}
            selectedProjectId={selectedProjectId}
            onSelectProject={handleSelectProject}
            onToggleExpand={toggleExpand}
            onToggleTeamExpand={toggleTeamExpand}
            onAddUserToProject={(id, name) => modals.openInvite('project', id, name)}
            onAddUserToTeam={(id, name) => modals.openInvite('team', id, name)}
            onRenameProject={modals.openRenameProject}
            onRenameTeam={modals.openRenameTeam}
            onCreateSubProject={handleCreateSubProject}
            onCreateProjectInTeam={(teamId) => modals.openCreate(undefined, teamId)}
            onDeactivateProject={(id, name) => modals.openDeactivate(id, name, 'project')}
            onDeactivateTeam={(id, name) => modals.openDeactivate(id, name, 'team')}
            getTeamId={getTeamId}
          />
        ) : (
          <div className="px-4 py-6 text-center">
            <Folder size={24} className="mx-auto mb-2 text-text-quaternary opacity-60" />
            <p className="text-caption-lg text-text-empty mb-3">No projects yet.</p>
            <button
              onClick={() => modals.openCreate()}
              className="btn-ghost inline-flex items-center gap-1.5"
            >
              <Plus size={12} />
              <span>Create Project</span>
            </button>
          </div>
        )}
      </div>

      {selectedProject && (
        <SidebarFooter project={selectedProject} onProjectsReload={() => loadProjects(activeWorkspaceId ?? undefined)} />
      )}

      {modals.renderModals()}
    </div>
  );
}
