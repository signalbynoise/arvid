import { z } from 'zod';

export const AnswerRowSchema = z.object({
  id: z.string(),
  question_id: z.string(),
  text: z.string(),
  author: z.string(),
  date: z.string(),
  is_current: z.boolean(),
});

export const AnswerSchema = AnswerRowSchema.transform(row => ({
  id: row.id,
  questionId: row.question_id,
  text: row.text,
  author: row.author,
  date: row.date,
  isCurrent: row.is_current,
}));

export const CreateAnswerBodySchema = z.object({
  id: z.string().optional(),
  question_id: z.string(),
  text: z.string().min(1),
  author: z.string().min(1),
  date: z.string(),
  is_current: z.boolean().default(false),
});

export const UpdateAnswerBodySchema = z.object({
  text: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  is_current: z.boolean().optional(),
});

export type AnswerRow = z.infer<typeof AnswerRowSchema>;
export type Answer = z.output<typeof AnswerSchema>;
