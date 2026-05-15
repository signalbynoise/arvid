import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Settings as SettingsIcon, Plug, Users, AlertTriangle } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore, selectTeams, selectActiveWorkspaceId } from '../store';
import { useAuth } from '../auth/AuthProvider';
import { canManageProject } from '../domain/access';
import { BaseModal } from './BaseModal';
import { ModalSidebar } from './ui/ModalSidebar';
import type { ModalSidebarItem } from './ui/ModalSidebar';
import { ModalFooter } from './ui/ModalFooter';
import { SubmitButton } from './ui/SubmitButton';
import { GeneralTab } from './project-settings/GeneralTab';
import { IntegrationsTab } from './project-settings/IntegrationsTab';
import { MembersTab } from './project-settings/MembersTab';
import { DangerZoneTab } from './project-settings/DangerZoneTab';
import { api } from '../api';
import { logger } from '../logger';
import type { WorkspaceRole, ProjectMembership } from '../types';

const log = logger.create('ProjectSettings');

type SettingsTab = 'general' | 'integrations' | 'members' | 'danger';

const TAB_CONFIG: ModalSidebarItem[] = [
  { id: 'general', label: 'General', icon: <SettingsIcon size={ICON_SIZE.sm} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={ICON_SIZE.sm} /> },
  { id: 'members', label: 'Members', icon: <Users size={ICON_SIZE.sm} /> },
  { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle size={ICON_SIZE.sm} /> },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onDeactivate: () => void;
}

export function ProjectSettingsModal({ isOpen, onClose, projectId, onDeactivate }: Props) {
  const { user } = useAuth();
  const projects = useStore(s => s.projects);
  const teams = useStore(selectTeams);
  const workspaces = useStore(s => s.workspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const members = useStore(s => s.members);
  const updateProject = useStore(s => s.updateProject);
  const canDeactivate = useStore(s => s.deactivationMap.projects[projectId] ?? false);

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [nameValue, setNameValue] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMembership[]>([]);

  const project = useMemo(
    () => projects.find(p => p.id === projectId),
    [projects, projectId],
  );

  const parentProject = useMemo(
    () => project?.parentId ? projects.find(p => p.id === project.parentId) : undefined,
    [projects, project?.parentId],
  );

  const team = useMemo(
    () => project?.teamId ? teams.find(t => t.id === project.teamId) : undefined,
    [teams, project?.teamId],
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
  const canManage = canManageProject(userRole);

  useEffect(() => {
    if (isOpen && project) {
      setNameValue(project.name);
      setNameError(null);
      setActiveTab('general');
    }
  }, [isOpen, project?.name]);

  const loadProjectMembers = useCallback(async () => {
    if (!projectId) return;
    log.info('loadProjectMembers', 'Fetching project members', { projectId });
    try {
      const data = await api.getProjectMembers(projectId);
      setProjectMembers(data);
      log.info('loadProjectMembers', 'Project members loaded', { count: data.length });
    } catch (err) {
      log.error('loadProjectMembers', 'Failed to load project members', { error: err instanceof Error ? err.message : 'Unknown' });
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen && activeTab === 'members') {
      loadProjectMembers();
    }
  }, [isOpen, activeTab, loadProjectMembers]);

  if (!project) return null;

  const nameDirty = nameValue !== project.name;

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameValue(project.name);
      setNameError(null);
      return;
    }
    if (trimmed !== project.name) {
      setIsSaving(true);
      setNameError(null);
      try {
        await updateProject(project.id, trimmed);
      } catch {
        setNameError('Failed to rename project.');
      }
      setIsSaving(false);
    }
  };

  const handleCancelName = () => {
    setNameValue(project.name);
    setNameError(null);
  };

  const handleAddMember = async (email: string, role: string): Promise<string | undefined> => {
    log.info('handleAddMember', 'Adding project member', { projectId, role });
    try {
      await api.addProjectMember(projectId, email, role);
      await loadProjectMembers();
      return undefined;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('handleAddMember', 'Failed to add project member', { error: message });
      if (message.includes('ALREADY_MEMBER')) return 'User is already a project member.';
      if (message.includes('NOT_FOUND')) return 'No user found with that email.';
      return 'Failed to add member.';
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    log.info('handleRemoveMember', 'Removing project member', { membershipId });
    try {
      await api.removeProjectMember(membershipId);
      setProjectMembers(prev => prev.filter(m => m.id !== membershipId));
    } catch (err) {
      log.error('handleRemoveMember', 'Failed to remove project member', { error: err instanceof Error ? err.message : 'Unknown' });
    }
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
    <BaseModal isOpen={isOpen} onClose={onClose} title="Project Settings" size="xl" sidebar={sidebar} footer={generalFooter}>
      {activeTab === 'general' && (
        <GeneralTab
          project={project}
          nameValue={nameValue}
          onNameChange={(v) => { setNameValue(v); setNameError(null); }}
          nameError={nameError}
          canManage={canManage}
          parentProject={parentProject}
          team={team}
        />
      )}
      {activeTab === 'integrations' && (
        <IntegrationsTab project={project} />
      )}
      {activeTab === 'members' && (
        <MembersTab
          members={projectMembers}
          currentUserId={user?.id}
          canManage={canManage}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
        />
      )}
      {activeTab === 'danger' && (
        <DangerZoneTab
          canDeactivate={canDeactivate}
          projectName={project.name}
          onDeactivate={handleDeactivate}
        />
      )}
    </BaseModal>
  );
}
