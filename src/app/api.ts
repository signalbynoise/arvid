import { z } from 'zod';
import {
  RequirementSchema,
  QuestionSchema,
  AnswerSchema,
  RequirementRowSchema,
  QuestionRowSchema,
  AnswerRowSchema,
} from '../../shared/schemas';
import { Requirement, Question, Answer } from './types';
import { API_BASE } from './constants';
import { logger } from './logger';

const log = logger.create('api');

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

  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
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
  async getRequirements(signal?: AbortSignal): Promise<Requirement[]> {
    const rows = await request<unknown[]>('GET', '/requirements', undefined, signal);
    return parseArray(RequirementRowSchema, RequirementSchema, rows, '/requirements');
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

  async createRequirement(req: Partial<Requirement>): Promise<Requirement> {
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
    };
    const row = await request<unknown>('POST', '/requirements', body);
    return parseSingle(RequirementRowSchema, RequirementSchema, row, '/requirements');
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

  async updateAnswer(id: string, updates: Record<string, unknown>): Promise<Answer> {
    const body: Record<string, unknown> = {};
    if (updates.isCurrent !== undefined) body.is_current = updates.isCurrent;

    const row = await request<unknown>('PATCH', `/answers/${id}`, body);
    return parseSingle(AnswerRowSchema, AnswerSchema, row, `/answers/${id}`);
  },
};
