import { describe, it, expect } from 'vitest';
import { isInvitationExpired, isInvitationPending, getInvitationStatusLabel, canSendInvitation } from './invitations';
import type { Invitation, InvitationStatus } from '../types';

function makeInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: 'inv-1',
    workspaceId: 'ws-1',
    email: 'test@example.com',
    role: 'member',
    status: 'pending',
    invitedBy: 'user-1',
    createdAt: '2026-05-06T20:00:00Z',
    expiresAt: '2026-05-13T20:00:00Z',
    ...overrides,
  };
}

describe('isInvitationExpired', () => {
  it('returns false for a future expiration date', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(isInvitationExpired(future)).toBe(false);
  });

  it('returns true for a past expiration date', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(isInvitationExpired(past)).toBe(true);
  });
});

describe('isInvitationPending', () => {
  it('returns true for a pending invitation with future expiry', () => {
    const invite = makeInvitation({
      status: 'pending',
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(isInvitationPending(invite)).toBe(true);
  });

  it('returns false for an accepted invitation', () => {
    const invite = makeInvitation({
      status: 'accepted',
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(isInvitationPending(invite)).toBe(false);
  });

  it('returns false for a pending but expired invitation', () => {
    const invite = makeInvitation({
      status: 'pending',
      expiresAt: new Date(Date.now() - 86_400_000).toISOString(),
    });
    expect(isInvitationPending(invite)).toBe(false);
  });

  it('returns false for an expired-status invitation', () => {
    const invite = makeInvitation({ status: 'expired' });
    expect(isInvitationPending(invite)).toBe(false);
  });
});

describe('getInvitationStatusLabel', () => {
  it('returns correct labels for all statuses', () => {
    expect(getInvitationStatusLabel('pending')).toBe('Pending');
    expect(getInvitationStatusLabel('accepted')).toBe('Accepted');
    expect(getInvitationStatusLabel('expired')).toBe('Expired');
  });
});

describe('canSendInvitation', () => {
  it('allows owners to send invitations', () => {
    expect(canSendInvitation('owner')).toBe(true);
  });

  it('allows admins to send invitations', () => {
    expect(canSendInvitation('admin')).toBe(true);
  });

  it('prevents members from sending invitations', () => {
    expect(canSendInvitation('member')).toBe(false);
  });
});
