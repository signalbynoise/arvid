import { describe, it, expect } from 'vitest';
import { SlackConnectionRowSchema, SlackConnectionSchema } from './slackConnection';

describe('SlackConnectionRowSchema', () => {
  const validRow = {
    user_id: 'u-1',
    team_id: 'T123',
    team_name: 'My Workspace',
    authed_user_id: 'U456',
    bot_user_id: 'B789',
    scopes: 'channels:read,chat:write',
    connected_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  };

  it('accepts a valid row', () => {
    const result = SlackConnectionRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it('accepts null bot_user_id', () => {
    const result = SlackConnectionRowSchema.safeParse({ ...validRow, bot_user_id: null });
    expect(result.success).toBe(true);
  });

  it('rejects missing team_id', () => {
    const { team_id, ...noTeam } = validRow;
    const result = SlackConnectionRowSchema.safeParse(noTeam);
    expect(result.success).toBe(false);
  });
});

describe('SlackConnectionSchema (transform)', () => {
  it('transforms snake_case to camelCase', () => {
    const row = {
      user_id: 'u-1',
      team_id: 'T123',
      team_name: 'Workspace',
      authed_user_id: 'U456',
      bot_user_id: 'B789',
      scopes: 'channels:read',
      connected_at: '2026-05-01',
      updated_at: '2026-05-01',
    };
    const result = SlackConnectionSchema.parse(row);
    expect(result.teamId).toBe('T123');
    expect(result.teamName).toBe('Workspace');
    expect(result.authedUserId).toBe('U456');
    expect(result.botUserId).toBe('B789');
  });

  it('transforms null bot_user_id to undefined', () => {
    const row = {
      user_id: 'u-1',
      team_id: 'T123',
      team_name: 'Workspace',
      authed_user_id: 'U456',
      bot_user_id: null,
      scopes: '',
      connected_at: '2026-05-01',
      updated_at: '2026-05-01',
    };
    const result = SlackConnectionSchema.parse(row);
    expect(result.botUserId).toBeUndefined();
  });
});
