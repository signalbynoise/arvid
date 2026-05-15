import React, { useState, useEffect } from 'react';
import { useStore, selectActiveWorkspaceId, selectPendingModal } from '../../store';
import { NewProjectModal } from '../NewProjectModal';
import { RenameProjectModal } from '../RenameProjectModal';
import { RenameTeamModal } from '../RenameTeamModal';
import { DeactivateModal } from '../DeactivateModal';
import { CreateWorkspaceModal } from '../CreateWorkspaceModal';
import { WorkspaceSettingsModal } from '../WorkspaceSettingsModal';
import { TeamSettingsModal } from '../TeamSettingsModal';
import { ProjectSettingsModal } from '../ProjectSettingsModal';
import { CreateTeamModal } from '../CreateTeamModal';
import { InviteMemberModal } from '../InviteMemberModal';
import type { Project, Team, Workspace } from '../../types';

interface CreateProjectContext {
  parentId?: string;
  parentName?: string;
  teamId: string;
  teamName: string;
}

interface InviteContext {
  scope: 'workspace' | 'team' | 'project';
  scopeId: string;
  scopeName: string;
}

interface RenameTarget {
  id: string;
  name: string;
}

interface DeactivateTarget {
  id: string;
  name: string;
  type: 'workspace' | 'team' | 'project';
}

