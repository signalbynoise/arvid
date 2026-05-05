import { z } from 'zod';

export const SummaryRowSchema = z.object({
  id: z.string(),
  requirement_id: z.string(),
  short_id: z.string().nullable().optional(),
  synthesis: z.string(),
  core_objective: z.string(),
  architecture: z.string(),
  constraints: z.string(),
  unverified_risks: z.string(),
  completeness: z.number().min(0).max(100),
  completeness_reasoning: z.string(),
  model: z.string(),
  generated_at: z.string().nullable().optional(),
});

export const SummarySchema = SummaryRowSchema.transform(row => ({
  id: row.id,
  requirementId: row.requirement_id,
  shortId: row.short_id ?? undefined,
  synthesis: row.synthesis,
  coreObjective: row.core_objective,
  architecture: row.architecture,
  constraints: row.constraints,
  unverifiedRisks: row.unverified_risks,
  completeness: row.completeness,
  completenessReasoning: row.completeness_reasoning,
  model: row.model,
  generatedAt: row.generated_at ?? undefined,
}));

const coerceToString = z.union([
  z.string(),
  z.array(z.string()).transform(arr => arr.join('\n')),
]);

export const GenerateSummaryResponseSchema = z.object({
  synthesis: coerceToString,
  core_objective: coerceToString,
  architecture: coerceToString,
  constraints: coerceToString,
  unverified_risks: coerceToString,
  completeness: z.number().min(0).max(100),
  completeness_reasoning: coerceToString,
});

export type SummaryRow = z.infer<typeof SummaryRowSchema>;
export type Summary = z.output<typeof SummarySchema>;
export type GenerateSummaryResponse = z.infer<typeof GenerateSummaryResponseSchema>;
