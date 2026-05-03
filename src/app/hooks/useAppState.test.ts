import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from '../store';
import { resetStore } from '../../test/store-utils';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    getRequirements: vi.fn().mockResolvedValue([
      { id: 'r1', title: 'Test Req', source: 'User', owner: 'Alice', completeness: 80, clarity: 'High', risk: 'Low' },
    ]),
    getQuestions: vi.fn().mockResolvedValue([
      { id: 'q1', requirementId: 'r1', text: 'Q?', status: 'Unanswered', importance: 'Critical', type: 'Manual', category: 'Scope' },
      { id: 'q2', requirementId: 'r1', text: 'Q2?', status: 'Answered', importance: 'Important', type: 'Manual', category: 'Data' },
    ]),
    getAnswers: vi.fn().mockResolvedValue([
      { id: 'a1', questionId: 'q1', text: 'Answer', author: 'Bob', date: '2026-01-01', isCurrent: true },
      { id: 'a2', questionId: 'q1', text: 'Alt answer', author: 'Eve', date: '2026-01-02', isCurrent: false },
    ]),
    getProjects: vi.fn().mockResolvedValue([
      { id: 'p1', name: 'Test Project', parentId: undefined },
    ]),
    createProject: vi.fn().mockResolvedValue({ id: 'p-new', name: 'New Project', parentId: undefined }),
    createRequirement: vi.fn().mockResolvedValue({
      id: 'r-new', title: 'New Req', source: 'User', owner: 'Unassigned', completeness: 0, clarity: 'Low', risk: 'Medium',
    }),
    updateQuestion: vi.fn().mockResolvedValue({}),
    updateAnswer: vi.fn().mockResolvedValue({}),
    getSummary: vi.fn().mockResolvedValue(null),
    generateSummary: vi.fn().mockResolvedValue({}),
    suggestQuestions: vi.fn().mockResolvedValue([]),
    updateProject: vi.fn().mockResolvedValue({}),
    deleteProject: vi.fn().mockResolvedValue(undefined),
  },
  ApiError: class extends Error {},
  ValidationError: class extends Error {},
}));

const mockedApi = vi.mocked(api);

describe('Zustand store (replaces useAppState)', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('starts in idle state', () => {
    expect(useStore.getState().dataState.status).toBe('idle');
  });

  it('transitions to loading then ready on successful fetch', async () => {
    const promise = useStore.getState().loadEntities();
    expect(useStore.getState().dataState.status).toBe('loading');

    await promise;

    const state = useStore.getState();
    expect(state.dataState.status).toBe('ready');
    expect(state.requirements).toHaveLength(1);
    expect(state.questions).toHaveLength(2);
    expect(state.answers).toHaveLength(2);
  });

  it('transitions to error state on fetch failure', async () => {
    mockedApi.getRequirements.mockRejectedValueOnce(new Error('Network error'));

    await useStore.getState().loadEntities();

    const state = useStore.getState();
    expect(state.dataState.status).toBe('error');
    expect(state.dataState.error).toBe('Network error');
  });

  it('selects and deselects requirements', () => {
    useStore.getState().selectRequirement('r1');
    expect(useStore.getState().selectedReqId).toBe('r1');

    useStore.getState().selectRequirement('r1');
    expect(useStore.getState().selectedReqId).toBeNull();
  });

  it('clears question selection when requirement is selected', () => {
    useStore.setState({ selectedQuestionId: 'q1' });
    useStore.getState().selectRequirement('r1');
    expect(useStore.getState().selectedQuestionId).toBeNull();
  });

  it('selects and deselects questions', () => {
    useStore.getState().selectQuestion('q1');
    expect(useStore.getState().selectedQuestionId).toBe('q1');

    useStore.getState().selectQuestion('q1');
    expect(useStore.getState().selectedQuestionId).toBeNull();
  });

  it('resets selection when project changes', () => {
    useStore.setState({ selectedReqId: 'r1', selectedQuestionId: 'q1' });
    useStore.getState().setSelectedProjectId('p2');

    const state = useStore.getState();
    expect(state.selectedProjectId).toBe('p2');
    expect(state.selectedReqId).toBeNull();
    expect(state.selectedQuestionId).toBeNull();
  });

  it('creates a requirement and prepends to list', async () => {
    useStore.setState({ requirements: [] });
    await useStore.getState().createRequirement('Test creation');

    const state = useStore.getState();
    expect(state.requirements).toHaveLength(1);
    expect(state.requirements[0].title).toBe('New Req');
  });

  it('handles createRequirement API failure gracefully', async () => {
    mockedApi.createRequirement.mockRejectedValueOnce(new Error('Server error'));

    useStore.setState({ requirements: [] });
    await useStore.getState().createRequirement('Failing req');

    expect(useStore.getState().requirements).toHaveLength(0);
  });

  it('creates a top-level project via API', async () => {
    const initialCount = useStore.getState().projects.length;
    await useStore.getState().createProject('New Project');
    expect(useStore.getState().projects).toHaveLength(initialCount + 1);
    expect(mockedApi.createProject).toHaveBeenCalledWith('New Project', undefined);
  });

  it('creates a sub-project via API', async () => {
    await useStore.getState().createProject('Sub Project', 'p1');
    expect(mockedApi.createProject).toHaveBeenCalledWith('Sub Project', 'p1');
  });

  it('loads projects from API', async () => {
    await useStore.getState().loadProjects();
    expect(useStore.getState().projects).toHaveLength(1);
    expect(useStore.getState().projectsDataState.status).toBe('ready');
  });

  it('optimistically toggles answer current status', async () => {
    useStore.setState({
      answers: [
        { id: 'a1', questionId: 'q1', text: 'Answer', author: 'Bob', date: '2026-01-01', isCurrent: true },
      ],
      questions: [
        { id: 'q1', requirementId: 'r1', text: 'Q?', status: 'Answered', importance: 'Critical', type: 'Manual', category: 'Scope' },
      ],
    });

    const promise = useStore.getState().toggleCurrentAnswer('a1');

    const state = useStore.getState();
    expect(state.answers[0].isCurrent).toBe(false);
    expect(state.questions[0].status).toBe('Unanswered');

    await promise;
  });

  it('rolls back on toggleCurrentAnswer API failure', async () => {
    mockedApi.updateAnswer.mockRejectedValueOnce(new Error('fail'));

    useStore.setState({
      answers: [
        { id: 'a1', questionId: 'q1', text: 'Answer', author: 'Bob', date: '2026-01-01', isCurrent: true },
      ],
      questions: [
        { id: 'q1', requirementId: 'r1', text: 'Q?', status: 'Answered', importance: 'Critical', type: 'Manual', category: 'Scope' },
      ],
    });

    await useStore.getState().toggleCurrentAnswer('a1');

    const state = useStore.getState();
    expect(state.answers[0].isCurrent).toBe(true);
    expect(state.questions[0].status).toBe('Answered');
  });
});
