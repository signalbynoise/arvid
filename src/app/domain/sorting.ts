export const IMPORTANCE_SCORE = { Critical: 3, Important: 2, Optional: 1 } as const;
export const STATUS_SCORE = { Unanswered: 3, Conflicting: 2, Answered: 1 } as const;
export const RISK_SCORE = { High: 3, Medium: 2, Low: 1 } as const;
export const CLARITY_SCORE = { High: 3, Medium: 2, Low: 1 } as const;

export function scoreFor<T extends Record<string, number>>(map: T, value: string | undefined): number {
  return (map as Record<string, number>)[value ?? ''] ?? 0;
}
