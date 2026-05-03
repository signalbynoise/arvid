import { Answer, Status } from '../types';

/**
 * Derives the status of a question based on its active answers.
 * Pure function — deterministic and stateless.
 */
export function deriveQuestionStatus(answers: Answer[], questionId: string): Status {
  const activeAnswers = answers.filter(a => a.questionId === questionId && a.isCurrent);

  if (activeAnswers.length === 0) return 'Unanswered';
  if (activeAnswers.length === 1) return 'Answered';
  return 'Conflicting';
}