export function useSidebarModals(
  activeWorkspace: Workspace | undefined,
  teams: Team[],
  projects: Project[],
  onSelectProject?: (projectId: string) => void,
) {
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const deleteWorkspace = useStore(s => s.deleteWorkspace);
  const deleteTeam = useStore(s => s.deleteTeam);
  const deleteProject = useStore(s => s.deleteProject);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createProjectContext, setCreateProjectContext] = useState<CreateProjectContext | null>(null);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);

  const [isRenameTeamOpen, setIsRenameTeamOpen] = useState(false);
  const [renameTeamTarget, setRenameTeamTarget] = useState<RenameTarget | null>(null);

  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<DeactivateTarget | null>(null);

  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);

  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [inviteContext, setInviteContext] = useState<InviteContext | null>(null);

  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);
  const [teamSettingsId, setTeamSettingsId] = useState<string | null>(null);

  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [projectSettingsId, setProjectSettingsId] = useState<string | null>(null);

  const pendingModal = useStore(selectPendingModal);
  const clearPendingModal = useStore(s => s.clearPendingModal);

  useEffect(() => {
    if (!pendingModal) return;
    switch (pendingModal.type) {
      case 'createWorkspace':
        setIsCreateWsOpen(true);
        clearPendingModal();
        break;
      case 'createTeam':
        setIsCreateTeamOpen(true);
        clearPendingModal();
        break;
      case 'createProject': {
        const state = useStore.getState();
        const currentProjectId = state.selectedProjectId;
        const currentProject = currentProjectId
          ? state.projects.find(p => p.id === currentProjectId)
          : undefined;
        const projectTeam = currentProject?.teamId
          ? state.teams.find(t => t.id === currentProject.teamId)
          : undefined;
        const fallbackTeam = state.teams[0];
        const resolvedTeam = projectTeam ?? fallbackTeam;

        if (resolvedTeam) {
          setCreateProjectContext({
            parentId: currentProject?.id,
            parentName: currentProject?.name,
            teamId: resolvedTeam.id,
            teamName: resolvedTeam.name,
          });
          setIsCreateOpen(true);
        }
        clearPendingModal();
        break;
      }
      case 'inviteMember': {
        const inviteData = pendingModal.data as { scope?: 'workspace' | 'team' | 'project' } | undefined;
        const scope = inviteData?.scope ?? 'workspace';

        if (scope === 'workspace' && activeWorkspace) {
          setInviteContext({ scope: 'workspace', scopeId: activeWorkspace.id, scopeName: activeWorkspace.name });
          setIsInviteMemberOpen(true);
        } else if (scope === 'team') {
          const team = teams[0];
          if (team) {
            setInviteContext({ scope: 'team', scopeId: team.id, scopeName: team.name });
            setIsInviteMemberOpen(true);
          }
        } else if (scope === 'project') {
          const projectId = useStore.getState().selectedProjectId;
          const project = projectId ? projects.find(p => p.id === projectId) : undefined;
          if (project) {
            setInviteContext({ scope: 'project', scopeId: project.id, scopeName: project.name });
            setIsInviteMemberOpen(true);
          }
        }
        clearPendingModal();
        break;
      }
      case 'renameEntity': {
        const data = pendingModal.data as { entityType: string; entityId: string } | undefined;
        if (data) {
          if (data.entityType === 'project') {
            const p = projects.find(x => x.id === data.entityId);
            if (p) { setRenameTarget({ id: p.id, name: p.name }); setIsRenameOpen(true); }
          } else if (data.entityType === 'team') {
            const t = teams.find(x => x.id === data.entityId);
            if (t) { setRenameTeamTarget({ id: t.id, name: t.name }); setIsRenameTeamOpen(true); }
          } else if (data.entityType === 'workspace') {
            setIsSettingsOpen(true);
          }
        }
        clearPendingModal();
        break;
      }
    }
  }, [pendingModal]);

  const openCreate = (parentId?: string, teamId?: string) => {
    const team = teamId ? teams.find(t => t.id === teamId) : teams[0];
    const parent = parentId ? projects.find(p => p.id === parentId) : undefined;
    if (!team) return;
    setCreateProjectContext({
      parentId,
      parentName: parent?.name,
      teamId: team.id,
      teamName: team.name,
    });
    setIsCreateOpen(true);
  };

  const openInvite = (scope: InviteContext['scope'], scopeId: string, scopeName: string) => {
    setInviteContext({ scope, scopeId, scopeName });
    setIsInviteMemberOpen(true);
  };

  const openRenameProject = (id: string, name: string) => {
    setRenameTarget({ id, name });
    setIsRenameOpen(true);
  };

  const openRenameTeam = (id: string, name: string) => {
    setRenameTeamTarget({ id, name });
    setIsRenameTeamOpen(true);
  };

  const openDeactivate = (id: string, name: string, type: DeactivateTarget['type']) => {
    setDeactivateTarget({ id, name, type });
    setIsDeactivateOpen(true);
  };

  const openSettings = () => setIsSettingsOpen(true);
  const openCreateWorkspace = () => setIsCreateWsOpen(true);
  const openCreateTeam = () => setIsCreateTeamOpen(true);

  const openTeamSettings = (teamId: string) => {
    setTeamSettingsId(teamId);
    setIsTeamSettingsOpen(true);
  };

  const openProjectSettings = (projectId: string) => {
    setProjectSettingsId(projectId);
    setIsProjectSettingsOpen(true);
  };

  const renderModals = () => (
    <>
      {createProjectContext && (
        <NewProjectModal
          key={`${createProjectContext.parentId ?? 'root'}-${createProjectContext.teamId}`}
          isOpen={isCreateOpen}
          onClose={() => { setIsCreateOpen(false); setCreateProjectContext(null); }}
          workspaceId={activeWorkspaceId ?? ''}
          teamId={createProjectContext.teamId}
          teamName={createProjectContext.teamName}
          parentId={createProjectContext.parentId}
          parentName={createProjectContext.parentName}
        />
      )}

      {renameTarget && (
        <RenameProjectModal
          isOpen={isRenameOpen}
          onClose={() => { setIsRenameOpen(false); setRenameTarget(null); }}
          projectId={renameTarget.id}
          currentName={renameTarget.name}
        />
      )}

      {renameTeamTarget && (
        <RenameTeamModal
          isOpen={isRenameTeamOpen}
          onClose={() => { setIsRenameTeamOpen(false); setRenameTeamTarget(null); }}
          teamId={renameTeamTarget.id}
          currentName={renameTeamTarget.name}
        />
      )}

      {deactivateTarget && (
        <DeactivateModal
          isOpen={isDeactivateOpen}
          onClose={() => { setIsDeactivateOpen(false); setDeactivateTarget(null); }}
          entityType={deactivateTarget.type}
          entityName={deactivateTarget.name}
          onConfirm={async () => {
            if (deactivateTarget.type === 'workspace') await deleteWorkspace(deactivateTarget.id);
            if (deactivateTarget.type === 'team') await deleteTeam(deactivateTarget.id);
            if (deactivateTarget.type === 'project') await deleteProject(deactivateTarget.id);
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
        onInviteMember={() => {
          setIsSettingsOpen(false);
          if (activeWorkspace) openInvite('workspace', activeWorkspace.id, activeWorkspace.name);
        }}
      />

      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        onClose={() => setIsCreateTeamOpen(false)}
        workspaceId={activeWorkspaceId ?? ''}
        workspaceName={activeWorkspace?.name ?? ''}
      />

      {inviteContext && (
        <InviteMemberModal
          isOpen={isInviteMemberOpen}
          onClose={() => { setIsInviteMemberOpen(false); setInviteContext(null); }}
          workspaceId={activeWorkspaceId ?? ''}
          scope={inviteContext.scope}
          scopeId={inviteContext.scopeId}
          scopeName={inviteContext.scopeName}
        />
      )}

      {teamSettingsId && (
        <TeamSettingsModal
          isOpen={isTeamSettingsOpen}
          onClose={() => { setIsTeamSettingsOpen(false); setTeamSettingsId(null); }}
          teamId={teamSettingsId}
          onSelectProject={(projectId) => {
            setIsTeamSettingsOpen(false);
            setTeamSettingsId(null);
            onSelectProject?.(projectId);
          }}
          onDeactivate={() => {
            const team = teams.find(t => t.id === teamSettingsId);
            if (team) {
              setIsTeamSettingsOpen(false);
              setTeamSettingsId(null);
              openDeactivate(team.id, team.name, 'team');
            }
          }}
        />
      )}

      {projectSettingsId && (
        <ProjectSettingsModal
          isOpen={isProjectSettingsOpen}
          onClose={() => { setIsProjectSettingsOpen(false); setProjectSettingsId(null); }}
          projectId={projectSettingsId}
          onDeactivate={() => {
            const project = projects.find(p => p.id === projectSettingsId);
            if (project) {
              setIsProjectSettingsOpen(false);
              setProjectSettingsId(null);
              openDeactivate(project.id, project.name, 'project');
            }
          }}
        />
      )}
    </>
  );

  return {
    openCreate,
    openInvite,
    openRenameProject,
    openRenameTeam,
    openDeactivate,
    openSettings,
    openCreateWorkspace,
    openCreateTeam,
    openTeamSettings,
    openProjectSettings,
    renderModals,
  };
}
