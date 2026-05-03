import { z } from 'zod';
import { StatusEnum, ImportanceEnum, QuestionTypeEnum, CategoryEnum } from './enums';

export const QuestionRowSchema = z.object({
  id: z.string(),
  requirement_id: z.string(),
  text: z.string(),
  status: StatusEnum,
  importance: ImportanceEnum,
  type: QuestionTypeEnum,
  category: CategoryEnum,
  is_suggested: z.boolean().nullable().optional(),
  is_hidden: z.boolean().nullable().optional(),
  author: z.string().nullable().optional(),
  author_team: z.string().nullable().optional(),
  author_role: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const QuestionSchema = QuestionRowSchema.transform(row => ({
  id: row.id,
  requirementId: row.requirement_id,
  text: row.text,
  status: row.status,
  importance: row.importance,
  type: row.type,
  category: row.category,
  isSuggested: row.is_suggested ?? undefined,
  isHidden: row.is_hidden ?? undefined,
  author: row.author ?? undefined,
  authorTeam: row.author_team ?? undefined,
  authorRole: row.author_role ?? undefined,
  createdAt: row.created_at ?? undefined,
  description: row.description ?? undefined,
}));

export const CreateQuestionBodySchema = z.object({
  id: z.string().optional(),
  requirement_id: z.string(),
  text: z.string().min(1),
  status: StatusEnum.default('Unanswered'),
  importance: ImportanceEnum,
  type: QuestionTypeEnum.default('Manual'),
  category: CategoryEnum,
  is_suggested: z.boolean().nullable().optional(),
  is_hidden: z.boolean().nullable().optional(),
  author: z.string().nullable().optional(),
  author_team: z.string().nullable().optional(),
  author_role: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const UpdateQuestionBodySchema = z.object({
  status: StatusEnum.optional(),
  importance: ImportanceEnum.optional(),
  type: QuestionTypeEnum.optional(),
  category: CategoryEnum.optional(),
  is_suggested: z.boolean().nullable().optional(),
  is_hidden: z.boolean().nullable().optional(),
  text: z.string().min(1).optional(),
  author: z.string().nullable().optional(),
  author_team: z.string().nullable().optional(),
  author_role: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type QuestionRow = z.infer<typeof QuestionRowSchema>;
export type Question = z.output<typeof QuestionSchema>;
