import { z } from 'zod';

export const ArticleStatusEnum = z.enum(['draft', 'published']);
export type ArticleStatus = z.infer<typeof ArticleStatusEnum>;

export const ArticleTypeEnum = z.enum(['article', 'feature', 'docs', 'changelog']);
export type ArticleType = z.infer<typeof ArticleTypeEnum>;

export const ArticleRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  type: ArticleTypeEnum,
  status: ArticleStatusEnum,
  content: z.string().default(''),
  excerpt: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  meta_description: z.string().nullable().optional(),
  mini_demo_id: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
});

export const ArticleSchema = ArticleRowSchema.transform((row) => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  type: row.type,
  status: row.status,
  content: row.content,
  excerpt: row.excerpt ?? undefined,
  tags: row.tags,
  metaDescription: row.meta_description ?? undefined,
  miniDemoId: row.mini_demo_id ?? undefined,
  author: row.author ?? undefined,
  coverImageUrl: row.cover_image_url ?? undefined,
  publishedAt: row.published_at ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
  createdBy: row.created_by ?? undefined,
}));

export const CreateArticleBodySchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  type: ArticleTypeEnum,
  status: ArticleStatusEnum.optional(),
  content: z.string().optional(),
  excerpt: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  meta_description: z.string().nullable().optional(),
  mini_demo_id: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
});

export const UpdateArticleBodySchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  type: ArticleTypeEnum.optional(),
  status: ArticleStatusEnum.optional(),
  content: z.string().optional(),
  excerpt: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  meta_description: z.string().nullable().optional(),
  mini_demo_id: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
});

export type ArticleRow = z.infer<typeof ArticleRowSchema>;
export type Article = z.output<typeof ArticleSchema>;
