import { describe, it, expect } from 'vitest';
import { InvitationRowSchema, InvitationSchema, CreateInvitationBodySchema, InvitationStatusEnum } from './invitation';

const VALID_UUID = '2acc6fc4-6099-4390-9285-60682eb0fcd5';
const VALID_UUID_2 = '5624236d-e02e-48ee-a9f3-5849d6a2321a';

describe('InvitationStatusEnum', () => {
  it('accepts valid statuses', () => {
    expect(InvitationStatusEnum.safeParse('pending').success).toBe(true);
    expect(InvitationStatusEnum.safeParse('accepted').success).toBe(true);
    expect(InvitationStatusEnum.safeParse('expired').success).toBe(true);
  });

  it('rejects invalid statuses', () => {
    expect(InvitationStatusEnum.safeParse('cancelled').success).toBe(false);
    expect(InvitationStatusEnum.safeParse('').success).toBe(false);
  });
});

describe('InvitationRowSchema', () => {
  const validRow = {
    id: VALID_UUID,
    workspace_id: VALID_UUID,
    team_id: VALID_UUID_2,
    email: 'test@example.com',
    role: 'member' as const,
    status: 'pending' as const,
    invited_by: VALID_UUID,
    created_at: '2026-05-06T20:00:00Z',
    expires_at: '2026-05-13T20:00:00Z',
  };

  it('accepts a valid invitation row', () => {
    const result = InvitationRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it('accepts null team_id', () => {
    const result = InvitationRowSchema.safeParse({ ...validRow, team_id: null });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format in row', () => {
    const result = InvitationRowSchema.safeParse({ ...validRow, email: '' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = InvitationRowSchema.safeParse({ ...validRow, role: 'owner' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = InvitationRowSchema.safeParse({ ...validRow, status: 'cancelled' });
    expect(result.success).toBe(false);
  });
});

describe('InvitationSchema (transform)', () => {
  const validRow = {
    id: VALID_UUID,
    workspace_id: VALID_UUID,
    team_id: VALID_UUID_2,
    email: 'test@example.com',
    role: 'admin' as const,
    status: 'pending' as const,
    invited_by: VALID_UUID,
    created_at: '2026-05-06T20:00:00Z',
    expires_at: '2026-05-13T20:00:00Z',
  };

  it('transforms snake_case to camelCase', () => {
    const result = InvitationSchema.parse(validRow);
    expect(result.workspaceId).toBe(VALID_UUID);
    expect(result.teamId).toBe(VALID_UUID_2);
    expect(result.invitedBy).toBe(VALID_UUID);
    expect(result.createdAt).toBe('2026-05-06T20:00:00Z');
    expect(result.expiresAt).toBe('2026-05-13T20:00:00Z');
  });

  it('transforms null team_id to undefined', () => {
    const result = InvitationSchema.parse({ ...validRow, team_id: null });
    expect(result.teamId).toBeUndefined();
  });
});

describe('CreateInvitationBodySchema', () => {
  it('accepts a valid body', () => {
    const result = CreateInvitationBodySchema.safeParse({
      workspace_id: VALID_UUID,
      email: 'invite@example.com',
      role: 'member',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a body with team_id', () => {
    const result = CreateInvitationBodySchema.safeParse({
      workspace_id: VALID_UUID,
      team_id: VALID_UUID_2,
      email: 'invite@example.com',
      role: 'admin',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = CreateInvitationBodySchema.safeParse({
      workspace_id: VALID_UUID,
      email: 'not-an-email',
      role: 'member',
    });
    expect(result.success).toBe(false);
  });

  it('rejects owner role', () => {
    const result = CreateInvitationBodySchema.safeParse({
      workspace_id: VALID_UUID,
      email: 'invite@example.com',
      role: 'owner',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid workspace_id', () => {
    const result = CreateInvitationBodySchema.safeParse({
      workspace_id: 'not-a-uuid',
      email: 'invite@example.com',
      role: 'member',
    });
    expect(result.success).toBe(false);
  });
});
