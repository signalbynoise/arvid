import { useStore } from '../app/store';
import { Requirement, Question, Answer, Project, Summary } from '../app/types';

interface StoreOverrides {
  requirements?: Requirement[];
  questions?: Question[];
  answers?: Answer[];
  selectedReqId?: string | null;
  selectedQuestionId?: string | null;
  selectedProjectId?: string | null;
  projects?: Project[];
  dataState?: { status: 'idle' | 'loading' | 'ready' | 'error'; error?: string; loadedAt?: number; failedAt?: number };
  summary?: Summary | null;
}

export function setStoreState(overrides: StoreOverrides) {
  useStore.setState({
    requirements: overrides.requirements ?? [],
    questions: overrides.questions ?? [],
    answers: overrides.answers ?? [],
    selectedReqId: overrides.selectedReqId ?? null,
    selectedQuestionId: overrides.selectedQuestionId ?? null,
    selectedProjectId: overrides.selectedProjectId ?? 'p1',
    projects: overrides.projects ?? [],
    dataState: overrides.dataState ?? { status: 'ready', loadedAt: Date.now() },
    summary: overrides.summary ?? null,
    summaryDataState: { status: 'idle' },
    isSuggestingQuestions: false,
    suggestingForRequirements: new Set(),
    suggestingAnswerForQuestions: new Set(),
  });
}

export function resetStore() {
  useStore.setState({
    requirements: [],
    questions: [],
    answers: [],
    selectedReqId: null,
    selectedQuestionId: null,
    selectedProjectId: null,
    projects: [],
    dataState: { status: 'idle' },
    abortController: null,
    isSuggestingQuestions: false,
    suggestingForRequirements: new Set(),
    suggestingAnswerForQuestions: new Set(),
    summary: null,
    summaryDataState: { status: 'idle' },
    projectsDataState: { status: 'idle' },
  });
}
