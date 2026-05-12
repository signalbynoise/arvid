import { z } from 'zod';
import {
  RequirementSchema,
  QuestionSchema,
  AnswerSchema,
  RequirementRowSchema,
  QuestionRowSchema,
  AnswerRowSchema,
  ProjectRowSchema,
  ProjectSchema,
  SummaryRowSchema,
  SummarySchema,
  WorkspaceRowSchema,
  WorkspaceSchema,
  TeamRowSchema,
  TeamSchema,
  MembershipRowSchema,
  MembershipSchema,
  InvitationRowSchema,
  InvitationSchema,
  CardAssigneeRowSchema,
  CardAssigneeSchema,
} from '../../shared/schemas';
import { Requirement, Question, Answer, Project, Summary, Workspace, Team, Membership, Invitation, CardAssignee } from './types';
import { API_BASE } from './constants';
import { supabase } from './lib/supabase';
import { logger } from './logger';

const log = logger.create('api');

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly issues: z.ZodIssue[],
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

async function request<T>(method: string, endpoint: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  log.debug(method.toLowerCase(), `${method} ${endpoint}`, body ? { body } : undefined);

  const authHeaders = await getAuthHeaders();
  const headers: Record<string, string> = {
    ...authHeaders,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    const error = new ApiError(
      `${method} ${endpoint} failed with status ${res.status}`,
      res.status,
      endpoint,
    );
    log.error(method.toLowerCase(), error.message, { status: res.status, endpoint });
    throw error;
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json();
  log.debug(method.toLowerCase(), `${method} ${endpoint} succeeded`, { count: Array.isArray(data) ? data.length : 1 });
  return data;
}

function parseArray<TRow, TOut>(
  schema: z.ZodType<TRow>,
  transformSchema: z.ZodType<TOut, z.ZodTypeDef, TRow>,
  data: unknown[],
  endpoint: string,
): TOut[] {
  return data.map((item, index) => {
    const result = transformSchema.safeParse(item);
    if (!result.success) {
      const error = new ValidationError(
        `Response validation failed for item ${index} at ${endpoint}`,
        endpoint,
        result.error.issues,
      );
      log.error('parse', error.message, { index, issues: result.error.issues, rawData: item });
      throw error;
    }
    return result.data;
  });
}

function parseSingle<TRow, TOut>(
  schema: z.ZodType<TRow>,
  transformSchema: z.ZodType<TOut, z.ZodTypeDef, TRow>,
  data: unknown,
  endpoint: string,
): TOut {
  const result = transformSchema.safeParse(data);
  if (!result.success) {
    const error = new ValidationError(
      `Response validation failed at ${endpoint}`,
      endpoint,
      result.error.issues,
    );
    log.error('parse', error.message, { issues: result.error.issues, rawData: data });
    throw error;
  }
  return result.data;
}

export const api = {
  // --- Workspaces ---

  async getWorkspaces(signal?: AbortSignal): Promise<Workspace[]> {
    const rows = await request<unknown[]>('GET', '/workspaces', undefined, signal);
    return parseArray(WorkspaceRowSchema, WorkspaceSchema, rows, '/workspaces');
  },

  async createWorkspace(name: string): Promise<Workspace> {
    const row = await request<unknown>('POST', '/workspaces', { name });
    return parseSingle(WorkspaceRowSchema, WorkspaceSchema, row, '/workspaces');
  },

  async updateWorkspace(id: string, updates: { name?: string; logo_url?: string | null }): Promise<Workspace> {
    const row = await request<unknown>('PATCH', `/workspaces/${id}`, updates);
    return parseSingle(WorkspaceRowSchema, WorkspaceSchema, row, `/workspaces/${id}`);
  },

  async getDeactivationMap(workspaceId: string): Promise<{
    isOwner: boolean;
    workspace: boolean;
    teams: Record<string, boolean>;
    projects: Record<string, boolean>;
  }> {
    return request<{ isOwner: boolean; workspace: boolean; teams: Record<string, boolean>; projects: Record<string, boolean> }>('GET', `/workspaces/${workspaceId}/deactivation-map`);
  },

  async canDeactivateWorkspace(id: string): Promise<{ canDeactivate: boolean; reason?: string }> {
    return request<{ canDeactivate: boolean; reason?: string }>('GET', `/workspaces/${id}/can-deactivate`);
  },

  async deleteWorkspace(id: string): Promise<void> {
    await request<void>('DELETE', `/workspaces/${id}`);
  },

  // --- Teams ---

  async getTeams(workspaceId: string, signal?: AbortSignal): Promise<Team[]> {
    const rows = await request<unknown[]>('GET', `/teams?workspace_id=${workspaceId}`, undefined, signal);
    return parseArray(TeamRowSchema, TeamSchema, rows, '/teams');
  },

  async createTeam(name: string, workspaceId: string): Promise<Team> {
    const row = await request<unknown>('POST', '/teams', { name, workspace_id: workspaceId });
    return parseSingle(TeamRowSchema, TeamSchema, row, '/teams');
  },

  async updateTeam(id: string, updates: { name?: string }): Promise<Team> {
    const row = await request<unknown>('PATCH', `/teams/${id}`, updates);
    return parseSingle(TeamRowSchema, TeamSchema, row, `/teams/${id}`);
  },

  async canDeactivateTeam(id: string): Promise<{ canDeactivate: boolean; reason?: string }> {
    return request<{ canDeactivate: boolean; reason?: string }>('GET', `/teams/${id}/can-deactivate`);
  },

  async deleteTeam(id: string): Promise<void> {
    await request<void>('DELETE', `/teams/${id}`);
  },

  // --- Members ---

  async getMembers(workspaceId: string, signal?: AbortSignal): Promise<Membership[]> {
    const rows = await request<unknown[]>('GET', `/memberships?workspace_id=${workspaceId}`, undefined, signal);
    return parseArray(MembershipRowSchema, MembershipSchema, rows, '/memberships');
  },

  async addMember(workspaceId: string, email: string, role: string): Promise<Membership> {
    const row = await request<unknown>('POST', '/memberships', { workspace_id: workspaceId, email, role });
    return parseSingle(MembershipRowSchema, MembershipSchema, row, '/memberships');
  },

  async updateMemberRole(id: string, role: string): Promise<Membership> {
    const row = await request<unknown>('PATCH', `/memberships/${id}`, { role });
    return parseSingle(MembershipRowSchema, MembershipSchema, row, `/memberships/${id}`);
  },

  async removeMember(id: string): Promise<void> {
    await request<void>('DELETE', `/memberships/${id}`);
  },

  async leaveWorkspace(workspaceId: string): Promise<void> {
    await request<void>('POST', '/memberships/leave', { workspace_id: workspaceId });
  },

  async searchUsers(query: string, signal?: AbortSignal): Promise<Array<{ id: string; email: string }>> {
    return request<Array<{ id: string; email: string }>>('GET', `/memberships/search-users?q=${encodeURIComponent(query)}`, undefined, signal);
  },

  // --- Invitations ---

  async getInvitations(workspaceId: string, signal?: AbortSignal): Promise<Invitation[]> {
    const rows = await request<unknown[]>('GET', `/invitations?workspace_id=${workspaceId}`, undefined, signal);
    return parseArray(InvitationRowSchema, InvitationSchema, rows, '/invitations');
  },

  async sendInvitation(workspaceId: string, opts: { teamId?: string; projectId?: string; scope?: string; email: string; role: string }): Promise<Invitation> {
    const body: Record<string, unknown> = { workspace_id: workspaceId, email: opts.email, role: opts.role, scope: opts.scope ?? 'workspace' };
    if (opts.teamId) body.team_id = opts.teamId;
    if (opts.projectId) body.project_id = opts.projectId;
    const row = await request<unknown>('POST', '/invitations', body);
    return parseSingle(InvitationRowSchema, InvitationSchema, row, '/invitations');
  },

  async cancelInvitation(id: string): Promise<void> {
    await request<void>('DELETE', `/invitations/${id}`);
  },

  async acceptInvitations(): Promise<Invitation[]> {
    const rows = await request<unknown[]>('POST', '/invitations/accept');
    return parseArray(InvitationRowSchema, InvitationSchema, rows, '/invitations/accept');
  },

  // --- Projects ---

  async getProjects(workspaceId?: string, signal?: AbortSignal): Promise<Project[]> {
    const params = workspaceId ? `?workspace_id=${workspaceId}` : '';
    const rows = await request<unknown[]>('GET', `/projects${params}`, undefined, signal);
    return parseArray(ProjectRowSchema, ProjectSchema, rows, `/projects${params}`);
  },

  async createProject(name: string, parentId?: string, workspaceId?: string, teamId?: string): Promise<Project> {
    const body: Record<string, unknown> = { name };
    if (parentId) body.parent_id = parentId;
    if (workspaceId) body.workspace_id = workspaceId;
    if (teamId) body.team_id = teamId;
    const row = await request<unknown>('POST', '/projects', body);
    return parseSingle(ProjectRowSchema, ProjectSchema, row, '/projects');
  },

  async updateProject(id: string, updates: { name?: string; github_repo_full_name?: string | null; github_repo_default_branch?: string | null }): Promise<Project> {
    const row = await request<unknown>('PATCH', `/projects/${id}`, updates);
    return parseSingle(ProjectRowSchema, ProjectSchema, row, `/projects/${id}`);
  },

  async canDeactivateProject(id: string): Promise<{ canDeactivate: boolean; reason?: string }> {
    return request<{ canDeactivate: boolean; reason?: string }>('GET', `/projects/${id}/can-deactivate`);
  },

  async deleteProject(id: string): Promise<void> {
    await request<void>('DELETE', `/projects/${id}`);
  },

  // --- Requirements ---

  async getRequirements(projectId?: string, signal?: AbortSignal): Promise<Requirement[]> {
    const params = projectId ? `?project_id=${projectId}` : '';
    const rows = await request<unknown[]>('GET', `/requirements${params}`, undefined, signal);
    return parseArray(RequirementRowSchema, RequirementSchema, rows, `/requirements${params}`);
  },

  async getQuestions(requirementId?: string, signal?: AbortSignal): Promise<Question[]> {
    const params = requirementId ? `?requirement_id=${requirementId}` : '';
    const rows = await request<unknown[]>('GET', `/questions${params}`, undefined, signal);
    return parseArray(QuestionRowSchema, QuestionSchema, rows, `/questions${params}`);
  },

  async getAnswers(questionId?: string, signal?: AbortSignal): Promise<Answer[]> {
    const params = questionId ? `?question_id=${questionId}` : '';
    const rows = await request<unknown[]>('GET', `/answers${params}`, undefined, signal);
    return parseArray(AnswerRowSchema, AnswerSchema, rows, `/answers${params}`);
  },

  async enhanceRequirement(text: string, projectId?: string | null, figmaLinks?: string[]): Promise<{ title: string; description: string }> {
    const body: Record<string, unknown> = { text };
    if (projectId) body.project_id = projectId;
    if (figmaLinks && figmaLinks.length > 0) body.figma_links = figmaLinks;
    return request<{ title: string; description: string }>('POST', '/requirements/enhance', body);
  },

  async createRequirement(req: Partial<Requirement> & { projectId?: string; figmaLinks?: string[] }): Promise<Requirement> {
    const body: Record<string, unknown> = {
      id: req.id,
      title: req.title,
      source: req.source || 'Unknown',
      owner: req.owner || 'Unassigned',
      owner_team: req.ownerTeam,
      owner_role: req.ownerRole,
      created_at: req.createdAt,
      description: req.description,
      completeness: req.completeness ?? 0,
      clarity: req.clarity || 'Low',
      risk: req.risk || 'Medium',
      project_id: req.projectId,
    };
    if (req.figmaLinks && req.figmaLinks.length > 0) body.figma_links = req.figmaLinks;
    const row = await request<unknown>('POST', '/requirements', body);
    return parseSingle(RequirementRowSchema, RequirementSchema, row, '/requirements');
  },

  async updateRequirement(id: string, updates: { title?: string; description?: string; owner?: string }): Promise<Requirement> {
    const row = await request<unknown>('PATCH', `/requirements/${id}`, updates);
    return parseSingle(RequirementRowSchema, RequirementSchema, row, `/requirements/${id}`);
  },

  async deleteRequirement(id: string): Promise<void> {
    await request<void>('DELETE', `/requirements/${id}`);
  },

  async checkImplementation(requirementId: string): Promise<{ impl_status: string; impl_confidence: number | null; impl_checked_at: string; impl_evidence?: string }> {
    return request<{ impl_status: string; impl_confidence: number | null; impl_checked_at: string; impl_evidence?: string }>('POST', `/requirements/${requirementId}/check-implementation`);
  },

  async createQuestion(q: { text: string; requirementId: string; importance: string; category: string }): Promise<Question> {
    const body = {
      id: `q${Date.now()}`,
      requirement_id: q.requirementId,
      text: q.text,
      importance: q.importance,
      category: q.category,
      status: 'Unanswered',
      type: 'Manual',
      author: 'User',
      created_at: new Date().toISOString(),
    };
    const row = await request<unknown>('POST', '/questions', body);
    return parseSingle(QuestionRowSchema, QuestionSchema, row, '/questions');
  },

  async classifyQuestion(text: string, requirementId: string): Promise<{ importance: string; category: string }> {
    return request<{ importance: string; category: string }>('POST', '/questions/classify', { text, requirement_id: requirementId });
  },

  async suggestQuestions(requirementId: string): Promise<Question[]> {
    const rows = await request<unknown[]>('POST', `/questions/suggest/${requirementId}`);
    return parseArray(QuestionRowSchema, QuestionSchema, rows, `/questions/suggest/${requirementId}`);
  },

  async deleteQuestion(id: string): Promise<void> {
    await request<void>('DELETE', `/questions/${id}`);
  },

  async updateQuestion(id: string, updates: Record<string, unknown>): Promise<Question> {
    const body: Record<string, unknown> = {};
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.isSuggested !== undefined) body.is_suggested = updates.isSuggested;
    if (updates.isHidden !== undefined) body.is_hidden = updates.isHidden;
    if (updates.type !== undefined) body.type = updates.type;
    if (updates.text !== undefined) body.text = updates.text;

    const row = await request<unknown>('PATCH', `/questions/${id}`, body);
    return parseSingle(QuestionRowSchema, QuestionSchema, row, `/questions/${id}`);
  },

  async createAnswer(a: { text: string; questionId: string; author: string }): Promise<Answer> {
    const body = {
      id: `a${Date.now()}`,
      question_id: a.questionId,
      text: a.text,
      author: a.author,
      date: new Date().toISOString(),
      is_current: false,
    };
    const row = await request<unknown>('POST', '/answers', body);
    return parseSingle(AnswerRowSchema, AnswerSchema, row, '/answers');
  },

  async suggestAnswer(questionId: string): Promise<Answer | { skipped: true; reasoning: string }> {
    const endpoint = `/answers/suggest/${questionId}`;
    const raw = await request<unknown>('POST', endpoint);
    const obj = raw as Record<string, unknown>;
    if (obj.skipped === true) {
      return { skipped: true, reasoning: String(obj.reasoning ?? '') };
    }
    return parseSingle(AnswerRowSchema, AnswerSchema, raw, endpoint);
  },

  async updateAnswer(id: string, updates: Record<string, unknown>): Promise<Answer> {
    const body: Record<string, unknown> = {};
    if (updates.isCurrent !== undefined) body.is_current = updates.isCurrent;
    if (updates.text !== undefined) body.text = updates.text;
    if (updates.isSuggested !== undefined) body.is_suggested = updates.isSuggested;
    if (updates.isHidden !== undefined) body.is_hidden = updates.isHidden;

    const row = await request<unknown>('PATCH', `/answers/${id}`, body);
    return parseSingle(AnswerRowSchema, AnswerSchema, row, `/answers/${id}`);
  },

  // --- GitHub ---

  async getGitHubStatus(signal?: AbortSignal): Promise<{ connected: boolean; username?: string; avatarUrl?: string }> {
    return request<{ connected: boolean; username?: string; avatarUrl?: string }>('GET', '/github/status', undefined, signal);
  },

  async getGitHubAuthUrl(): Promise<{ url: string }> {
    return request<{ url: string }>('GET', '/github/auth');
  },

  async disconnectGitHub(): Promise<void> {
    await request<unknown>('DELETE', '/github/connect');
  },

  async getGitHubRepos(signal?: AbortSignal): Promise<Array<{ id: number; full_name: string; private: boolean; default_branch: string; language: string | null; description: string | null }>> {
    return request<Array<{ id: number; full_name: string; private: boolean; default_branch: string; language: string | null; description: string | null }>>('GET', '/github/repos', undefined, signal);
  },

  async fetchRepoContext(projectId: string): Promise<{ status: string; analysis: unknown }> {
    return request<{ status: string; analysis: unknown }>('POST', `/github/fetch/${projectId}`);
  },

  async deepFetchRepoContext(projectId: string, paths: string[]): Promise<{ status: string; fetchedCount: number; analysis: unknown }> {
    return request<{ status: string; fetchedCount: number; analysis: unknown }>('POST', `/github/fetch/${projectId}/deep`, { paths });
  },

  // --- Summaries ---

  async getSummary(requirementId: string, signal?: AbortSignal): Promise<Summary | null> {
    const rows = await request<unknown[]>('GET', `/summaries?requirement_id=${requirementId}`, undefined, signal);
    if (!rows || rows.length === 0) return null;
    return parseSingle(SummaryRowSchema, SummarySchema, rows[0], `/summaries?requirement_id=${requirementId}`);
  },

  async generateSummary(requirementId: string): Promise<Summary> {
    const row = await request<unknown>('POST', `/summaries/generate/${requirementId}`);
    return parseSingle(SummaryRowSchema, SummarySchema, row, `/summaries/generate/${requirementId}`);
  },

  async notifyCursorSent(requirementId: string): Promise<void> {
    await request<void>('POST', `/summaries/notify-cursor/${requirementId}`);
  },

  // --- Linear ---

  async getLinearAuthUrl(): Promise<{ url: string }> {
    return request<{ url: string }>('GET', '/linear/auth');
  },

  async getLinearStatus(signal?: AbortSignal): Promise<{ connected: boolean; username?: string; avatarUrl?: string }> {
    return request<{ connected: boolean; username?: string; avatarUrl?: string }>('GET', '/linear/status', undefined, signal);
  },

  async disconnectLinear(): Promise<void> {
    await request<unknown>('DELETE', '/linear/connect');
  },

  async getLinearTeams(): Promise<Array<{ id: string; name: string; key: string }>> {
    return request<Array<{ id: string; name: string; key: string }>>('GET', '/linear/teams');
  },

  async getLinearProjects(teamId: string): Promise<Array<{ id: string; name: string }>> {
    return request<Array<{ id: string; name: string }>>('GET', `/linear/projects?team_id=${teamId}`);
  },

  async sendToLinear(requirementId: string): Promise<Requirement> {
    const row = await request<unknown>('POST', `/linear/send/${requirementId}`);
    return parseSingle(RequirementRowSchema, RequirementSchema, row, `/linear/send/${requirementId}`);
  },

  // --- Slack ---

  async getSlackAuthUrl(): Promise<{ url: string }> {
    return request<{ url: string }>('GET', '/slack/auth');
  },

  async getSlackStatus(signal?: AbortSignal): Promise<{ connected: boolean; teamName?: string; teamId?: string }> {
    return request<{ connected: boolean; teamName?: string; teamId?: string }>('GET', '/slack/status', undefined, signal);
  },

  async disconnectSlack(): Promise<void> {
    await request<unknown>('DELETE', '/slack/connect');
  },

  async getSlackChannels(signal?: AbortSignal): Promise<Array<Record<string, unknown>>> {
    return request<Array<Record<string, unknown>>>('GET', '/slack/channels', undefined, signal);
  },

  async linkSlackChannels(projectId: string, channelIds: string[]): Promise<{ linked: number }> {
    return request<{ linked: number }>('POST', `/slack/link-channel/${projectId}`, { channelIds });
  },

  async extractSlackMessages(projectId: string): Promise<{ results: Record<string, number> }> {
    return request<{ results: Record<string, number> }>('POST', `/slack/extract/${projectId}`);
  },

  async setSlackNotificationChannel(projectId: string, channelId: string | null): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('PATCH', `/slack/notify-channel/${projectId}`, { channelId });
  },

  async extractSlackChannelMessages(projectId: string, channelId: string): Promise<{
    messages: Array<{ slack_ts: string; thread_ts?: string; username: string; text: string }>;
  }> {
    return request<{
      messages: Array<{ slack_ts: string; thread_ts?: string; username: string; text: string }>;
    }>('POST', `/slack/extract-messages/${projectId}`, { channelId });
  },

  async analyzeSlackChannel(projectId: string, channelId: string): Promise<{
    messages: Array<{ slack_ts: string; thread_ts?: string; username: string; text: string }>;
    suggestions: Array<{ title: string; description: string; sourceMessageTs: string[] }>;
  }> {
    return request<{
      messages: Array<{ slack_ts: string; thread_ts?: string; username: string; text: string }>;
      suggestions: Array<{ title: string; description: string; sourceMessageTs: string[] }>;
    }>('POST', `/slack/analyze/${projectId}`, { channelId });
  },

  async reanalyzeSlackMessages(projectId: string, messages: Array<{ slack_ts: string; thread_ts?: string; username: string; text: string }>): Promise<{
    suggestions: Array<{ title: string; description: string; sourceMessageTs: string[] }>;
  }> {
    return request<{
      suggestions: Array<{ title: string; description: string; sourceMessageTs: string[] }>;
    }>('POST', `/slack/reanalyze/${projectId}`, { messages });
  },

  // --- Supabase Connect ---

  async getSupabaseConnectStatus(signal?: AbortSignal): Promise<{ connected: boolean; orgName?: string; orgId?: string }> {
    return request<{ connected: boolean; orgName?: string; orgId?: string }>('GET', '/supabase-connect/status', undefined, signal);
  },

  async getSupabaseConnectAuthUrl(): Promise<{ url: string }> {
    return request<{ url: string }>('GET', '/supabase-connect/auth');
  },

  async disconnectSupabase(): Promise<void> {
    await request<unknown>('DELETE', '/supabase-connect/connect');
  },

  async getSupabaseProjects(signal?: AbortSignal): Promise<Array<{ id: string; name: string; organizationId: string; region: string }>> {
    return request<Array<{ id: string; name: string; organizationId: string; region: string }>>('GET', '/supabase-connect/projects', undefined, signal);
  },

  async fetchDbContext(projectId: string): Promise<{ status: string; analysis: unknown }> {
    return request<{ status: string; analysis: unknown }>('POST', `/supabase-connect/fetch/${projectId}`);
  },

  // --- Card Assignees ---

  async getCardAssignees(projectId: string, signal?: AbortSignal): Promise<CardAssignee[]> {
    const raw = await request<unknown[]>('GET', `/card-assignees?project_id=${projectId}`, undefined, signal);
    return parseArray(CardAssigneeRowSchema, CardAssigneeSchema, raw, '/card-assignees');
  },

  async assignUser(entityType: string, entityId: string, userId: string): Promise<CardAssignee> {
    const raw = await request<unknown>('POST', '/card-assignees', { entity_type: entityType, entity_id: entityId, user_id: userId });
    return parseSingle(CardAssigneeRowSchema, CardAssigneeSchema, raw, '/card-assignees');
  },

  async unassignUser(assigneeId: string): Promise<void> {
    await request<void>('DELETE', `/card-assignees/${assigneeId}`);
  },

  // --- Deactivation ---

  async deactivateRequirement(id: string): Promise<Requirement> {
    const raw = await request<unknown>('PATCH', `/requirements/${id}/deactivate`);
    return parseSingle(RequirementRowSchema, RequirementSchema, raw, `/requirements/${id}/deactivate`);
  },

  async deactivateQuestion(id: string): Promise<Question> {
    const raw = await request<unknown>('PATCH', `/questions/${id}/deactivate`);
    return parseSingle(QuestionRowSchema, QuestionSchema, raw, `/questions/${id}/deactivate`);
  },

  async deactivateAnswer(id: string): Promise<Answer> {
    const raw = await request<unknown>('PATCH', `/answers/${id}/deactivate`);
    return parseSingle(AnswerRowSchema, AnswerSchema, raw, `/answers/${id}/deactivate`);
  },

  // --- Document Uploads ---

  async uploadDocument(projectId: string, file: File): Promise<{ uploadId: string; status: string }> {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/documents/upload/${projectId}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        (body as { error?: string }).error || `Upload failed: ${res.status}`,
        res.status,
        `/documents/upload/${projectId}`,
      );
    }

    return res.json();
  },

  async getDocumentStatus(uploadId: string): Promise<{
    id: string;
    project_id: string;
    filename: string;
    status: string;
    error_message: string | null;
    extracted_count: number | null;
    created_at: string;
  }> {
    return request('GET', '/documents/status/' + uploadId);
  },

  async getDocumentPreviewUrl(uploadId: string): Promise<{ url: string }> {
    return request('GET', '/documents/preview-url/' + uploadId);
  },

  async getDocumentResults(uploadId: string): Promise<{
    filename: string;
    requirements: Array<{
      title: string;
      description: string;
      clarity: string;
      risk: string;
    }>;
  }> {
    return request('GET', '/documents/results/' + uploadId);
  },

  async confirmDocumentRequirements(
    uploadId: string,
    requirements: Array<{
      title: string;
      description: string;
      clarity: string;
      risk: string;
      owner?: string;
    }>,
  ): Promise<{ created: number; ids: string[] }> {
    return request('POST', `/documents/confirm/${uploadId}`, { requirements });
  },

  // --- Figma ---

  async getFigmaAuthUrl(): Promise<{ url: string }> {
    return request<{ url: string }>('GET', '/figma/auth');
  },

  async getFigmaStatus(signal?: AbortSignal): Promise<{ connected: boolean; username?: string; email?: string }> {
    return request('GET', '/figma/status', undefined, signal);
  },

  async disconnectFigma(): Promise<void> {
    await request<unknown>('DELETE', '/figma/connect');
  },

  async resolveFigmaDesigns(figmaUrls: string[]): Promise<{
    designs: Array<{
      url: string;
      fileKey: string;
      nodeId: string | null;
      nodeName: string;
      thumbnailUrl: string | null;
      structuralSummary: string;
    }>;
  }> {
    return request('POST', '/figma/resolve', { figma_urls: figmaUrls });
  },
};
