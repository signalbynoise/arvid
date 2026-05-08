const IMPORTANCE_WEIGHT = { Critical: 3, Important: 2, Optional: 1 } as const;

type QuestionSlice = { requirementId: string; status: string; importance: string };

export function computeLocalCompleteness(reqId: string, allQuestions: QuestionSlice[]): number {
  const questions = allQuestions.filter(q => q.requirementId === reqId);
  const totalWeight = questions.reduce((acc, q) => acc + (IMPORTANCE_WEIGHT[q.importance as keyof typeof IMPORTANCE_WEIGHT] ?? 1), 0);
  const answeredWeight = questions.filter(q => q.status === 'Answered').reduce((acc, q) => acc + (IMPORTANCE_WEIGHT[q.importance as keyof typeof IMPORTANCE_WEIGHT] ?? 1), 0);
  return totalWeight > 0 ? Math.round((answeredWeight / totalWeight) * 100) : 0;
}

export function effectiveCompleteness(req: { id: string; completeness: number }, allQuestions: QuestionSlice[]): number {
  return req.completeness > 0 ? req.completeness : computeLocalCompleteness(req.id, allQuestions);
}
