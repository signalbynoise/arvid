import { z } from 'zod';

export const FigmaDesignLinkRowSchema = z.object({
  id: z.string().uuid(),
  requirement_id: z.string(),
  figma_url: z.string(),
  file_key: z.string(),
  node_id: z.string().nullable(),
  node_name: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  structural_summary: z.unknown().nullable(),
  fetched_at: z.string().nullable(),
  created_at: z.string(),
});

export const FigmaDesignLinkSchema = FigmaDesignLinkRowSchema.transform(row => ({
  id: row.id,
  requirementId: row.requirement_id,
  figmaUrl: row.figma_url,
  fileKey: row.file_key,
  nodeId: row.node_id ?? undefined,
  nodeName: row.node_name ?? undefined,
  thumbnailUrl: row.thumbnail_url ?? undefined,
  structuralSummary: row.structural_summary,
  fetchedAt: row.fetched_at ?? undefined,
  createdAt: row.created_at,
}));

export type FigmaDesignLinkRow = z.infer<typeof FigmaDesignLinkRowSchema>;
export type FigmaDesignLink = z.output<typeof FigmaDesignLinkSchema>;

export const CreateFigmaDesignLinkBodySchema = z.object({
  figma_url: z.string().url(),
});

export type CreateFigmaDesignLinkBody = z.infer<typeof CreateFigmaDesignLinkBodySchema>;
