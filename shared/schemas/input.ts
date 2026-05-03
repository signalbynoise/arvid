import { z } from 'zod';

export const RequirementInputSchema = z.object({
  text: z.string().min(1, 'Requirement text is required').min(5, 'Must be at least 5 characters'),
});

export const QuestionInputSchema = z.object({
  text: z.string().min(1, 'Question text is required').min(5, 'Must be at least 5 characters'),
});

export const AnswerInputSchema = z.object({
  text: z.string().min(1, 'Answer text is required').min(3, 'Must be at least 3 characters'),
  author: z.string().min(1, 'Author is required'),
});

export const ProjectNameSchema = z.object({
  name: z.string().min(1, 'Project name is required').min(2, 'Must be at least 2 characters'),
});
