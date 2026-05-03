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
  isSuggestingQuestions: boolean;

  loadEntities: (projectId?: string) => Promise<void>;
  cancelLoad: () => void;

  enhanceRequirement: (text: string, projectId?: string | null) => Promise<{ title: string; description: string }>;
  createRequirement: (text: string, title?: string) => Promise<void>;
  createQuestion: (text: string, requirementId: string, importance: 'Critical' | 'Important' | 'Optional', category: 'Scope' | 'Data' | 'Time' | 'Output' | 'Quality') => Promise<void>;
  suggestQuestions: (requirementId: string) => Promise<void>;
  createAnswer: (text: string, questionId: string, author: string) => Promise<void>;
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
  isSuggestingQuestions: false,

  loadEntities: async (projectId?: string) => {
    const current = get();
    if (current.dataState.status === 'loading') {
      log.debug('loadEntities', 'Already loading, aborting previous');
      current.abortController?.abort();
    }

    const controller = new AbortController();
    set({ dataState: { status: 'loading' }, abortController: controller });
    log.info('loadEntities', 'Starting data fetch', { projectId });

    try {
      const [reqs, qs, ans] = await Promise.all([
        api.getRequirements(projectId, controller.signal),
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

  enhanceRequirement: async (text: string, projectId?: string | null) => {
    log.info('enhanceRequirement', 'Enhancing requirement via AI', { textLength: text.length });
    try {
      const result = await api.enhanceRequirement(text, projectId);
      log.info('enhanceRequirement', 'Enhancement complete', { title: result.title });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('enhanceRequirement', 'Enhancement failed', { error: message });
      throw err;
    }
  },

  createRequirement: async (text: string, explicitTitle?: string) => {
    const title = explicitTitle || (text.length > 80 ? text.substring(0, 80) + '...' : text);
    log.info('createRequirement', 'Creating requirement', { title });

    const newReq: Partial<Requirement> & { projectId?: string } = {
      id: `r${Date.now()}`,
      title,
      description: text,
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

      get().suggestQuestions(created.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('createRequirement', 'Failed to create requirement', { error: message });
    }
  },

  createQuestion: async (text: string, requirementId: string, importance: 'Critical' | 'Important' | 'Optional', category: 'Scope' | 'Data' | 'Time' | 'Output' | 'Quality') => {
    log.info('createQuestion', 'Creating question', { text: text.substring(0, 50), requirementId });

    try {
      const created = await api.createQuestion({
        text,
        requirementId,
        importance,
        category,
      });
      set(state => ({ questions: [...state.questions, created] }));
      log.info('createQuestion', 'Question created', { id: created.id });

      get().suggestQuestions(requirementId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('createQuestion', 'Failed to create question', { error: message });
    }
  },

  suggestQuestions: async (requirementId: string) => {
    if (get().isSuggestingQuestions) {
      log.debug('suggestQuestions', 'Already suggesting, skipping', { requirementId });
      return;
    }

    log.info('suggestQuestions', 'Requesting AI question suggestions', { requirementId });
    set({ isSuggestingQuestions: true });

    try {
      const suggestions = await api.suggestQuestions(requirementId);

      set(state => {
        const withoutOldSuggestions = state.questions.filter(
          q => !(q.requirementId === requirementId && q.isSuggested),
        );
        return {
          questions: [...withoutOldSuggestions, ...suggestions],
          isSuggestingQuestions: false,
        };
      });

      log.info('suggestQuestions', 'Suggestions updated', {
        requirementId,
        newCount: suggestions.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ isSuggestingQuestions: false });
      log.error('suggestQuestions', 'Failed to generate suggestions', { requirementId, error: message });
    }
  },

  createAnswer: async (text: string, questionId: string, author: string) => {
    log.info('createAnswer', 'Creating answer', { questionId, author });

    try {
      const created = await api.createAnswer({ text, questionId, author });
      set(state => ({ answers: [...state.answers, created] }));
      log.info('createAnswer', 'Answer created', { id: created.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('createAnswer', 'Failed to create answer', { error: message });
    }
  },

  useSuggestion: async (id: string) => {
    log.info('useSuggestion', 'Accepting suggestion', { id });

    const question = get().questions.find(q => q.id === id);
    set(state => ({
      questions: state.questions.map(q =>
        q.id === id ? { ...q, isSuggested: false, type: 'Manual' as const } : q,
      ),
    }));

    try {
      await api.updateQuestion(id, { isSuggested: false, type: 'Manual' });

      if (question?.requirementId) {
        get().suggestQuestions(question.requirementId);
      }
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

      const question = questions.find(q => q.id === targetQuestionId);
      if (question?.requirementId) {
        get().suggestQuestions(question.requirementId);
      }
    } catch (err) {
      log.error('toggleCurrentAnswer', 'Failed to persist answer toggle, rolling back', {
        answerId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      set({ answers: previousAnswers, questions: previousQuestions });
    }
  },
});
