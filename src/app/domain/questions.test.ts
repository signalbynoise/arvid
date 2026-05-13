import { describe, it, expect } from 'vitest';
import { deriveQuestionStatus } from './questions';
import { Answer } from '../types';

const makeAnswer = (overrides: Partial<Answer> = {}): Answer => ({
  id: 'a1',
  questionId: 'q1',
  text: 'Some answer',
  author: 'Test User',
  createdAt: '2026-01-01',
  isCurrent: false,
  ...overrides,
});

describe('deriveQuestionStatus', () => {
  it('returns Unanswered when no answers exist for the question', () => {
    const answers: Answer[] = [];
    expect(deriveQuestionStatus(answers, 'q1')).toBe('Unanswered');
  });

  it('returns Unanswered when all answers for the question are inactive', () => {
    const answers = [
      makeAnswer({ id: 'a1', isCurrent: false }),
      makeAnswer({ id: 'a2', isCurrent: false }),
    ];
    expect(deriveQuestionStatus(answers, 'q1')).toBe('Unanswered');
  });

  it('returns Answered when exactly one answer is active', () => {
    const answers = [
      makeAnswer({ id: 'a1', isCurrent: true }),
      makeAnswer({ id: 'a2', isCurrent: false }),
    ];
    expect(deriveQuestionStatus(answers, 'q1')).toBe('Answered');
  });

  it('returns Conflicting when multiple answers are active', () => {
    const answers = [
      makeAnswer({ id: 'a1', isCurrent: true }),
      makeAnswer({ id: 'a2', isCurrent: true }),
    ];
    expect(deriveQuestionStatus(answers, 'q1')).toBe('Conflicting');
  });

  it('ignores answers belonging to other questions', () => {
    const answers = [
      makeAnswer({ id: 'a1', questionId: 'q1', isCurrent: true }),
      makeAnswer({ id: 'a2', questionId: 'q2', isCurrent: true }),
    ];
    expect(deriveQuestionStatus(answers, 'q1')).toBe('Answered');
  });
});
