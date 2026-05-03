import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAppState } from './useAppState';

vi.mock('../api', () => ({
  api: {
    getRequirements: vi.fn(),
    getQuestions: vi.fn(),
    getAnswers: vi.fn(),
    createRequirement: vi.fn(),
    updateQuestion: vi.fn(),
    updateAnswer: vi.fn(),
  },
}));

import { api } from '../api';

const mockApi = api as unknown as {
  getRequirements: ReturnType<typeof vi.fn>;
  getQuestions: ReturnType<typeof vi.fn>;
  getAnswers: ReturnType<typeof vi.fn>;
  createRequirement: ReturnType<typeof vi.fn>;
  updateQuestion: ReturnType<typeof vi.fn>;
  updateAnswer: ReturnType<typeof vi.fn>;
};

const sampleReqs = [
  { id: 'r1', title: 'Req 1', source: 'User', owner: 'Alice', completeness: 80, clarity: 'High' as const, risk: 'Low' as const },
];

const sampleQuestions = [
  { id: 'q1', requirementId: 'r1', text: 'How?', status: 'Unanswered' as const, importance: 'Critical' as const, type: 'Manual' as const, category: 'Scope' as const },
  { id: 'q2', requirementId: 'r2', text: 'Why?', status: 'Answered' as const, importance: 'Optional' as const, type: 'Manual' as const, category: 'Data' as const },
];

const sampleAnswers = [
  { id: 'a1', questionId: 'q1', text: 'Because', author: 'Bob', date: '2026-01-01', isCurrent: false },
  { id: 'a2', questionId: 'q1', text: 'Therefore', author: 'Carol', date: '2026-01-02', isCurrent: true },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.getRequirements.mockResolvedValue(sampleReqs);
  mockApi.getQuestions.mockResolvedValue(sampleQuestions);
  mockApi.getAnswers.mockResolvedValue(sampleAnswers);
  mockApi.updateQuestion.mockResolvedValue(sampleQuestions[0]);
  mockApi.updateAnswer.mockResolvedValue(sampleAnswers[0]);
  mockApi.createRequirement.mockResolvedValue({ id: 'r99', title: 'New', source: 'User', owner: 'Unassigned', completeness: 0, clarity: 'Low', risk: 'Medium' });
});

describe('useAppState', () => {
  it('loads data on mount and sets loading to false', async () => {
    const { result } = renderHook(() => useAppState());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.requirements).toEqual(sampleReqs);
  });

  it('handles API load failure gracefully', async () => {
    mockApi.getRequirements.mockRejectedValueOnce(new Error('network error'));
    mockApi.getQuestions.mockRejectedValueOnce(new Error('network error'));
    mockApi.getAnswers.mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useAppState());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.requirements).toEqual([]);
  });

  it('filters questions by selected requirement', async () => {
    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.selectRequirement('r1'));

    expect(result.current.questions).toHaveLength(1);
    expect(result.current.questions[0].id).toBe('q1');
  });

  it('filters answers by selected question', async () => {
    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.selectRequirement('r1'));
    act(() => result.current.selectQuestion('q1'));

    expect(result.current.answers).toHaveLength(2);
  });

  it('toggles requirement selection off when clicking same id', async () => {
    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.selectRequirement('r1'));
    expect(result.current.selectedReqId).toBe('r1');

    act(() => result.current.selectRequirement('r1'));
    expect(result.current.selectedReqId).toBeNull();
  });

  it('toggles question selection off when clicking same id', async () => {
    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.selectQuestion('q1'));
    expect(result.current.selectedQuestionId).toBe('q1');

    act(() => result.current.selectQuestion('q1'));
    expect(result.current.selectedQuestionId).toBeNull();
  });

  it('clears selections when project changes', async () => {
    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.selectRequirement('r1'));
    act(() => result.current.setSelectedProjectId('p2'));

    expect(result.current.selectedReqId).toBeNull();
    expect(result.current.selectedQuestionId).toBeNull();
  });

  it('useSuggestion marks question as non-suggested and Manual', async () => {
    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.useSuggestion('q1');
    });

    expect(mockApi.updateQuestion).toHaveBeenCalledWith('q1', { isSuggested: false, type: 'Manual' });
  });

  it('hideSuggestion marks question as hidden', async () => {
    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.hideSuggestion('q1');
    });

    expect(mockApi.updateQuestion).toHaveBeenCalledWith('q1', { isHidden: true });
  });

  it('toggleCurrentAnswer toggles answer and updates question status', async () => {
    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleCurrentAnswer('a1');
    });

    expect(mockApi.updateAnswer).toHaveBeenCalledWith('a1', { isCurrent: true });
    expect(mockApi.updateQuestion).toHaveBeenCalled();
  });

  it('toggleCurrentAnswer does nothing for non-existent answer', async () => {
    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleCurrentAnswer('nonexistent');
    });

    expect(mockApi.updateAnswer).not.toHaveBeenCalled();
  });

  it('createRequirement adds new requirement to state', async () => {
    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createRequirement('A short title');
    });

    expect(mockApi.createRequirement).toHaveBeenCalled();
    expect(result.current.requirements[0].id).toBe('r99');
  });

  it('createRequirement truncates long titles', async () => {
    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const longText = 'A'.repeat(100);
    await act(async () => {
      await result.current.createRequirement(longText);
    });

    const call = mockApi.createRequirement.mock.calls[0][0];
    expect(call.title).toHaveLength(53);
    expect(call.title.endsWith('...')).toBe(true);
  });

  it('createRequirement handles API failure gracefully', async () => {
    mockApi.createRequirement.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const countBefore = result.current.requirements.length;
    await act(async () => {
      await result.current.createRequirement('Will fail');
    });

    expect(result.current.requirements.length).toBe(countBefore);
  });

  it('createProject adds a top-level project', async () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce('New Project');

    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const countBefore = result.current.projects.length;
    act(() => result.current.createProject());

    expect(result.current.projects.length).toBe(countBefore + 1);
    expect(result.current.projects[result.current.projects.length - 1].name).toBe('New Project');
  });

  it('createProject adds a sub-project to existing project', async () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce('Sub Project');

    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.createProject('p1'));

    const parent = result.current.projects.find(p => p.id === 'p1');
    expect(parent?.subProjects?.some(s => s.name === 'Sub Project')).toBe(true);
  });

  it('createProject does nothing when prompt is cancelled', async () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce(null);

    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const countBefore = result.current.projects.length;
    act(() => result.current.createProject());

    expect(result.current.projects.length).toBe(countBefore);
  });

  it('exposes selectedReq derived from requirements', async () => {
    const { result } = renderHook(() => useAppState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.selectedReq).toBeNull();

    act(() => result.current.selectRequirement('r1'));
    expect(result.current.selectedReq?.id).toBe('r1');
  });
});
