import React, { useState } from 'react';
import { useStore, selectActiveWorkspaceId } from '../../store';
import { NewProjectModal } from '../NewProjectModal';
import { RenameProjectModal } from '../RenameProjectModal';
import { RenameTeamModal } from '../RenameTeamModal';
import { DeactivateModal } from '../DeactivateModal';
import { CreateWorkspaceModal } from '../CreateWorkspaceModal';
import { WorkspaceSettingsModal } from '../WorkspaceSettingsModal';
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

  const renderModals = () => (
    <>
      {createProjectContext && (
        <NewProjectModal
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
    renderModals,
  };
}
