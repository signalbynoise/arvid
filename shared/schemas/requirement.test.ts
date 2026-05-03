import { describe, it, expect } from 'vitest';
import { RequirementRowSchema, RequirementSchema, CreateRequirementBodySchema } from './requirement';

describe('RequirementRowSchema', () => {
  const validRow = {
    id: 'r1',
    title: 'Access Review Automation',
    source: 'Product',
    owner: 'Alice',
    owner_team: 'Engineering',
    owner_role: 'PM',
    created_at: '2026-01-15',
    description: 'Automate SOC2 access reviews',
    completeness: 75,
    clarity: 'High',
    risk: 'Low',
  };

  it('accepts a valid requirement row', () => {
    const result = RequirementRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it('accepts nullable optional fields as null', () => {
    const row = { ...validRow, owner_team: null, owner_role: null, created_at: null, description: null };
    const result = RequirementRowSchema.safeParse(row);
    expect(result.success).toBe(true);
  });

  it('accepts missing optional fields', () => {
    const { owner_team, owner_role, created_at, description, ...minimal } = validRow;
    const result = RequirementRowSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { title, ...noTitle } = validRow;
    const result = RequirementRowSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  it('rejects invalid clarity enum value', () => {
    const row = { ...validRow, clarity: 'Invalid' };
    const result = RequirementRowSchema.safeParse(row);
    expect(result.success).toBe(false);
  });

  it('rejects invalid risk enum value', () => {
    const row = { ...validRow, risk: 'None' };
    const result = RequirementRowSchema.safeParse(row);
    expect(result.success).toBe(false);
  });

  it('rejects non-number completeness', () => {
    const row = { ...validRow, completeness: 'high' };
    const result = RequirementRowSchema.safeParse(row);
    expect(result.success).toBe(false);
  });
});

describe('RequirementSchema (transform)', () => {
  const validRow = {
    id: 'r1',
    title: 'Test',
    source: 'User',
    owner: 'Bob',
    owner_team: 'Platform',
    owner_role: null,
    created_at: '2026-03-01',
    description: null,
    completeness: 50,
    clarity: 'Medium',
    risk: 'High',
  };

  it('transforms snake_case row to camelCase domain object', () => {
    const result = RequirementSchema.parse(validRow);
    expect(result.ownerTeam).toBe('Platform');
    expect(result.ownerRole).toBeUndefined();
    expect(result.createdAt).toBe('2026-03-01');
    expect(result.description).toBeUndefined();
    expect(result.projectId).toBeUndefined();
  });

  it('preserves non-transformed fields', () => {
    const result = RequirementSchema.parse(validRow);
    expect(result.id).toBe('r1');
    expect(result.title).toBe('Test');
    expect(result.completeness).toBe(50);
    expect(result.clarity).toBe('Medium');
    expect(result.risk).toBe('High');
  });
});

describe('CreateRequirementBodySchema', () => {
  it('accepts a valid creation body', () => {
    const body = { title: 'New requirement', source: 'User', owner: 'Alice' };
    const result = CreateRequirementBodySchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it('applies defaults for missing fields', () => {
    const body = { title: 'Minimal' };
    const result = CreateRequirementBodySchema.parse(body);
    expect(result.source).toBe('Unknown');
    expect(result.owner).toBe('Unassigned');
    expect(result.completeness).toBe(0);
    expect(result.clarity).toBe('Low');
    expect(result.risk).toBe('Medium');
  });

  it('rejects empty title', () => {
    const body = { title: '' };
    const result = CreateRequirementBodySchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it('rejects completeness outside 0-100 range', () => {
    const body = { title: 'Test', completeness: 150 };
    const result = CreateRequirementBodySchema.safeParse(body);
    expect(result.success).toBe(false);
  });
});
