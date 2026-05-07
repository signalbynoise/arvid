import React from 'react';
import { X, Clock } from 'lucide-react';
import type { Invitation, Team } from '../types';
import { getRoleLabel } from '../domain/workspaces';
import { getScopeLabel } from '../domain/access';
import type { WorkspaceRole } from '../types';
import type { AccessScope } from '../domain/access';

interface PendingInvitationListProps {
  invitations: Invitation[];
  teams: Team[];
  canManage: boolean;
  onCancel: (id: string) => void;
}

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PendingInvitationList({ invitations, teams, canManage, onCancel }: PendingInvitationListProps) {
  if (invitations.length === 0) return null;

  const teamNameMap = new Map(teams.map(t => [t.id, t.name]));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Clock size={12} className="text-text-quaternary" />
        <span className="text-[12px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">
          Pending Invitations ({invitations.length})
        </span>
      </div>

      <div className="space-y-1">
        {invitations.map(invite => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-3 rounded-card border border-dashed border-border-default bg-surface-frost-02"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-7 w-7 rounded-full border border-dashed border-border-default flex items-center justify-center shrink-0">
                <span className="text-[11px] font-[var(--fw-medium)] text-text-quaternary">
                  {invite.email[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] text-text-secondary truncate">{invite.email}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {invite.scope && invite.scope !== 'workspace' && (
                    <span className="text-[11px] text-text-quaternary">
                      {getScopeLabel(invite.scope as AccessScope)}
                    </span>
                  )}
                  {invite.teamId && (
                    <span className="text-[11px] text-text-quaternary">
                      {teamNameMap.get(invite.teamId) ?? 'Unknown team'}
                    </span>
                  )}
                  <span className="text-[11px] text-text-empty">
                    {formatRelativeDate(invite.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12px] font-[var(--fw-medium)] text-text-quaternary px-2 py-1 bg-surface-frost-04 rounded-pill">
                {getRoleLabel(invite.role as WorkspaceRole)}
              </span>

              {canManage && (
                <button
                  onClick={() => onCancel(invite.id)}
                  className="p-1 text-text-quaternary hover:text-status-error transition-colors rounded-standard"
                  title="Cancel invitation"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
