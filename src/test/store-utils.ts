import { useStore } from '../app/store';
import { Requirement, Question, Answer, Project } from '../app/types';
import { DEFAULT_PROJECTS } from '../app/constants';

interface StoreOverrides {
  requirements?: Requirement[];
  questions?: Question[];
  answers?: Answer[];
  selectedReqId?: string | null;
  selectedQuestionId?: string | null;
  selectedProjectId?: string;
  projects?: Project[];
  dataState?: { status: 'idle' | 'loading' | 'ready' | 'error'; error?: string; loadedAt?: number; failedAt?: number };
}

export function setStoreState(overrides: StoreOverrides) {
  useStore.setState({
    requirements: overrides.requirements ?? [],
    questions: overrides.questions ?? [],
    answers: overrides.answers ?? [],
    selectedReqId: overrides.selectedReqId ?? null,
    selectedQuestionId: overrides.selectedQuestionId ?? null,
    selectedProjectId: overrides.selectedProjectId ?? 'p1',
    projects: overrides.projects ?? DEFAULT_PROJECTS,
    dataState: overrides.dataState ?? { status: 'ready', loadedAt: Date.now() },
  });
}

export function resetStore() {
  useStore.setState({
    requirements: [],
    questions: [],
    answers: [],
    selectedReqId: null,
    selectedQuestionId: null,
    selectedProjectId: 'p1',
    projects: DEFAULT_PROJECTS,
    dataState: { status: 'idle' },
    abortController: null,
  });
}
