import { z } from 'zod';
import { ImplStatusEnum } from './enums';

export const ImplementationCheckResponseSchema = z.object({
  status: ImplStatusEnum,
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  objective_met: z.boolean().optional(),
  architecture_met: z.boolean().optional(),
  constraints_met: z.boolean().optional(),
  risks_addressed: z.boolean().optional(),
});

export type ImplementationCheckResponse = z.infer<typeof ImplementationCheckResponseSchema>;

export interface ImplAnalysis {
  accordance_score: number;
  objective_met: boolean;
  architecture_met: boolean;
  constraints_met: boolean;
  risks_addressed: boolean;
  checked_at: string;
}

const ACCORDANCE_WEIGHTS = {
  objective: 40,
  architecture: 30,
  constraints: 20,
  risks: 10,
} as const;

export { ACCORDANCE_WEIGHTS };

export function computeAccordanceScore(result: ImplementationCheckResponse): ImplAnalysis | null {
  if (result.objective_met === undefined) return null;

  const score =
    (result.objective_met ? ACCORDANCE_WEIGHTS.objective : 0) +
    (result.architecture_met ? ACCORDANCE_WEIGHTS.architecture : 0) +
    (result.constraints_met ? ACCORDANCE_WEIGHTS.constraints : 0) +
    (result.risks_addressed ? ACCORDANCE_WEIGHTS.risks : 0);

  return {
    accordance_score: score,
    objective_met: result.objective_met,
    architecture_met: result.architecture_met ?? false,
    constraints_met: result.constraints_met ?? false,
    risks_addressed: result.risks_addressed ?? false,
    checked_at: new Date().toISOString(),
  };
}
