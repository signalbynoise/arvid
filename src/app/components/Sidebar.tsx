import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Folder, Loader2, Network } from 'lucide-react';
import { ProjectIcon } from './ProjectIcon';
import { SidebarItem } from './SidebarItem';
import { NewProjectModal } from './NewProjectModal';
import { RenameProjectModal } from './RenameProjectModal';
import { ProjectItemMenu } from './ProjectItemMenu';
import { TeamItemMenu } from './TeamItemMenu';
import { DeactivateModal } from './DeactivateModal';
import { SidebarFooter } from './SidebarFooter';
import { WorkspacePicker } from './WorkspacePicker';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { WorkspaceSettingsModal } from './WorkspaceSettingsModal';
import { CreateTeamModal } from './CreateTeamModal';
import { InviteMemberModal } from './InviteMemberModal';
import { useNavigate } from 'react-router-dom';
import { useStore, selectProjects, selectSelectedProjectId, selectPendingModal, selectActiveWorkspaceId, selectTeams, selectWorkspaces } from '../store';
import { buildProjectTree, ProjectTreeNode } from '../domain/projects';
import { buildProjectPathFromEntities } from '../domain/paths';

const DEPTH_INDENT_PX = 20;

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
  const pendingModal = useStore(selectPendingModal);
  const clearPendingModal = useStore(s => s.clearPendingModal);

  const workspaces = useStore(selectWorkspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const teams = useStore(selectTeams);
  const workspacesDataState = useStore(s => s.workspacesDataState);
  const deleteWorkspace = useStore(s => s.deleteWorkspace);
  const deleteTeam = useStore(s => s.deleteTeam);
  const deleteProject = useStore(s => s.deleteProject);
  const deactivationMap = useStore(s => s.deactivationMap);
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

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | undefined>(undefined);
  const [createTeamId, setCreateTeamId] = useState<string | undefined>(undefined);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);

  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; name: string; type: 'workspace' | 'team' | 'project' } | null>(null);

  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);

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
      openCreate();
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

  if (!isOpen) return null;

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreate = (parentId?: string, teamId?: string) => {
    setCreateParentId(parentId);
    setCreateTeamId(teamId);
    setIsCreateOpen(true);
  };

  const openRename = (id: string, name: string) => {
    setRenameTarget({ id, name });
    setIsRenameOpen(true);
  };

  const openDeactivate = (id: string, name: string, type: 'workspace' | 'team' | 'project') => {
    setDeactivateTarget({ id, name, type });
    setIsDeactivateOpen(true);
  };

  const renderNode = (node: ProjectTreeNode, depth = 0) => {
    const isExpanded = expandedProjects[node.id];
    const isSelected = selectedProjectId === node.id;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        <SidebarItem
          label={node.name}
          icon={<ProjectIcon depth={depth} isSelected={isSelected} />}
          isSelected={isSelected}
          indent={depth * DEPTH_INDENT_PX}
          chevron={hasChildren ? { open: !!isExpanded, onToggle: (e) => toggleExpand(e, node.id) } : undefined}
          onClick={() => {
            const project = projects.find(p => p.id === node.id);
            if (project && activeWorkspace) {
              navigate(buildProjectPathFromEntities(activeWorkspace, teams, project));
            }
          }}
          actions={
            <ProjectItemMenu
              projectId={node.id}
              onAddUser={() => {}}
              onRename={() => openRename(node.id, node.name)}
              onMove={() => {}}
              onCreateSubProject={() => openCreate(node.id)}
              onSettings={() => {}}
              onDeactivate={() => openDeactivate(node.id, node.name, 'project')}
            />
          }
        />

        {isExpanded && hasChildren && (
          <div className="mt-0.5">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderTeamSection = () => {
    if (!hasTeams) {
      return (
        <div className="space-y-0.5">
          {tree.map(node => renderNode(node))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {teams.map(team => {
          const teamProjects = projectsByTeam.grouped.get(team.id) ?? [];
          const teamProjectTree = buildProjectTree(teamProjects);

          return (
            <div key={team.id}>
              <SidebarItem
                label={team.name}
                icon={<Network size={16} className="text-text-quaternary shrink-0" />}
                actions={
                  <TeamItemMenu
                    teamId={team.id}
                    onAddUser={() => {}}
                    onRename={() => {}}
                    onMove={() => {}}
                    onCreateProject={() => openCreate(undefined, team.id)}
                    onSettings={() => {}}
                    onDeactivate={() => openDeactivate(team.id, team.name, 'team')}
                  />
                }
              />

              {teamProjectTree.length > 0 && (
                <div className="space-y-0.5">
                  {teamProjectTree.map(node => renderNode(node))}
                </div>
              )}
            </div>
          );
        })}

        {projectsByTeam.ungrouped.length > 0 && (
          <div>
            <div className="flex items-center px-4 mb-1">
              <span className="text-caption-lg text-text-quaternary">
                Ungrouped
              </span>
            </div>
            <div className="space-y-0.5">
              {buildProjectTree(projectsByTeam.ungrouped).map(node => renderNode(node))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-[300px] h-full flex-shrink-0 bg-surface-panel border-r border-border-subtle flex flex-col">
      <div className="border-b border-border-subtle shrink-0 flex items-center px-4 py-3">
        <WorkspacePicker
          onSettingsClick={() => setIsSettingsOpen(true)}
          onCreateClick={() => setIsCreateWsOpen(true)}
          onCreateTeamClick={() => setIsCreateTeamOpen(true)}
          onInviteClick={() => setIsInviteMemberOpen(true)}
          onRenameClick={() => {}}
          onDeactivateClick={() => {
            const ws = workspaces.find(w => w.id === activeWorkspaceId);
            if (ws) openDeactivate(ws.id, ws.name, 'workspace');
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar py-3">
        {(projectsDataState.status === 'loading' || workspacesDataState.status === 'loading') && projects.length === 0 ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="text-text-quaternary animate-spin" />
          </div>
        ) : hasTeams ? (
          renderTeamSection()
        ) : tree.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Folder size={24} className="mx-auto mb-2 text-text-quaternary opacity-60" />
            <p className="text-caption-lg text-text-empty mb-3">No projects yet.</p>
            <button
              onClick={() => openCreate()}
              className="btn-ghost px-3 py-1.5 inline-flex items-center space-x-1.5"
            >
              <Plus size={12} />
              <span>Create Project</span>
            </button>
          </div>
        ) : (
          renderTeamSection()
        )}
      </div>

      {selectedProject && (
        <SidebarFooter project={selectedProject} onProjectsReload={() => loadProjects()} />
      )}

      <NewProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultParentId={createParentId}
        defaultTeamId={createTeamId}
      />

      {renameTarget && (
        <RenameProjectModal
          isOpen={isRenameOpen}
          onClose={() => { setIsRenameOpen(false); setRenameTarget(null); }}
          projectId={renameTarget.id}
          currentName={renameTarget.name}
        />
      )}

      {deactivateTarget && (
        <DeactivateModal
          isOpen={isDeactivateOpen}
          onClose={() => { setIsDeactivateOpen(false); setDeactivateTarget(null); }}
          entityType={deactivateTarget.type}
          entityName={deactivateTarget.name}
          onConfirm={() => {
            if (deactivateTarget.type === 'workspace') deleteWorkspace(deactivateTarget.id);
            if (deactivateTarget.type === 'team') deleteTeam(deactivateTarget.id);
            if (deactivateTarget.type === 'project') deleteProject(deactivateTarget.id);
          }}
        />
      )}

      <CreateWorkspaceModal
        isOpen={isCreateWsOpen}
        onClose={() => setIsCreateWsOpen(false)}
      />

      <WorkspaceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onCreateTeam={() => { setIsSettingsOpen(false); setIsCreateTeamOpen(true); }}
        onInviteMember={() => { setIsSettingsOpen(false); setIsInviteMemberOpen(true); }}
      />

      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        onClose={() => setIsCreateTeamOpen(false)}
      />

      <InviteMemberModal
        isOpen={isInviteMemberOpen}
        onClose={() => setIsInviteMemberOpen(false)}
      />
    </div>
  );
}
