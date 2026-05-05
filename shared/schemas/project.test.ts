import { describe, it, expect } from 'vitest';
import { ProjectRowSchema, ProjectSchema, CreateProjectBodySchema, UpdateProjectBodySchema } from './project';

describe('ProjectRowSchema', () => {
  const validRow = {
    id: 'p1',
    name: 'Platform Migration',
    parent_id: null,
    created_at: '2026-05-03T13:57:19.947Z',
  };

  it('accepts a valid project row', () => {
    const result = ProjectRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it('accepts a row with a parent_id', () => {
    const row = { ...validRow, parent_id: 'p0' };
    const result = ProjectRowSchema.safeParse(row);
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const { name, ...noName } = validRow;
    const result = ProjectRowSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });
});

describe('ProjectSchema (transform)', () => {
  it('transforms snake_case to camelCase', () => {
    const row = { id: 'p1', name: 'Test', parent_id: 'p0', created_at: '2026-01-01', short_id: 'P01', linear_project_id: 'lp-1', linear_project_name: 'My Linear Project', linear_team_id: 'lt-1' };
    const result = ProjectSchema.parse(row);
    expect(result.parentId).toBe('p0');
    expect(result.createdAt).toBe('2026-01-01');
    expect(result.shortId).toBe('P01');
    expect(result.linearProjectId).toBe('lp-1');
    expect(result.linearProjectName).toBe('My Linear Project');
    expect(result.linearTeamId).toBe('lt-1');
  });

  it('transforms null parent_id to undefined', () => {
    const row = { id: 'p1', name: 'Test', parent_id: null, created_at: null };
    const result = ProjectSchema.parse(row);
    expect(result.parentId).toBeUndefined();
    expect(result.createdAt).toBeUndefined();
    expect(result.shortId).toBeUndefined();
  });
});

describe('CreateProjectBodySchema', () => {
  it('accepts a valid body with name only', () => {
    const result = CreateProjectBodySchema.safeParse({ name: 'New Project' });
    expect(result.success).toBe(true);
  });

  it('accepts a body with parent_id', () => {
    const result = CreateProjectBodySchema.safeParse({ name: 'Sub', parent_id: 'p1' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = CreateProjectBodySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateProjectBodySchema', () => {
  it('accepts a name update', () => {
    const result = UpdateProjectBodySchema.safeParse({ name: 'Renamed' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty object', () => {
    const result = UpdateProjectBodySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
