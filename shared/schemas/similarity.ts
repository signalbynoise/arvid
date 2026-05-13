import { z } from 'zod';

export const SimilarRequirementSchema = z.object({
  id: z.string(),
  short_id: z.string().nullable(),
  title: z.string(),
  score: z.number(),
}).transform(row => ({
  id: row.id,
  shortId: row.short_id,
  title: row.title,
  score: row.score,
}));

export const SimilarRequirementRowSchema = z.object({
  id: z.string(),
  short_id: z.string().nullable(),
  title: z.string(),
  score: z.number(),
});

export type SimilarRequirementRow = z.infer<typeof SimilarRequirementRowSchema>;
export type SimilarRequirement = z.output<typeof SimilarRequirementSchema>;

export const SimilarRequirementsResponseSchema = z.object({
  similar: z.array(SimilarRequirementRowSchema),
});

export const ProjectSimilaritiesResponseSchema = z.object({
  similarities: z.record(z.string(), z.array(SimilarRequirementRowSchema)),
});
