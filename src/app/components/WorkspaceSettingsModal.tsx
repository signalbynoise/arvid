import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Users, Layers, Settings as SettingsIcon } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore, selectWorkspaces, selectActiveWorkspaceId, selectTeams, selectMembers, selectInvitations } from '../store';
import { useAuth } from '../auth/AuthProvider';
import { canManageTeams, canManageMembers, canChangeRoles as canChangeRolesFn, canDeleteWorkspace } from '../domain/workspaces';
import { BaseModal } from './BaseModal';
import { ModalSidebar } from './ui/ModalSidebar';
import type { ModalSidebarItem } from './ui/ModalSidebar';
import { ModalFooter } from './ui/ModalFooter';
import { SubmitButton } from './ui/SubmitButton';
import { GeneralTab } from './workspace-settings/GeneralTab';
import { TeamsTab } from './workspace-settings/TeamsTab';
import { MembersTab } from './workspace-settings/MembersTab';
import { supabase } from '../lib/supabase';
import { logger } from '../logger';
import type { WorkspaceRole } from '../types';

const settingsLog = logger.create('WorkspaceSettings');

type SettingsTab = 'general' | 'teams' | 'members';

const TAB_CONFIG: ModalSidebarItem[] = [
  { id: 'general', label: 'General', icon: <SettingsIcon size={ICON_SIZE.sm} /> },
  { id: 'teams', label: 'Teams', icon: <Layers size={ICON_SIZE.sm} /> },
  { id: 'members', label: 'Members', icon: <Users size={ICON_SIZE.sm} /> },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: () => void;
  onInviteMember: () => void;
}

export function WorkspaceSettingsModal({ isOpen, onClose, onCreateTeam, onInviteMember }: Props) {
  const { user } = useAuth();
  const workspaces = useStore(selectWorkspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const teams = useStore(selectTeams);
  const members = useStore(selectMembers);
  const projects = useStore(s => s.projects);
  const updateWorkspace = useStore(s => s.updateWorkspace);
  const deleteWorkspace = useStore(s => s.deleteWorkspace);
  const updateTeam = useStore(s => s.updateTeam);
  const deleteTeam = useStore(s => s.deleteTeam);
  const updateMemberRole = useStore(s => s.updateMemberRole);
  const removeMember = useStore(s => s.removeMember);
  const loadTeams = useStore(s => s.loadTeams);
  const loadMembers = useStore(s => s.loadMembers);
  const invitations = useStore(selectInvitations);
  const loadInvitations = useStore(s => s.loadInvitations);
  const cancelInvitation = useStore(s => s.cancelInvitation);
  const leaveWorkspace = useStore(s => s.leaveWorkspace);

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [nameValue, setNameValue] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const workspace = useMemo(
    () => workspaces.find(w => w.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId],
  );

  const currentMember = useMemo(
    () => members.find(m => m.userId === user?.id),
    [members, user?.id],
  );

  const userRole = (currentMember?.role ?? 'member') as WorkspaceRole;

  const projectCountByTeam = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      if (p.teamId && !p.isDeleted) {
        counts.set(p.teamId, (counts.get(p.teamId) ?? 0) + 1);
      }
    }
    return counts;
  }, [projects]);

  useEffect(() => {
    if (isOpen && activeWorkspaceId) {
      loadTeams(activeWorkspaceId);
      loadMembers(activeWorkspaceId);
      loadInvitations(activeWorkspaceId);
    }
  }, [isOpen, activeWorkspaceId, loadTeams, loadMembers, loadInvitations]);

  useEffect(() => {
    if (workspace) {
      setNameValue(workspace.name);
      setNameError(null);
    }
  }, [workspace?.name]);

  if (!workspace) return null;

  const nameDirty = nameValue !== workspace.name;

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameValue(workspace.name);
      setNameError(null);
      return;
    }
    if (trimmed !== workspace.name) {
      setIsSaving(true);
      setNameError(null);
      const error = await updateWorkspace(workspace.id, { name: trimmed });
      setIsSaving(false);
      if (error) {
        setNameError(
          typeof error === 'string' && error.includes('already exists')
            ? 'A workspace with this name already exists.'
            : 'Failed to rename workspace.',
        );
      }
    }
  };

  const handleCancelName = () => {
    setNameValue(workspace.name);
    setNameError(null);
  };

  const isLastWorkspace = workspaces.length <= 1;
  const isPersonalWorkspace = workspace.createdBy === user?.id;
  const computedCanLeave = userRole !== 'owner' && !!currentMember && !isLastWorkspace;
  const computedCanDelete = canDeleteWorkspace(userRole) && !isLastWorkspace && !isPersonalWorkspace;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    settingsLog.info('handleLogoUpload', 'Uploading workspace logo', { workspaceId: workspace.id, size: file.size });

    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `${workspace.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('workspace-logos')
        .upload(path, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('workspace-logos')
        .getPublicUrl(path);

      await updateWorkspace(workspace.id, { logoUrl: publicUrl });
      settingsLog.info('handleLogoUpload', 'Logo uploaded', { publicUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      settingsLog.error('handleLogoUpload', 'Failed to upload logo', { error: message });
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    settingsLog.info('handleRemoveLogo', 'Removing workspace logo', { workspaceId: workspace.id });
    await updateWorkspace(workspace.id, { logoUrl: null });
  };

  const handleLeaveWorkspace = async () => {
    if (currentMember) {
      const success = await leaveWorkspace(workspace.id, currentMember.id);
      if (success) onClose();
    }
  };

  const handleDeleteWorkspace = async () => {
    await deleteWorkspace(workspace.id);
    onClose();
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
    <BaseModal isOpen={isOpen} onClose={onClose} title="Workspace Settings" size="xl" sidebar={sidebar} footer={generalFooter}>
      {activeTab === 'general' && (
        <GeneralTab
          workspace={workspace}
          userRole={userRole}
          nameValue={nameValue}
          onNameChange={(v) => { setNameValue(v); setNameError(null); }}
          nameError={nameError}
          logoInputRef={logoInputRef}
          logoUploading={logoUploading}
          onLogoUpload={handleLogoUpload}
          onRemoveLogo={handleRemoveLogo}
          canLeave={computedCanLeave}
          canDelete={computedCanDelete}
          onLeaveWorkspace={handleLeaveWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
        />
      )}
      {activeTab === 'teams' && (
        <TeamsTab
          teams={teams}
          projectCountByTeam={projectCountByTeam}
          canManage={canManageTeams(userRole)}
          onCreateTeam={onCreateTeam}
          onRenameTeam={updateTeam}
          onDeleteTeam={deleteTeam}
        />
      )}
      {activeTab === 'members' && (
        <MembersTab
          members={members}
          currentUserId={user?.id}
          canManageMembers={canManageMembers(userRole)}
          canChangeRoles={canChangeRolesFn(userRole)}
          invitations={invitations}
          teams={teams}
          onInviteMember={onInviteMember}
          onUpdateRole={updateMemberRole}
          onRemoveMember={removeMember}
          onCancelInvitation={cancelInvitation}
        />
      )}
    </BaseModal>
  );
}
