import { describe, it, expect } from 'vitest';
import { QuestionRowSchema, QuestionSchema, UpdateQuestionBodySchema } from './question';

describe('QuestionRowSchema', () => {
  const validRow = {
    id: 'q1',
    requirement_id: 'r1',
    text: 'What is the deployment target?',
    status: 'Unanswered',
    importance: 'Critical',
    type: 'Manual',
    category: 'Scope',
    is_suggested: false,
    is_hidden: false,
    author: 'Alice',
    author_team: 'Engineering',
    author_role: 'Tech Lead',
    created_at: '2026-02-10',
    description: 'Clarify deployment requirements',
  };

  it('accepts a valid question row', () => {
    const result = QuestionRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it('rejects invalid status enum', () => {
    const row = { ...validRow, status: 'Pending' };
    const result = QuestionRowSchema.safeParse(row);
    expect(result.success).toBe(false);
  });

  it('rejects invalid importance enum', () => {
    const row = { ...validRow, importance: 'Low' };
    const result = QuestionRowSchema.safeParse(row);
    expect(result.success).toBe(false);
  });

  it('rejects invalid category enum', () => {
    const row = { ...validRow, category: 'Unknown' };
    const result = QuestionRowSchema.safeParse(row);
    expect(result.success).toBe(false);
  });

  it('rejects missing required text field', () => {
    const { text, ...noText } = validRow;
    const result = QuestionRowSchema.safeParse(noText);
    expect(result.success).toBe(false);
  });
});

describe('QuestionSchema (transform)', () => {
  const validRow = {
    id: 'q1',
    requirement_id: 'r1',
    text: 'Test question?',
    status: 'Answered',
    importance: 'Important',
    type: 'Auto-generated',
    category: 'Data',
    is_suggested: true,
    is_hidden: false,
    author: 'Arvid',
    author_team: 'AI',
    author_role: null,
    created_at: '2026-03-01',
    description: null,
  };

  it('transforms snake_case fields to camelCase', () => {
    const result = QuestionSchema.parse({ ...validRow, short_id: 'Q01' });
    expect(result.shortId).toBe('Q01');
    expect(result.requirementId).toBe('r1');
    expect(result.isSuggested).toBe(true);
    expect(result.isHidden).toBe(false);
    expect(result.authorTeam).toBe('AI');
    expect(result.authorRole).toBeUndefined();
  });
});

describe('UpdateQuestionBodySchema', () => {
  it('accepts partial update with status', () => {
    const result = UpdateQuestionBodySchema.safeParse({ status: 'Answered' });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with is_suggested', () => {
    const result = UpdateQuestionBodySchema.safeParse({ is_suggested: false });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status value', () => {
    const result = UpdateQuestionBodySchema.safeParse({ status: 'Done' });
    expect(result.success).toBe(false);
  });

  it('accepts empty object (no updates)', () => {
    const result = UpdateQuestionBodySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
