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
} from '../../shared/schemas';
import { Requirement, Question, Answer, Project, Summary } from './types';
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
  // --- Projects ---

  async getProjects(signal?: AbortSignal): Promise<Project[]> {
    const rows = await request<unknown[]>('GET', '/projects', undefined, signal);
    return parseArray(ProjectRowSchema, ProjectSchema, rows, '/projects');
  },

  async createProject(name: string, parentId?: string): Promise<Project> {
    const body: Record<string, unknown> = { name };
    if (parentId) body.parent_id = parentId;
    const row = await request<unknown>('POST', '/projects', body);
    return parseSingle(ProjectRowSchema, ProjectSchema, row, '/projects');
  },

  async updateProject(id: string, updates: { name?: string }): Promise<Project> {
    const row = await request<unknown>('PATCH', `/projects/${id}`, updates);
    return parseSingle(ProjectRowSchema, ProjectSchema, row, `/projects/${id}`);
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

  async enhanceRequirement(text: string, projectId?: string | null): Promise<{ title: string; description: string }> {
    const body: Record<string, string> = { text };
    if (projectId) body.project_id = projectId;
    return request<{ title: string; description: string }>('POST', '/requirements/enhance', body);
  },

  async createRequirement(req: Partial<Requirement> & { projectId?: string }): Promise<Requirement> {
    const body = {
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
    const row = await request<unknown>('POST', '/requirements', body);
    return parseSingle(RequirementRowSchema, RequirementSchema, row, '/requirements');
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
      created_at: new Date().toISOString().split('T')[0],
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

  async updateQuestion(id: string, updates: Record<string, unknown>): Promise<Question> {
    const body: Record<string, unknown> = {};
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.isSuggested !== undefined) body.is_suggested = updates.isSuggested;
    if (updates.isHidden !== undefined) body.is_hidden = updates.isHidden;
    if (updates.type !== undefined) body.type = updates.type;

    const row = await request<unknown>('PATCH', `/questions/${id}`, body);
    return parseSingle(QuestionRowSchema, QuestionSchema, row, `/questions/${id}`);
  },

  async createAnswer(a: { text: string; questionId: string; author: string }): Promise<Answer> {
    const body = {
      id: `a${Date.now()}`,
      question_id: a.questionId,
      text: a.text,
      author: a.author,
      date: new Date().toISOString().split('T')[0],
      is_current: false,
    };
    const row = await request<unknown>('POST', '/answers', body);
    return parseSingle(AnswerRowSchema, AnswerSchema, row, '/answers');
  },

  async updateAnswer(id: string, updates: Record<string, unknown>): Promise<Answer> {
    const body: Record<string, unknown> = {};
    if (updates.isCurrent !== undefined) body.is_current = updates.isCurrent;

    const row = await request<unknown>('PATCH', `/answers/${id}`, body);
    return parseSingle(AnswerRowSchema, AnswerSchema, row, `/answers/${id}`);
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
};
