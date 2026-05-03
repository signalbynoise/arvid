import { describe, it, expect } from 'vitest';
import { AnswerRowSchema, AnswerSchema, CreateAnswerBodySchema, UpdateAnswerBodySchema } from './answer';

describe('AnswerRowSchema', () => {
  const validRow = {
    id: 'a1',
    question_id: 'q1',
    text: 'The deployment target is AWS EKS.',
    author: 'Jane',
    date: '2026-02-15',
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
    date: '2026-01-20',
    is_current: false,
  };

  it('transforms snake_case to camelCase', () => {
    const result = AnswerSchema.parse(validRow);
    expect(result.questionId).toBe('q1');
    expect(result.isCurrent).toBe(false);
  });

  it('preserves direct fields unchanged', () => {
    const result = AnswerSchema.parse(validRow);
    expect(result.id).toBe('a1');
    expect(result.text).toBe('Answer text');
    expect(result.author).toBe('Bob');
    expect(result.date).toBe('2026-01-20');
  });
});

describe('CreateAnswerBodySchema', () => {
  it('accepts valid creation body', () => {
    const body = { question_id: 'q1', text: 'My answer', author: 'Eve', date: '2026-03-01' };
    const result = CreateAnswerBodySchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it('defaults is_current to false', () => {
    const body = { question_id: 'q1', text: 'Answer', author: 'Eve', date: '2026-03-01' };
    const result = CreateAnswerBodySchema.parse(body);
    expect(result.is_current).toBe(false);
  });

  it('rejects empty text', () => {
    const body = { question_id: 'q1', text: '', author: 'Eve', date: '2026-03-01' };
    const result = CreateAnswerBodySchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it('rejects empty author', () => {
    const body = { question_id: 'q1', text: 'Answer', author: '', date: '2026-03-01' };
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
});
