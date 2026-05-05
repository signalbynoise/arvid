import { z } from 'zod';

export const GitHubConnectionRowSchema = z.object({
  user_id: z.string(),
  github_user_id: z.string(),
  github_username: z.string(),
  github_avatar_url: z.string().nullable(),
  scopes: z.string(),
  connected_at: z.string(),
  updated_at: z.string(),
});

export const GitHubConnectionSchema = GitHubConnectionRowSchema.transform(row => ({
  userId: row.user_id,
  githubUserId: row.github_user_id,
  githubUsername: row.github_username,
  githubAvatarUrl: row.github_avatar_url ?? undefined,
  scopes: row.scopes,
  connectedAt: row.connected_at,
  updatedAt: row.updated_at,
}));

export const GitHubRepoSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  private: z.boolean(),
  default_branch: z.string(),
  language: z.string().nullable(),
  description: z.string().nullable(),
});

export type GitHubConnectionRow = z.infer<typeof GitHubConnectionRowSchema>;
export type GitHubConnection = z.output<typeof GitHubConnectionSchema>;
export type GitHubRepo = z.infer<typeof GitHubRepoSchema>;
