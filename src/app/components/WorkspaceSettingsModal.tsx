import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Pencil, Users, Layers, Settings as SettingsIcon, Upload, LoaderPinwheel, Loader2, X } from 'lucide-react';
import { useStore, selectWorkspaces, selectActiveWorkspaceId, selectTeams, selectMembers, selectInvitations } from '../store';
import { useAuth } from '../auth/AuthProvider';
import { getRoleLabel, canManageTeams, canManageMembers, canChangeRoles, canDeleteWorkspace } from '../domain/workspaces';
import { BaseModal } from './BaseModal';
import { PendingInvitationList } from './PendingInvitationList';
import { supabase } from '../lib/supabase';
import { logger } from '../logger';
import type { WorkspaceRole } from '../types';

const settingsLog = logger.create('WorkspaceSettings');

type SettingsTab = 'general' | 'teams' | 'members';

const TAB_CONFIG: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <SettingsIcon size={14} /> },
  { id: 'teams', label: 'Teams', icon: <Layers size={14} /> },
  { id: 'members', label: 'Members', icon: <Users size={14} /> },
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
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamNameValue, setTeamNameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    if (workspace) setNameValue(workspace.name);
  }, [workspace]);

  if (!workspace) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspace) return;

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
    if (!workspace) return;
    settingsLog.info('handleRemoveLogo', 'Removing workspace logo', { workspaceId: workspace.id });
    await updateWorkspace(workspace.id, { logoUrl: null });
  };

  const [nameError, setNameError] = useState<string | null>(null);

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== workspace.name) {
      setNameError(null);
      const error = await updateWorkspace(workspace.id, { name: trimmed });
      if (error) {
        setNameError(error.includes('already exists') ? 'A workspace with this name already exists.' : 'Failed to rename workspace.');
        return;
      }
    }
    setEditingName(false);
    setNameError(null);
  };

  const handleSaveTeamName = async (teamId: string) => {
    const trimmed = teamNameValue.trim();
    if (trimmed) {
      await updateTeam(teamId, trimmed);
    }
    setEditingTeamId(null);
    setTeamNameValue('');
  };

  const handleDeleteWorkspace = async () => {
    await deleteWorkspace(workspace.id);
    onClose();
  };

  const renderGeneralTab = () => (
    <div className="p-5 space-y-8">
      <div className="space-y-3">
        <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
          Logo
        </label>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-card bg-surface-frost-04 border border-border-default flex items-center justify-center overflow-hidden shrink-0">
            {workspace.logoUrl ? (
              <img src={workspace.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <LoaderPinwheel size={24} className="text-text-quaternary" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {canManageTeams(userRole) && (
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="btn-ghost flex items-center gap-1.5"
              >
                {logoUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>{logoUploading ? 'Uploading...' : 'Upload'}</span>
              </button>
            )}
            {workspace.logoUrl && canManageTeams(userRole) && (
              <button
                onClick={handleRemoveLogo}
                className="p-1.5 text-text-quaternary hover:text-status-error transition-colors rounded-standard"
                title="Remove logo"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-text-empty">PNG, JPG, WebP or SVG. Max 2 MB.</p>
      </div>

      <div className="space-y-3">
        <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
          Workspace Name
        </label>
        {editingName ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => { setNameValue(e.target.value); setNameError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditingName(false); setNameError(null); } }}
                autoFocus
                className={`flex-1 bg-surface-frost-02 border rounded-comfortable px-3 py-2 text-[14px] text-text-primary focus:outline-none transition-all ${nameError ? 'border-status-error' : 'border-border-default focus:border-border-focus'}`}
              />
              <button onClick={handleSaveName} className="btn-primary">
                Save
              </button>
              <button onClick={() => { setEditingName(false); setNameError(null); }} className="btn-ghost">
                Cancel
              </button>
            </div>
            {nameError && (
              <p className="text-[12px] text-status-error">{nameError}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-text-primary">{workspace.name}</span>
            {canManageTeams(userRole) && (
              <button onClick={() => setEditingName(true)} className="text-text-quaternary hover:text-text-secondary transition-colors">
                <Pencil size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
          Slug
        </label>
        <span className="block text-[14px] text-text-secondary font-mono">{workspace.slug}</span>
      </div>

      {(() => {
        const isLastWorkspace = workspaces.length <= 1;
        const isPersonalWorkspace = workspace.createdBy === user?.id;
        const canLeave = userRole !== 'owner' && currentMember && !isLastWorkspace;
        const canDelete = canDeleteWorkspace(userRole) && !isLastWorkspace && !isPersonalWorkspace;

        if (!canLeave && !canDelete) return null;

        return (
          <div className="pt-4 border-t border-border-subtle space-y-3">
            <h3 className="text-[13px] font-[var(--fw-medium)] text-status-error">Danger Zone</h3>

            {canLeave && (
              confirmLeave ? (
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-text-secondary">You will lose access to this workspace and its projects.</span>
                  <button
                    onClick={async () => {
                      const success = await leaveWorkspace(workspace.id, currentMember!.id);
                      if (success) onClose();
                    }}
                    className="btn-primary shrink-0"
                  >
                    Confirm
                  </button>
                  <button onClick={() => setConfirmLeave(false)} className="btn-ghost shrink-0">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmLeave(true)} className="btn-primary">
                  Leave workspace
                </button>
              )
            )}

            {canDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-text-secondary">This will archive the workspace and all its teams and projects.</span>
                  <button onClick={handleDeleteWorkspace} className="btn-primary shrink-0">
                    Confirm
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="btn-ghost shrink-0">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="btn-primary">
                  Delete workspace
                </button>
              )
            )}
          </div>
        );
      })()}
    </div>
  );

  const renderTeamsTab = () => (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
          Teams ({teams.length})
        </span>
        {canManageTeams(userRole) && (
          <button onClick={onCreateTeam} className="flex items-center gap-1.5 text-[12px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors">
            <Plus size={14} />
            <span>Add team</span>
          </button>
        )}
      </div>

      <div className="space-y-1">
        {teams.map(team => (
          <div
            key={team.id}
            className="flex items-center justify-between p-3 rounded-card bg-surface-frost-02 border border-border-default"
          >
            {editingTeamId === team.id ? (
              <div className="flex gap-2 flex-1 mr-2">
                <input
                  type="text"
                  value={teamNameValue}
                  onChange={(e) => setTeamNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTeamName(team.id); if (e.key === 'Escape') setEditingTeamId(null); }}
                  autoFocus
                  className="flex-1 bg-surface-frost-04 border border-border-default rounded-comfortable px-2 py-1 text-[13px] text-text-primary focus:outline-none focus:border-border-focus transition-all"
                />
                <button onClick={() => handleSaveTeamName(team.id)} className="text-[12px] text-text-secondary hover:text-text-primary">Save</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-[var(--fw-medium)] text-text-primary">{team.name}</span>
                <span className="text-[11px] text-text-quaternary">
                  {projectCountByTeam.get(team.id) ?? 0} projects
                </span>
              </div>
            )}

            {canManageTeams(userRole) && editingTeamId !== team.id && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditingTeamId(team.id); setTeamNameValue(team.name); }}
                  className="p-1 text-text-quaternary hover:text-text-secondary transition-colors rounded-standard"
                  title="Rename team"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => deleteTeam(team.id)}
                  className="p-1 text-text-quaternary hover:text-status-error transition-colors rounded-standard"
                  title="Delete team"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        ))}

        {teams.length === 0 && (
          <p className="text-[13px] text-text-empty text-center py-6">No teams yet.</p>
        )}
      </div>
    </div>
  );

  const renderMembersTab = () => (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
          Members ({members.length})
        </span>
        {canManageMembers(userRole) && (
          <button onClick={onInviteMember} className="flex items-center gap-1.5 text-[12px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors">
            <Plus size={14} />
            <span>Invite</span>
          </button>
        )}
      </div>

      <div className="space-y-1">
        {members.map(member => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-card bg-surface-frost-02 border border-border-default"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-7 w-7 rounded-full bg-surface-frost-08 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-[var(--fw-medium)] text-text-primary">
                  {(member.email ?? '?')[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] text-text-primary truncate">{member.email ?? 'Unknown'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canChangeRoles(userRole) && member.userId !== user?.id ? (
                <select
                  value={member.role}
                  onChange={(e) => updateMemberRole(member.id, e.target.value)}
                  className="bg-surface-frost-04 border border-border-default rounded-comfortable px-2 py-1 text-[12px] text-text-secondary focus:outline-none focus:border-border-focus appearance-none cursor-pointer"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              ) : (
                <span className="text-[12px] font-[var(--fw-medium)] text-text-tertiary px-2 py-1 bg-surface-frost-04 rounded-pill">
                  {getRoleLabel(member.role as WorkspaceRole)}
                </span>
              )}

              {canManageMembers(userRole) && member.userId !== user?.id && (
                <button
                  onClick={() => removeMember(member.id)}
                  className="p-1 text-text-quaternary hover:text-status-error transition-colors rounded-standard"
                  title="Remove member"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <p className="text-[13px] text-text-empty text-center py-6">No members found.</p>
        )}
      </div>

      <PendingInvitationList
        invitations={invitations}
        teams={teams}
        canManage={canManageMembers(userRole)}
        onCancel={cancelInvitation}
      />
    </div>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Workspace Settings" size="xl">
      <div className="flex min-h-[400px]">
        <nav className="w-[160px] border-r border-border-subtle p-2 shrink-0">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-comfortable text-[13px] font-[var(--fw-medium)] transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-surface-frost-08 text-text-primary'
                  : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'teams' && renderTeamsTab()}
          {activeTab === 'members' && renderMembersTab()}
        </div>
      </div>
    </BaseModal>
  );
}
