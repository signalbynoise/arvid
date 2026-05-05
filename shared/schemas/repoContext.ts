import { z } from 'zod';

export const FileTreeEntrySchema = z.object({
  path: z.string(),
  type: z.enum(['blob', 'tree']),
  size: z.number().optional(),
});

export const CommitEntrySchema = z.object({
  sha: z.string(),
  message: z.string(),
  author: z.string(),
  date: z.string(),
});

export const RepoAnalysisSchema = z.object({
  languages: z.array(z.object({
    name: z.string(),
    percentage: z.number(),
  })),
  dependencies: z.array(z.object({
    name: z.string(),
    version: z.string(),
    type: z.enum(['runtime', 'dev']),
  })),
  patterns: z.array(z.string()),
  frameworks: z.array(z.string()),
  testFramework: z.string().nullable(),
  buildTool: z.string().nullable(),
  cicd: z.string().nullable(),
  summary: z.string(),
});

export const RepoContextRowSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  user_id: z.string(),
  file_tree: z.array(FileTreeEntrySchema),
  key_files: z.record(z.string(), z.string()),
  recent_commits: z.array(CommitEntrySchema),
  analysis: RepoAnalysisSchema.nullable(),
  fetched_at: z.string(),
  status: z.enum(['pending', 'fetching', 'ready', 'error']),
  error_message: z.string().nullable(),
});

export const RepoContextSchema = RepoContextRowSchema.transform(row => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  fileTree: row.file_tree,
  keyFiles: row.key_files,
  recentCommits: row.recent_commits,
  analysis: row.analysis,
  fetchedAt: row.fetched_at,
  status: row.status,
  errorMessage: row.error_message ?? undefined,
}));

export type FileTreeEntry = z.infer<typeof FileTreeEntrySchema>;
export type CommitEntry = z.infer<typeof CommitEntrySchema>;
export type RepoAnalysis = z.infer<typeof RepoAnalysisSchema>;
export type RepoContextRow = z.infer<typeof RepoContextRowSchema>;
export type RepoContext = z.output<typeof RepoContextSchema>;
