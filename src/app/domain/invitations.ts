import type { Invitation, InvitationStatus, WorkspaceRole } from '../types';
import { hasMinimumRole } from './workspaces';

export function isInvitationExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

export function isInvitationPending(invitation: Invitation): boolean {
  return invitation.status === 'pending' && !isInvitationExpired(invitation.expiresAt);
}

const STATUS_LABELS: Record<InvitationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
};

export function getInvitationStatusLabel(status: InvitationStatus): string {
  return STATUS_LABELS[status];
}

export function canSendInvitation(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, 'admin');
}
