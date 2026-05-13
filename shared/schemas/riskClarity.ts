import { z } from 'zod';
import type { Clarity, Risk } from './enums';

export const RiskClarityResponseSchema = z.object({
  clarity_score: z.number().int().min(1).max(10),
  risk_score: z.number().int().min(1).max(10),
  clarity_reasoning: z.string(),
  risk_reasoning: z.string(),
});

export type RiskClarityResponse = z.infer<typeof RiskClarityResponseSchema>;

export type ScoreLabel = 'Low' | 'Medium' | 'High';

const SCORE_THRESHOLDS = { low: 3, high: 7 } as const;

export function scoreToClarityLabel(score: number): Clarity {
  if (score <= SCORE_THRESHOLDS.low) return 'Low';
  if (score >= SCORE_THRESHOLDS.high) return 'High';
  return 'Medium';
}

export function scoreToRiskLabel(score: number): Risk {
  if (score <= SCORE_THRESHOLDS.low) return 'Low';
  if (score >= SCORE_THRESHOLDS.high) return 'High';
  return 'Medium';
}

export function clampScore(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}
