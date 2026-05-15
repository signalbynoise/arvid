import { z } from 'zod';

export const ProjectRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  short_id: z.string().nullable().optional(),
  parent_id: z.string().nullable(),
  created_at: z.string().nullable().optional(),
  user_id: z.string().optional(),
  workspace_id: z.string().nullable().optional(),
  team_id: z.string().nullable().optional(),
  is_deleted: z.boolean().optional(),
  deleted_at: z.string().nullable().optional(),
  github_repo_full_name: z.string().nullable().optional(),
  github_repo_default_branch: z.string().nullable().optional(),
  github_connected_at: z.string().nullable().optional(),
  linear_project_id: z.string().nullable().optional(),
  linear_project_name: z.string().nullable().optional(),
  linear_team_id: z.string().nullable().optional(),
  slack_notification_channel_id: z.string().nullable().optional(),
  supabase_project_ref: z.string().nullable().optional(),
  supabase_connected_at: z.string().nullable().optional(),
});

export const ProjectSchema = ProjectRowSchema.transform(row => ({
  id: row.id,
  name: row.name,
  shortId: row.short_id ?? undefined,
  parentId: row.parent_id ?? undefined,
  createdAt: row.created_at ?? undefined,
  userId: row.user_id ?? undefined,
  workspaceId: row.workspace_id ?? undefined,
  teamId: row.team_id ?? undefined,
  isDeleted: row.is_deleted ?? false,
  deletedAt: row.deleted_at ?? undefined,
  githubRepo: row.github_repo_full_name ?? undefined,
  githubDefaultBranch: row.github_repo_default_branch ?? undefined,
  githubConnectedAt: row.github_connected_at ?? undefined,
  linearProjectId: row.linear_project_id ?? undefined,
  linearProjectName: row.linear_project_name ?? undefined,
  linearTeamId: row.linear_team_id ?? undefined,
  slackNotificationChannelId: row.slack_notification_channel_id ?? undefined,
  supabaseProjectRef: row.supabase_project_ref ?? undefined,
  supabaseConnectedAt: row.supabase_connected_at ?? undefined,
}));

export const CreateProjectBodySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  parent_id: z.string().nullable().optional(),
  workspace_id: z.string().uuid().optional(),
  team_id: z.string().uuid().optional(),
});

export const UpdateProjectBodySchema = z.object({
  name: z.string().min(1).optional(),
  github_repo_full_name: z.string().nullable().optional(),
  github_repo_default_branch: z.string().nullable().optional(),
  linear_project_id: z.string().nullable().optional(),
  linear_project_name: z.string().nullable().optional(),
  linear_team_id: z.string().nullable().optional(),
  slack_notification_channel_id: z.string().nullable().optional(),
  supabase_project_ref: z.string().nullable().optional(),
});

export type ProjectRow = z.infer<typeof ProjectRowSchema>;
export type Project = z.output<typeof ProjectSchema>;
