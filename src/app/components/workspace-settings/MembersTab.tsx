import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { getRoleLabel } from '../../domain/workspaces';
import { Select } from '../ui/Select';
import { PendingInvitationList } from '../PendingInvitationList';
import type { WorkspaceRole } from '../../types';

interface Member {
  id: string;
  userId: string;
  email?: string | null;
  role: string;
}

interface Team {
  id: string;
  name: string;
}

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'guest', label: 'Guest' },
];

interface MembersTabProps {
  members: Member[];
  currentUserId: string | undefined;
  canManageMembers: boolean;
  canChangeRoles: boolean;
  invitations: any[];
  teams: Team[];
  onInviteMember: () => void;
  onUpdateRole: (memberId: string, role: string) => void;
  onRemoveMember: (memberId: string) => void;
  onCancelInvitation: (id: string) => void;
}

export function MembersTab({
  members,
  currentUserId,
  canManageMembers: canManage,
  canChangeRoles: canEditRoles,
  invitations,
  teams,
  onInviteMember,
  onUpdateRole,
  onRemoveMember,
  onCancelInvitation,
}: MembersTabProps) {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-label-upper text-text-tertiary">
          Members ({members.length})
        </span>
        {canManage && (
          <button
            onClick={onInviteMember}
            className="flex items-center gap-1.5 text-label text-text-tertiary hover:text-text-primary transition-colors"
          >
            <Plus size={ICON_SIZE.sm} />
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
                <span className="text-label text-text-primary">
                  {(member.email ?? '?')[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-caption-lg text-text-primary truncate">
                  {member.email ?? 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canEditRoles && member.userId !== currentUserId ? (
                <Select
                  value={member.role}
                  onChange={(role) => onUpdateRole(member.id, role)}
                  options={ROLE_OPTIONS}
                />
              ) : (
                <span className="text-label text-text-tertiary px-2 py-1 bg-surface-frost-04 rounded-pill">
                  {getRoleLabel(member.role as WorkspaceRole)}
                </span>
              )}

              {canManage && member.userId !== currentUserId && (
                <button
                  onClick={() => onRemoveMember(member.id)}
                  className="p-1 text-text-quaternary hover:text-status-error transition-colors rounded-standard"
                  title="Remove member"
                >
                  <Trash2 size={ICON_SIZE.xs} />
                </button>
              )}
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <p className="text-caption-lg text-text-empty text-center py-6">No members found.</p>
        )}
      </div>

      <PendingInvitationList
        invitations={invitations}
        teams={teams}
        canManage={canManage}
        onCancel={onCancelInvitation}
      />
    </div>
  );
}
