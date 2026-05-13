import { z } from 'zod';

export const SearchEntityTypeEnum = z.enum(['requirement', 'question', 'answer']);

export const SearchResultRowSchema = z.object({
  entity_type: SearchEntityTypeEnum,
  entity_id: z.string(),
  short_id: z.string().nullable(),
  label: z.string(),
  author: z.string().nullable(),
  snippet: z.string().nullable(),
  rank: z.number(),
  project_id: z.string().nullable(),
  requirement_id: z.string().nullable(),
  question_id: z.string().nullable(),
});

export const SearchResultSchema = SearchResultRowSchema.transform(row => ({
  entityType: row.entity_type,
  entityId: row.entity_id,
  shortId: row.short_id,
  label: row.label,
  author: row.author,
  snippet: row.snippet,
  rank: row.rank,
  projectId: row.project_id,
  requirementId: row.requirement_id,
  questionId: row.question_id,
}));

export type SearchEntityType = z.infer<typeof SearchEntityTypeEnum>;
export type SearchResultRow = z.infer<typeof SearchResultRowSchema>;
export type SearchResult = z.output<typeof SearchResultSchema>;
