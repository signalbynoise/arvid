import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError } from './api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('api', () => {
  describe('getRequirements', () => {
    it('fetches and maps requirements from the API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'r1', title: 'Test Req', source: 'User', owner: 'Alice', owner_team: 'Engineering', completeness: 80, clarity: 'High', risk: 'Low' },
        ],
      });

      const result = await api.getRequirements();

      expect(mockFetch).toHaveBeenCalledWith('/api/requirements', expect.objectContaining({ method: 'GET' }));
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'r1',
        title: 'Test Req',
        shortId: undefined,
        source: 'User',
        owner: 'Alice',
        ownerTeam: 'Engineering',
        ownerRole: undefined,
        createdAt: undefined,
        description: undefined,
        completeness: 80,
        clarity: 'High',
        risk: 'Low',
        projectId: undefined,
        linearIssueId: undefined,
        linearIssueIdentifier: undefined,
        linearIssueUrl: undefined,
        linearStatus: 'Pre-backlog',
        linearStatusType: undefined,
      });
    });

    it('throws ApiError on non-OK response', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(api.getRequirements()).rejects.toThrow(ApiError);
      await expect(api.getRequirements()).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('getQuestions', () => {
    it('fetches all questions without filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'q1', requirement_id: 'r1', text: 'How?', status: 'Unanswered', importance: 'Critical', type: 'Manual', category: 'Scope', is_suggested: false, is_hidden: false, author: 'Bob', author_team: 'Eng', author_role: 'Dev', created_at: '2026-01-01', description: 'desc' },
        ],
      });

      const result = await api.getQuestions();

      expect(mockFetch).toHaveBeenCalledWith('/api/questions', expect.objectContaining({ method: 'GET' }));
      expect(result[0]).toMatchObject({
        id: 'q1',
        requirementId: 'r1',
        text: 'How?',
        status: 'Unanswered',
        isSuggested: false,
        isHidden: false,
        author: 'Bob',
        authorTeam: 'Eng',
        authorRole: 'Dev',
        createdAt: '2026-01-01',
        description: 'desc',
      });
    });

    it('appends requirement_id query param when provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      await api.getQuestions('r1');

      expect(mockFetch).toHaveBeenCalledWith('/api/questions?requirement_id=r1', expect.anything());
    });
  });

  describe('getAnswers', () => {
    it('fetches all answers without filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'a1', question_id: 'q1', text: 'Because...', author: 'Alice', date: '2026-01-01', is_current: true },
        ],
      });

      const result = await api.getAnswers();

      expect(mockFetch).toHaveBeenCalledWith('/api/answers', expect.anything());
      expect(result[0]).toEqual({
        id: 'a1',
        shortId: undefined,
        questionId: 'q1',
        text: 'Because...',
        author: 'Alice',
        date: '2026-01-01',
        isCurrent: true,
        isSuggested: undefined,
        isHidden: undefined,
      });
    });

    it('appends question_id query param when provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      await api.getAnswers('q1');

      expect(mockFetch).toHaveBeenCalledWith('/api/answers?question_id=q1', expect.anything());
    });
  });

  describe('createRequirement', () => {
    it('sends a POST with snake_case body and maps response', async () => {
      const apiResponse = { id: 'r1', title: 'New', source: 'User', owner: 'Bob', completeness: 0, clarity: 'Low', risk: 'Medium' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse,
      });

      const result = await api.createRequirement({ title: 'New', source: 'User', owner: 'Bob' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/requirements',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result.title).toBe('New');
    });

    it('uses default values for optional fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'r2', title: 'X', source: 'Unknown', owner: 'Unassigned', completeness: 0, clarity: 'Low', risk: 'Medium' }),
      });

      await api.createRequirement({ title: 'X' });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.source).toBe('Unknown');
      expect(body.owner).toBe('Unassigned');
      expect(body.completeness).toBe(0);
      expect(body.clarity).toBe('Low');
      expect(body.risk).toBe('Medium');
    });
  });

  describe('updateQuestion', () => {
    it('sends a PATCH with mapped field names', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'q1', requirement_id: 'r1', text: 'Q?', status: 'Answered', importance: 'Critical', type: 'Manual', category: 'Scope' }),
      });

      await api.updateQuestion('q1', { isSuggested: false, type: 'Manual' });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.is_suggested).toBe(false);
      expect(body.type).toBe('Manual');
    });

    it('maps status and isHidden fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'q1', requirement_id: 'r1', text: 'Q?', status: 'Answered', importance: 'Critical', type: 'Manual', category: 'Scope', is_hidden: true }),
      });

      const result = await api.updateQuestion('q1', { status: 'Answered', isHidden: true });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.status).toBe('Answered');
      expect(body.is_hidden).toBe(true);
      expect(result.id).toBe('q1');
    });
  });

  describe('updateAnswer', () => {
    it('sends a PATCH with is_current field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'a1', question_id: 'q1', text: 'Yes', author: 'Alice', date: '2026-01-01', is_current: true }),
      });

      const result = await api.updateAnswer('a1', { isCurrent: true });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.is_current).toBe(true);
      expect(result.isCurrent).toBe(true);
    });

    it('throws ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(api.updateAnswer('a99', { isCurrent: false })).rejects.toThrow(ApiError);
    });
  });

  describe('ApiError', () => {
    it('has name, message, status, and endpoint properties', () => {
      const err = new ApiError('test error', 422, '/test');
      expect(err.name).toBe('ApiError');
      expect(err.message).toBe('test error');
      expect(err.status).toBe(422);
      expect(err.endpoint).toBe('/test');
    });
  });
});
