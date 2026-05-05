import { describe, it, expect } from 'vitest';
import { SuggestAnswerResponseSchema } from './openrouter';

describe('SuggestAnswerResponseSchema', () => {
  it('accepts a valid answerable response', () => {
    const response = {
      answerable: true,
      answer_text: 'Best practice suggests using OAuth2 with PKCE for SPAs.',
      confidence: 'high',
      reasoning: 'This is a standard technical question about authentication patterns.',
    };
    const result = SuggestAnswerResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.answerable).toBe(true);
      expect(result.data.answer_text).toBe(response.answer_text);
      expect(result.data.confidence).toBe('high');
    }
  });

  it('accepts a valid skipped response with null answer_text', () => {
    const response = {
      answerable: false,
      answer_text: null,
      confidence: 'low',
      reasoning: 'This question requires internal organizational knowledge.',
    };
    const result = SuggestAnswerResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.answerable).toBe(false);
      expect(result.data.answer_text).toBeNull();
    }
  });

  it('accepts all confidence levels', () => {
    for (const confidence of ['high', 'medium', 'low'] as const) {
      const response = {
        answerable: true,
        answer_text: 'Some answer',
        confidence,
        reasoning: 'test',
      };
      const result = SuggestAnswerResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid confidence level', () => {
    const response = {
      answerable: true,
      answer_text: 'Some answer',
      confidence: 'very_high',
      reasoning: 'test',
    };
    const result = SuggestAnswerResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('rejects missing answerable field', () => {
    const response = {
      answer_text: 'Some answer',
      confidence: 'high',
      reasoning: 'test',
    };
    const result = SuggestAnswerResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('rejects missing reasoning field', () => {
    const response = {
      answerable: true,
      answer_text: 'Some answer',
      confidence: 'high',
    };
    const result = SuggestAnswerResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean answerable', () => {
    const response = {
      answerable: 'yes',
      answer_text: 'Some answer',
      confidence: 'high',
      reasoning: 'test',
    };
    const result = SuggestAnswerResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('rejects non-string answer_text (when not null)', () => {
    const response = {
      answerable: true,
      answer_text: 42,
      confidence: 'high',
      reasoning: 'test',
    };
    const result = SuggestAnswerResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });
});
