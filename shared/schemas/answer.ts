import { z } from 'zod';

export const AnswerRowSchema = z.object({
  id: z.string(),
  question_id: z.string(),
  short_id: z.string().nullable().optional(),
  text: z.string(),
  author: z.string(),
  created_at: z.string(),
  is_current: z.boolean(),
  is_suggested: z.boolean().nullable().optional(),
  is_hidden: z.boolean().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
  is_deactivated: z.boolean().optional(),
  updated_at: z.string().nullable().optional(),
});

export const AnswerSchema = AnswerRowSchema.transform(row => ({
  id: row.id,
  questionId: row.question_id,
  shortId: row.short_id ?? undefined,
  text: row.text,
  author: row.author,
  createdAt: row.created_at,
  isCurrent: row.is_current,
  isSuggested: row.is_suggested ?? undefined,
  isHidden: row.is_hidden ?? undefined,
  createdBy: row.created_by ?? undefined,
  isDeactivated: row.is_deactivated ?? false,
  updatedAt: row.updated_at ?? undefined,
}));

export const CreateAnswerBodySchema = z.object({
  id: z.string().optional(),
  question_id: z.string(),
  text: z.string().min(1),
  author: z.string().min(1),
  created_at: z.string().optional(),
  is_current: z.boolean().default(false),
  is_suggested: z.boolean().nullable().optional(),
  is_hidden: z.boolean().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
  is_deactivated: z.boolean().optional(),
});

export const UpdateAnswerBodySchema = z.object({
  text: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  is_current: z.boolean().optional(),
  is_suggested: z.boolean().nullable().optional(),
  is_hidden: z.boolean().nullable().optional(),
  is_deactivated: z.boolean().optional(),
});

export type AnswerRow = z.infer<typeof AnswerRowSchema>;
export type Answer = z.output<typeof AnswerSchema>;
