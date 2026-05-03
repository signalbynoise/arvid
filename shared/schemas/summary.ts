import { z } from 'zod';

export const SummaryRowSchema = z.object({
  id: z.string(),
  requirement_id: z.string(),
  synthesis: z.string(),
  core_objective: z.string(),
  architecture: z.string(),
  constraints: z.string(),
  unverified_risks: z.string(),
  model: z.string(),
  generated_at: z.string().nullable().optional(),
});

export const SummarySchema = SummaryRowSchema.transform(row => ({
  id: row.id,
  requirementId: row.requirement_id,
  synthesis: row.synthesis,
  coreObjective: row.core_objective,
  architecture: row.architecture,
  constraints: row.constraints,
  unverifiedRisks: row.unverified_risks,
  model: row.model,
  generatedAt: row.generated_at ?? undefined,
}));

export const GenerateSummaryResponseSchema = z.object({
  synthesis: z.string(),
  core_objective: z.string(),
  architecture: z.string(),
  constraints: z.string(),
  unverified_risks: z.string(),
});

export type SummaryRow = z.infer<typeof SummaryRowSchema>;
export type Summary = z.output<typeof SummarySchema>;
export type GenerateSummaryResponse = z.infer<typeof GenerateSummaryResponseSchema>;
