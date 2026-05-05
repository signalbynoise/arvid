import { z } from 'zod';

export const AnswerRowSchema = z.object({
  id: z.string(),
  question_id: z.string(),
  short_id: z.string().nullable().optional(),
  text: z.string(),
  author: z.string(),
  date: z.string(),
  is_current: z.boolean(),
  is_suggested: z.boolean().nullable().optional(),
  is_hidden: z.boolean().nullable().optional(),
});

export const AnswerSchema = AnswerRowSchema.transform(row => ({
  id: row.id,
  questionId: row.question_id,
  shortId: row.short_id ?? undefined,
  text: row.text,
  author: row.author,
  date: row.date,
  isCurrent: row.is_current,
  isSuggested: row.is_suggested ?? undefined,
  isHidden: row.is_hidden ?? undefined,
}));

export const CreateAnswerBodySchema = z.object({
  id: z.string().optional(),
  question_id: z.string(),
  text: z.string().min(1),
  author: z.string().min(1),
  date: z.string(),
  is_current: z.boolean().default(false),
  is_suggested: z.boolean().nullable().optional(),
  is_hidden: z.boolean().nullable().optional(),
});

export const UpdateAnswerBodySchema = z.object({
  text: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  is_current: z.boolean().optional(),
  is_suggested: z.boolean().nullable().optional(),
  is_hidden: z.boolean().nullable().optional(),
});

export type AnswerRow = z.infer<typeof AnswerRowSchema>;
export type Answer = z.output<typeof AnswerSchema>;
