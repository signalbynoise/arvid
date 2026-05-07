import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Plus, Folder, Hash, Loader2, Users } from 'lucide-react';
import { IconButton } from './IconButton';
import { NewProjectModal } from './NewProjectModal';
import { RenameProjectModal } from './RenameProjectModal';
import { DeleteProjectModal } from './DeleteProjectModal';
import { ProjectItemMenu } from './ProjectItemMenu';
import { RepoSelector } from './RepoSelector';
import { LinearProjectSelector } from './LinearProjectSelector';
import { SlackNotifySelector } from './SlackNotifySelector';
import { WorkspacePicker } from './WorkspacePicker';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { WorkspaceSettingsModal } from './WorkspaceSettingsModal';
import { CreateTeamModal } from './CreateTeamModal';
import { InviteMemberModal } from './InviteMemberModal';
import { useStore, selectProjects, selectSelectedProjectId, selectPendingModal, selectActiveWorkspaceId, selectTeams } from '../store';
import { buildProjectTree, ProjectTreeNode } from '../domain/projects';
import { loadNavigation } from '../lib/navigation';

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const projects = useStore(selectProjects);
  const projectsDataState = useStore(s => s.projectsDataState);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const setSelectedProjectId = useStore(s => s.setSelectedProjectId);
  const loadProjects = useStore(s => s.loadProjects);
  const githubConnection = useStore(s => s.githubConnection);
  const repoFetchStatus = useStore(s => s.repoFetchStatus);
  const linearConnection = useStore(s => s.linearConnection);
  const slackConnection = useStore(s => s.slackConnection);
  const slackChannels = useStore(s => s.slackChannels);
  const loadSlackStatus = useStore(s => s.loadSlackStatus);
  const loadSlackChannels = useStore(s => s.loadSlackChannels);
  const pendingModal = useStore(selectPendingModal);
  const clearPendingModal = useStore(s => s.clearPendingModal);

  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const teams = useStore(selectTeams);
  const loadWorkspaces = useStore(s => s.loadWorkspaces);
  const loadTeams = useStore(s => s.loadTeams);
  const workspacesDataState = useStore(s => s.workspacesDataState);

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
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | undefined>(undefined);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; hasChildren: boolean } | null>(null);

  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);

  useEffect(() => {
    loadWorkspaces();
    loadSlackStatus();
  }, [loadWorkspaces, loadSlackStatus]);

  useEffect(() => {
    if (activeWorkspaceId) {
      loadProjects(activeWorkspaceId);
      loadTeams(activeWorkspaceId);
    }
  }, [activeWorkspaceId, loadProjects, loadTeams]);

  useEffect(() => {
    if (slackConnection.status === 'connected') {
      loadSlackChannels();
    }
  }, [slackConnection.status, loadSlackChannels]);

  useEffect(() => {
    if (pendingModal?.type === 'createProject') {
      openCreate();
      clearPendingModal();
    }
  }, [pendingModal, clearPendingModal]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      const saved = loadNavigation();
      const restoredProject = saved.projectId && projects.find(p => p.id === saved.projectId);
      const target = restoredProject ?? projects.find(p => !p.parentId);
      if (target) {
        setSelectedProjectId(target.id);
      }
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

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

  const openCreate = (parentId?: string) => {
    setCreateParentId(parentId);
    setIsCreateOpen(true);
  };

  const openRename = (id: string, name: string) => {
    setRenameTarget({ id, name });
    setIsRenameOpen(true);
  };

  const openDelete = (node: ProjectTreeNode) => {
    setDeleteTarget({ id: node.id, name: node.name, hasChildren: node.children.length > 0 });
    setIsDeleteOpen(true);
  };

  const renderNode = (node: ProjectTreeNode, depth = 0) => {
    const isExpanded = expandedProjects[node.id];
    const isSelected = selectedProjectId === node.id;
    const hasChildren = node.children.length > 0;
    const project = projects.find(p => p.id === node.id);
    const hasRepo = !!project?.githubRepo;

    return (
      <div key={node.id}>
        <div 
          onClick={() => setSelectedProjectId(node.id)}
          className={`group flex items-center justify-between py-1.5 px-2 mx-2 rounded-comfortable cursor-pointer text-[13px] font-[var(--fw-medium)] transition-colors ${
            isSelected 
              ? 'bg-surface-frost-08 text-text-primary' 
              : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'
          }`}
          style={{ '--depth': depth } as React.CSSProperties}
        >
          <div className="flex items-center space-x-2 overflow-hidden">
            <button 
              onClick={(e) => hasChildren ? toggleExpand(e, node.id) : undefined}
              className={`p-0.5 rounded-standard hover:bg-surface-frost-10 transition-colors ${hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {depth === 0 ? <Folder size={14} className={isSelected ? 'text-text-primary' : 'text-text-quaternary'} /> : <Hash size={14} className={isSelected ? 'text-text-primary' : 'text-text-quaternary'} />}
            {project?.shortId && (
              <span className="text-[10px] font-mono text-text-quaternary shrink-0">{project.shortId}</span>
            )}
            <span className="truncate">{node.name}</span>
            {hasRepo && (
              <img src="/github.svg" alt="" className="w-4 h-4 shrink-0 opacity-50" />
            )}
          </div>
          
          <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              onClick={(e) => { e.stopPropagation(); openCreate(node.id); }}
              title="Add sub-project"
            >
              <Plus size={14} />
            </IconButton>
            <ProjectItemMenu
              onAddSubProject={() => openCreate(node.id)}
              onRename={() => openRename(node.id, node.name)}
              onDelete={() => openDelete(node)}
            />
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="mt-0.5">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const toggleTeamExpand = (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation();
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  useEffect(() => {
    if (teams.length > 0) {
      setExpandedTeams(prev => {
        const updated = { ...prev };
        for (const t of teams) {
          if (!(t.id in updated)) updated[t.id] = true;
        }
        return updated;
      });
    }
  }, [teams]);

  const renderTeamSection = () => {
    if (!hasTeams) {
      return (
        <div className="space-y-0.5">
          {tree.map(node => renderNode(node))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {teams.map(team => {
          const teamProjects = projectsByTeam.grouped.get(team.id) ?? [];
          const isExpanded = expandedTeams[team.id] !== false;

          return (
            <div key={team.id}>
              <div className="flex items-center justify-between px-4 mb-0.5">
                <button
                  onClick={(e) => toggleTeamExpand(e, team.id)}
                  className="flex items-center gap-1.5 text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest hover:text-text-tertiary transition-colors"
                >
                  {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                  <Users size={10} />
                  <span>{team.name}</span>
                </button>
                <IconButton onClick={() => openCreate()} title="New Project">
                  <Plus size={12} />
                </IconButton>
              </div>

              {isExpanded && (
                <div className="space-y-0.5">
                  {teamProjects.length > 0 ? (
                    buildProjectTree(teamProjects).map(node => renderNode(node))
                  ) : (
                    <p className="px-6 py-1 text-[11px] text-text-empty">No projects</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {projectsByTeam.ungrouped.length > 0 && (
          <div>
            <div className="flex items-center px-4 mb-0.5">
              <span className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">
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
    <div className="w-[240px] h-full flex-shrink-0 bg-surface-panel border-r border-border-subtle flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-border-subtle shrink-0">
        <img src="/logo_wide.svg" alt="Arvid" className="h-5" />
      </div>

      <div className="px-3 py-2 border-b border-border-subtle shrink-0">
        <WorkspacePicker
          onSettingsClick={() => setIsSettingsOpen(true)}
          onCreateClick={() => setIsCreateWsOpen(true)}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto hide-scrollbar py-3">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">Projects</span>
          <IconButton onClick={() => openCreate()} title="New Project">
            <Plus size={14} />
          </IconButton>
        </div>
        
        {(projectsDataState.status === 'loading' || workspacesDataState.status === 'loading') && projects.length === 0 ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="text-text-quaternary animate-spin" />
          </div>
        ) : tree.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Folder size={24} className="mx-auto mb-2 text-text-quaternary opacity-60" />
            <p className="text-[12px] text-text-empty mb-3">No projects yet.</p>
            <button
              onClick={() => openCreate()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-surface-frost-06 hover:bg-surface-frost-10 border border-border-default rounded-comfortable text-[12px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <Plus size={12} />
              <span>Create Project</span>
            </button>
          </div>
        ) : (
          renderTeamSection()
        )}
      </div>

      {selectedProject && githubConnection.status === 'connected' && (
        <div className="border-t border-border-subtle px-4 py-3 shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <img src="/github.svg" alt="" className="w-4 h-4 opacity-40" />
            <span className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">
              Repository
            </span>
            {repoFetchStatus === 'fetching' && (
              <Loader2 size={10} className="animate-spin text-text-quaternary ml-auto" />
            )}
          </div>
          {selectedProject.githubRepo ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-text-secondary truncate" title={selectedProject.githubRepo}>
                {selectedProject.githubRepo}
              </span>
              <span className="h-2 w-2 rounded-full bg-status-success shrink-0" />
            </div>
          ) : (
            <RepoSelector projectId={selectedProject.id} onLinked={() => loadProjects()} />
          )}
        </div>
      )}

      {selectedProject && linearConnection.status === 'connected' && (
        <div className="border-t border-border-subtle px-4 py-3 shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <img src="/linear.svg" alt="" className="w-4 h-4 opacity-40" />
            <span className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">
              Linear
            </span>
          </div>
          {selectedProject.linearProjectName ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-text-secondary truncate" title={selectedProject.linearProjectName}>
                {selectedProject.linearProjectName}
              </span>
              <span className="h-2 w-2 rounded-full bg-status-success shrink-0" />
            </div>
          ) : (
            <LinearProjectSelector projectId={selectedProject.id} onLinked={() => loadProjects()} />
          )}
        </div>
      )}

      {selectedProject && slackConnection.status === 'connected' && (
        <div className="border-t border-border-subtle px-4 py-3 shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <img src="/slack.svg" alt="" className="w-4 h-4 opacity-40" />
            <span className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">
              Slack Notifications
            </span>
          </div>
          {selectedProject.slackNotificationChannelId ? (
            (() => {
              const ch = slackChannels.find(c => c.id === selectedProject.slackNotificationChannelId);
              return (
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-text-secondary truncate" title={ch ? `#${ch.name}` : 'Channel set'}>
                    {ch ? `#${ch.name}` : 'Channel set'}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-status-success shrink-0" />
                </div>
              );
            })()
          ) : (
            <SlackNotifySelector projectId={selectedProject.id} />
          )}
        </div>
      )}

      <NewProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultParentId={createParentId}
      />

      {renameTarget && (
        <RenameProjectModal
          isOpen={isRenameOpen}
          onClose={() => { setIsRenameOpen(false); setRenameTarget(null); }}
          projectId={renameTarget.id}
          currentName={renameTarget.name}
        />
      )}

      {deleteTarget && (
        <DeleteProjectModal
          isOpen={isDeleteOpen}
          onClose={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}
          projectId={deleteTarget.id}
          projectName={deleteTarget.name}
          hasChildren={deleteTarget.hasChildren}
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
