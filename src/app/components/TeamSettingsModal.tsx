import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Settings as SettingsIcon, FolderOpen, Users, AlertTriangle } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore, selectTeams, selectActiveWorkspaceId } from '../store';
import { useAuth } from '../auth/AuthProvider';
import { canManageTeams } from '../domain/workspaces';
import { BaseModal } from './BaseModal';
import { ModalSidebar } from './ui/ModalSidebar';
import type { ModalSidebarItem } from './ui/ModalSidebar';
import { ModalFooter } from './ui/ModalFooter';
import { SubmitButton } from './ui/SubmitButton';
import { GeneralTab } from './team-settings/GeneralTab';
import { ProjectsTab } from './team-settings/ProjectsTab';
import { MembersTab } from './team-settings/MembersTab';
import { DangerZoneTab } from './team-settings/DangerZoneTab';
import { api } from '../api';
import { logger } from '../logger';
import type { WorkspaceRole, TeamMembership } from '../types';

const log = logger.create('TeamSettings');

type SettingsTab = 'general' | 'projects' | 'members' | 'danger';

const TAB_CONFIG: ModalSidebarItem[] = [
  { id: 'general', label: 'General', icon: <SettingsIcon size={ICON_SIZE.sm} /> },
  { id: 'projects', label: 'Projects', icon: <FolderOpen size={ICON_SIZE.sm} /> },
  { id: 'members', label: 'Members', icon: <Users size={ICON_SIZE.sm} /> },
  { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle size={ICON_SIZE.sm} /> },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onSelectProject: (projectId: string) => void;
  onDeactivate: () => void;
}

export function TeamSettingsModal({ isOpen, onClose, teamId, onSelectProject, onDeactivate }: Props) {
  const { user } = useAuth();
  const teams = useStore(selectTeams);
  const projects = useStore(s => s.projects);
  const workspaces = useStore(s => s.workspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const members = useStore(s => s.members);
  const updateTeam = useStore(s => s.updateTeam);
  const canDeactivate = useStore(s => s.deactivationMap.teams[teamId] ?? false);

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [nameValue, setNameValue] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMembership[]>([]);

  const team = useMemo(
    () => teams.find(t => t.id === teamId),
    [teams, teamId],
  );

  const teamProjects = useMemo(
    () => projects.filter(p => p.teamId === teamId && !p.isDeleted),
    [projects, teamId],
  );

  const workspace = useMemo(
    () => workspaces.find(w => w.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId],
  );

  const currentMember = useMemo(
    () => members.find(m => m.userId === user?.id),
    [members, user?.id],
  );

  const userRole = (currentMember?.role ?? 'member') as WorkspaceRole;
  const canManage = canManageTeams(userRole);

  const creator = useMemo(() => {
    if (!team) return undefined;
    const member = members.find(m => m.userId === team.createdBy);
    const displayName = member?.displayName ?? member?.email ?? (user?.id === team.createdBy ? user.email : undefined);
    return { userId: team.createdBy, email: displayName };
  }, [team, members, user]);

  useEffect(() => {
    if (isOpen && team) {
      setNameValue(team.name);
      setNameError(null);
      setActiveTab('general');
    }
  }, [isOpen, team?.name]);

  const loadTeamMembers = useCallback(async () => {
    if (!teamId) return;
    log.info('loadTeamMembers', 'Fetching team members', { teamId });
    try {
      const data = await api.getTeamMembers(teamId);
      setTeamMembers(data);
      log.info('loadTeamMembers', 'Team members loaded', { count: data.length });
    } catch (err) {
      log.error('loadTeamMembers', 'Failed to load team members', { error: err instanceof Error ? err.message : 'Unknown' });
    }
  }, [teamId]);

  useEffect(() => {
    if (isOpen && activeTab === 'members') {
      loadTeamMembers();
    }
  }, [isOpen, activeTab, loadTeamMembers]);

  if (!team) return null;

  const nameDirty = nameValue !== team.name;

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameValue(team.name);
      setNameError(null);
      return;
    }
    if (trimmed !== team.name) {
      setIsSaving(true);
      setNameError(null);
      try {
        await updateTeam(team.id, trimmed);
      } catch {
        setNameError('Failed to rename team.');
      }
      setIsSaving(false);
    }
  };

  const handleCancelName = () => {
    setNameValue(team.name);
    setNameError(null);
  };

  const handleAddMember = async (email: string, role: string): Promise<string | undefined> => {
    log.info('handleAddMember', 'Adding team member', { teamId, role });
    try {
      await api.addTeamMember(teamId, email, role);
      await loadTeamMembers();
      return undefined;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('handleAddMember', 'Failed to add team member', { error: message });
      if (message.includes('ALREADY_MEMBER')) return 'User is already a team member.';
      if (message.includes('NOT_FOUND')) return 'No user found with that email.';
      return 'Failed to add member.';
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    log.info('handleRemoveMember', 'Removing team member', { membershipId });
    try {
      await api.removeTeamMember(membershipId);
      setTeamMembers(prev => prev.filter(m => m.id !== membershipId));
    } catch (err) {
      log.error('handleRemoveMember', 'Failed to remove team member', { error: err instanceof Error ? err.message : 'Unknown' });
    }
  };

  const handleSelectProject = (projectId: string) => {
    onClose();
    onSelectProject(projectId);
  };

  const handleDeactivate = () => {
    onClose();
    onDeactivate();
  };

  const sidebar = (
    <ModalSidebar
      items={TAB_CONFIG}
      activeId={activeTab}
      onSelect={(id) => setActiveTab(id as SettingsTab)}
    />
  );

  const generalFooter = activeTab === 'general' && nameDirty ? (
    <ModalFooter>
      <button onClick={handleCancelName} className="btn-ghost">Cancel</button>
      <SubmitButton onClick={handleSaveName} label="Save" isLoading={isSaving} />
    </ModalFooter>
  ) : undefined;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Team Settings" size="xl" sidebar={sidebar} footer={generalFooter}>
      {activeTab === 'general' && (
        <GeneralTab
          team={team}
          nameValue={nameValue}
          onNameChange={(v) => { setNameValue(v); setNameError(null); }}
          nameError={nameError}
          canManage={canManage}
        />
      )}
      {activeTab === 'projects' && (
        <ProjectsTab
          projects={teamProjects}
          onSelectProject={handleSelectProject}
        />
      )}
      {activeTab === 'members' && (
        <MembersTab
          members={teamMembers}
          currentUserId={user?.id}
          canManage={canManage}
          creator={creator}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
        />
      )}
      {activeTab === 'danger' && (
        <DangerZoneTab
          canDeactivate={canDeactivate}
          teamName={team.name}
          onDeactivate={handleDeactivate}
        />
      )}
    </BaseModal>
  );
}
