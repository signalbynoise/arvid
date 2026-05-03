import { StateCreator } from 'zustand';
import { Requirement, Question, Answer } from '../../types';
import { api } from '../../api';
import { deriveQuestionStatus } from '../../domain/questions';
import { logger } from '../../logger';

const log = logger.create('store:entities');

export type DataStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface DataState {
  status: DataStatus;
  error?: string;
  loadedAt?: number;
  failedAt?: number;
}

export interface EntitiesSlice {
  requirements: Requirement[];
  questions: Question[];
  answers: Answer[];
  dataState: DataState;
  abortController: AbortController | null;

  loadEntities: () => Promise<void>;
  cancelLoad: () => void;

  createRequirement: (text: string) => Promise<void>;
  useSuggestion: (id: string) => Promise<void>;
  hideSuggestion: (id: string) => Promise<void>;
  toggleCurrentAnswer: (answerId: string) => Promise<void>;
}

export const createEntitiesSlice: StateCreator<EntitiesSlice, [], [], EntitiesSlice> = (set, get) => ({
  requirements: [],
  questions: [],
  answers: [],
  dataState: { status: 'idle' },
  abortController: null,

  loadEntities: async () => {
    const current = get();
    if (current.dataState.status === 'loading') {
      log.debug('loadEntities', 'Already loading, aborting previous');
      current.abortController?.abort();
    }

    const controller = new AbortController();
    set({ dataState: { status: 'loading' }, abortController: controller });
    log.info('loadEntities', 'Starting data fetch');

    try {
      const [reqs, qs, ans] = await Promise.all([
        api.getRequirements(controller.signal),
        api.getQuestions(undefined, controller.signal),
        api.getAnswers(undefined, controller.signal),
      ]);

      set({
        requirements: reqs,
        questions: qs,
        answers: ans,
        dataState: { status: 'ready', loadedAt: Date.now() },
        abortController: null,
      });

      log.info('loadEntities', 'Data loaded successfully', {
        requirements: reqs.length,
        questions: qs.length,
        answers: ans.length,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        log.debug('loadEntities', 'Fetch aborted');
        return;
      }

      const message = err instanceof Error ? err.message : 'Unknown error';
      set({
        dataState: { status: 'error', error: message, failedAt: Date.now() },
        abortController: null,
      });
      log.error('loadEntities', 'Failed to load data', { error: message });
    }
  },

  cancelLoad: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ abortController: null });
      log.debug('cancelLoad', 'Load cancelled');
    }
  },

  createRequirement: async (text: string) => {
    const title = text.length > 50 ? text.substring(0, 50) + '...' : text;
    log.info('createRequirement', 'Creating requirement', { title });

    const newReq: Partial<Requirement> = {
      id: `r${Date.now()}`,
      title,
      source: 'User',
      owner: 'Unassigned',
      completeness: 0,
      clarity: 'Low',
      risk: 'Medium',
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const created = await api.createRequirement(newReq);
      set(state => ({ requirements: [created, ...state.requirements] }));
      log.info('createRequirement', 'Requirement created', { id: created.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('createRequirement', 'Failed to create requirement', { error: message });
    }
  },

  useSuggestion: async (id: string) => {
    log.info('useSuggestion', 'Accepting suggestion', { id });

    set(state => ({
      questions: state.questions.map(q =>
        q.id === id ? { ...q, isSuggested: false, type: 'Manual' as const } : q,
      ),
    }));

    try {
      await api.updateQuestion(id, { isSuggested: false, type: 'Manual' });
    } catch (err) {
      log.error('useSuggestion', 'Failed to persist suggestion acceptance', {
        id,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      set(state => ({
        questions: state.questions.map(q =>
          q.id === id ? { ...q, isSuggested: true, type: 'Auto-generated' as const } : q,
        ),
      }));
    }
  },

  hideSuggestion: async (id: string) => {
    log.info('hideSuggestion', 'Hiding suggestion', { id });

    set(state => ({
      questions: state.questions.map(q =>
        q.id === id ? { ...q, isHidden: true } : q,
      ),
    }));

    try {
      await api.updateQuestion(id, { isHidden: true });
    } catch (err) {
      log.error('hideSuggestion', 'Failed to persist suggestion hide', {
        id,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      set(state => ({
        questions: state.questions.map(q =>
          q.id === id ? { ...q, isHidden: false } : q,
        ),
      }));
    }
  },

  toggleCurrentAnswer: async (answerId: string) => {
    const { answers, questions } = get();
    const toggledAnswer = answers.find(a => a.id === answerId);
    if (!toggledAnswer) return;

    const targetQuestionId = toggledAnswer.questionId;
    const newIsCurrent = !toggledAnswer.isCurrent;

    log.info('toggleCurrentAnswer', 'Toggling answer status', { answerId, newIsCurrent });

    const previousAnswers = answers;
    const previousQuestions = questions;

    const newAnswers = answers.map(a =>
      a.id === answerId ? { ...a, isCurrent: newIsCurrent } : a,
    );
    const newStatus = deriveQuestionStatus(newAnswers, targetQuestionId);
    const newQuestions = questions.map(q =>
      q.id === targetQuestionId ? { ...q, status: newStatus } : q,
    );

    set({ answers: newAnswers, questions: newQuestions });

    try {
      await api.updateAnswer(answerId, { isCurrent: newIsCurrent });
      await api.updateQuestion(targetQuestionId, { status: newStatus });
    } catch (err) {
      log.error('toggleCurrentAnswer', 'Failed to persist answer toggle, rolling back', {
        answerId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      set({ answers: previousAnswers, questions: previousQuestions });
    }
  },
});
