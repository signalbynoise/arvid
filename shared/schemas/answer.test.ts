import { describe, it, expect } from 'vitest';
import { AnswerRowSchema, AnswerSchema, CreateAnswerBodySchema, UpdateAnswerBodySchema } from './answer';

describe('AnswerRowSchema', () => {
  const validRow = {
    id: 'a1',
    question_id: 'q1',
    text: 'The deployment target is AWS EKS.',
    author: 'Jane',
    created_at: '2026-02-15T00:00:00.000Z',
    is_current: true,
  };

  it('accepts a valid answer row', () => {
    const result = AnswerRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { text, ...noText } = validRow;
    const result = AnswerRowSchema.safeParse(noText);
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean is_current', () => {
    const row = { ...validRow, is_current: 'yes' };
    const result = AnswerRowSchema.safeParse(row);
    expect(result.success).toBe(false);
  });

  it('rejects missing question_id', () => {
    const { question_id, ...noQid } = validRow;
    const result = AnswerRowSchema.safeParse(noQid);
    expect(result.success).toBe(false);
  });
});

describe('AnswerSchema (transform)', () => {
  const validRow = {
    id: 'a1',
    question_id: 'q1',
    text: 'Answer text',
    author: 'Bob',
    created_at: '2026-01-20T00:00:00.000Z',
    is_current: false,
  };

  it('transforms snake_case to camelCase', () => {
    const result = AnswerSchema.parse({ ...validRow, short_id: 'A01' });
    expect(result.shortId).toBe('A01');
    expect(result.questionId).toBe('q1');
    expect(result.isCurrent).toBe(false);
  });

  it('preserves direct fields unchanged', () => {
    const result = AnswerSchema.parse(validRow);
    expect(result.id).toBe('a1');
    expect(result.text).toBe('Answer text');
    expect(result.author).toBe('Bob');
    expect(result.createdAt).toBe('2026-01-20T00:00:00.000Z');
  });
});

describe('CreateAnswerBodySchema', () => {
  it('accepts valid creation body', () => {
    const body = { question_id: 'q1', text: 'My answer', author: 'Eve', created_at: '2026-03-01T00:00:00.000Z' };
    const result = CreateAnswerBodySchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it('defaults is_current to false', () => {
    const body = { question_id: 'q1', text: 'Answer', author: 'Eve', created_at: '2026-03-01T00:00:00.000Z' };
    const result = CreateAnswerBodySchema.parse(body);
    expect(result.is_current).toBe(false);
  });

  it('rejects empty text', () => {
    const body = { question_id: 'q1', text: '', author: 'Eve', created_at: '2026-03-01T00:00:00.000Z' };
    const result = CreateAnswerBodySchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it('rejects empty author', () => {
    const body = { question_id: 'q1', text: 'Answer', author: '', created_at: '2026-03-01T00:00:00.000Z' };
    const result = CreateAnswerBodySchema.safeParse(body);
    expect(result.success).toBe(false);
  });
});

describe('UpdateAnswerBodySchema', () => {
  it('accepts partial update with is_current', () => {
    const result = UpdateAnswerBodySchema.safeParse({ is_current: true });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = UpdateAnswerBodySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects non-boolean is_current', () => {
    const result = UpdateAnswerBodySchema.safeParse({ is_current: 'yes' });
    expect(result.success).toBe(false);
  });

  it('accepts is_suggested update', () => {
    const result = UpdateAnswerBodySchema.safeParse({ is_suggested: false });
    expect(result.success).toBe(true);
  });

  it('accepts is_hidden update', () => {
    const result = UpdateAnswerBodySchema.safeParse({ is_hidden: true });
    expect(result.success).toBe(true);
  });
});

describe('AnswerSchema suggested answer fields', () => {
  const baseRow = {
    id: 'a1',
    question_id: 'q1',
    text: 'Best practice suggests using OAuth2.',
    author: 'Arvid',
    created_at: '2026-05-04T00:00:00.000Z',
    is_current: false,
  };

  it('transforms is_suggested to isSuggested', () => {
    const result = AnswerSchema.parse({ ...baseRow, is_suggested: true, is_hidden: false });
    expect(result.isSuggested).toBe(true);
    expect(result.isHidden).toBe(false);
  });

  it('defaults isSuggested to undefined when null', () => {
    const result = AnswerSchema.parse({ ...baseRow, is_suggested: null, is_hidden: null });
    expect(result.isSuggested).toBeUndefined();
    expect(result.isHidden).toBeUndefined();
  });

  it('defaults isSuggested to undefined when missing', () => {
    const result = AnswerSchema.parse(baseRow);
    expect(result.isSuggested).toBeUndefined();
    expect(result.isHidden).toBeUndefined();
  });

  it('accepts is_suggested in CreateAnswerBodySchema', () => {
    const body = {
      question_id: 'q1',
      text: 'AI answer',
      author: 'Arvid',
      created_at: '2026-05-04T00:00:00.000Z',
      is_suggested: true,
      is_hidden: false,
    };
    const result = CreateAnswerBodySchema.safeParse(body);
    expect(result.success).toBe(true);
  });
});
