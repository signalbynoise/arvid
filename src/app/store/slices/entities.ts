import { StateCreator } from 'zustand';
import { toast } from 'sonner';
import { Requirement, Question, Answer, CardAssignee, EntityType, SimilarRequirement } from '../../types';
import { api, ApiError } from '../../api';
import { deriveQuestionStatus } from '../../domain/questions';
import { scoreToClarityLabel, scoreToRiskLabel } from '../../../../shared/schemas/riskClarity';
import { isSemanticallyDuplicate } from '../../../../shared/lib/textSimilarity';
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
  cardAssignees: Record<string, CardAssignee[]>;
  similarities: Record<string, SimilarRequirement[]>;
  dataState: DataState;
  abortController: AbortController | null;
  isSuggestingQuestions: boolean;
  suggestingForRequirements: Set<string>;
  suggestingAnswerForQuestions: Set<string>;
  skippedAnswerSuggestions: Set<string>;
  checkingImplementation: Set<string>;
  checkingDeploy: Set<string>;
  scoringRequirements: Set<string>;
  pendingScores: { clarityScore?: number; riskScore?: number; clarityReasoning?: string; riskReasoning?: string } | null;

  loadEntities: (projectId?: string) => Promise<void>;
  loadSimilarities: (projectId: string) => Promise<void>;
  refreshRequirements: (projectId?: string) => Promise<void>;
  cancelLoad: () => void;

  enhanceRequirement: (text: string, projectId?: string | null, figmaLinks?: string[]) => Promise<{ title: string; description: string; clarityScore?: number; riskScore?: number; clarityReasoning?: string; riskReasoning?: string }>;
  createRequirement: (text: string, owner: string, title?: string, figmaLinks?: string[]) => Promise<void>;
  updateRequirement: (id: string, updates: { title?: string; description?: string; owner?: string }) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;
  createQuestion: (text: string, requirementId: string, importance: 'Critical' | 'Important' | 'Optional', category: 'Scope' | 'Data' | 'Time' | 'Output' | 'Quality') => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  updateQuestionText: (questionId: string, text: string) => Promise<void>;
  suggestQuestions: (requirementId: string) => Promise<void>;
  createAnswer: (text: string, questionId: string, author: string) => Promise<void>;
  updateAnswerText: (answerId: string, text: string) => Promise<void>;
  suggestAnswer: (questionId: string) => Promise<void>;
  useSuggestedAnswer: (answerId: string) => Promise<void>;
  hideSuggestedAnswer: (answerId: string) => Promise<void>;
  useSuggestion: (id: string) => Promise<void>;
  hideSuggestion: (id: string) => Promise<void>;
  toggleCurrentAnswer: (answerId: string) => Promise<void>;
  checkImplementation: (requirementId: string) => Promise<void>;
  checkDeployStatus: (requirementId: string) => Promise<void>;

  fetchCardAssignees: (projectId: string) => Promise<void>;
  assignUser: (entityType: EntityType, entityId: string, userId: string) => Promise<void>;
  unassignUser: (assigneeId: string, entityType: EntityType, entityId: string) => Promise<void>;
  deactivateEntity: (entityType: EntityType, entityId: string) => Promise<void>;
}

export const createEntitiesSlice: StateCreator<EntitiesSlice, [], [], EntitiesSlice> = (set, get) => ({
  requirements: [],
  questions: [],
  answers: [],
  cardAssignees: {},
  similarities: {},
  dataState: { status: 'idle' },
  abortController: null,
  isSuggestingQuestions: false,
  suggestingForRequirements: new Set(),
  suggestingAnswerForQuestions: new Set(),
  skippedAnswerSuggestions: new Set(),
  checkingImplementation: new Set(),
  checkingDeploy: new Set(),
  scoringRequirements: new Set(),
  pendingScores: null,

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

  loadSimilarities: async (projectId: string) => {
    try {
      log.debug('loadSimilarities', 'Loading project similarities', { projectId });
      const similarities = await api.getProjectSimilarities(projectId);
      set({ similarities });
      log.info('loadSimilarities', 'Similarities loaded', { count: Object.keys(similarities).length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.warn('loadSimilarities', 'Failed to load similarities', { error: message });
    }
  },

  refreshRequirements: async (projectId?: string) => {
    try {
      const reqs = await api.getRequirements(projectId);
      set({ requirements: reqs });
    } catch {
      // Silent refresh -- don't disrupt UI on failure
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

  enhanceRequirement: async (text: string, projectId?: string | null, figmaLinks?: string[]) => {
    log.info('enhanceRequirement', 'Enhancing requirement via AI', { textLength: text.length, figmaLinkCount: figmaLinks?.length });
    try {
      const result = await api.enhanceRequirement(text, projectId, figmaLinks);
      log.info('enhanceRequirement', 'Enhancement complete', { title: result.title, clarityScore: result.clarityScore, riskScore: result.riskScore });

      if (result.clarityScore != null && result.riskScore != null) {
        set({
          pendingScores: {
            clarityScore: result.clarityScore,
            riskScore: result.riskScore,
            clarityReasoning: result.clarityReasoning,
            riskReasoning: result.riskReasoning,
          },
        });
      } else {
        set({ pendingScores: null });
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('enhanceRequirement', 'Enhancement failed', { error: message });
      throw err;
    }
  },

  createRequirement: async (text: string, owner: string, explicitTitle?: string, figmaLinks?: string[]) => {
    const title = explicitTitle || (text.length > 80 ? text.substring(0, 80) + '...' : text);
    log.info('createRequirement', 'Creating requirement', { title, figmaLinkCount: figmaLinks?.length });

    const selectedProjectId = (get() as unknown as { selectedProjectId: string | null }).selectedProjectId;
    const { pendingScores } = get();

    const newReq: Partial<Requirement> & { projectId?: string; figmaLinks?: string[] } = {
      id: `r${Date.now()}`,
      title,
      description: text,
      source: 'User',
      owner,
      completeness: 0,
      clarity: 'Low',
      risk: 'Medium',
      createdAt: new Date().toISOString(),
      projectId: selectedProjectId ?? undefined,
      figmaLinks: figmaLinks && figmaLinks.length > 0 ? figmaLinks : undefined,
    };

    if (pendingScores?.clarityScore != null && pendingScores?.riskScore != null) {
      newReq.clarityScore = pendingScores.clarityScore;
      newReq.riskScore = pendingScores.riskScore;
      newReq.clarityReasoning = pendingScores.clarityReasoning;
      newReq.riskReasoning = pendingScores.riskReasoning;
      newReq.scoresComputedAt = new Date().toISOString();
      newReq.clarity = scoreToClarityLabel(pendingScores.clarityScore);
      newReq.risk = scoreToRiskLabel(pendingScores.riskScore);
    }

    try {
      const created = await api.createRequirement(newReq);
      set(state => ({ requirements: [created, ...state.requirements], pendingScores: null }));
      log.info('createRequirement', 'Requirement created', { id: created.id });

      get().suggestQuestions(created.id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error('Requirement limit reached', {
          description: 'Upgrade to Arvid Plus for unlimited requirements.',
          action: { label: 'Upgrade', onClick: () => window.dispatchEvent(new CustomEvent('arvid:open-account-settings')) },
        });
        log.info('createRequirement', 'Plan limit reached');
        return;
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('createRequirement', 'Failed to create requirement', { error: message });
    }
  },

  updateRequirement: async (id: string, updates: { title?: string; description?: string; owner?: string }) => {
    log.info('updateRequirement', 'Updating requirement', { id, fields: Object.keys(updates) });

    try {
      const updated = await api.updateRequirement(id, updates);
      set(state => ({
        requirements: state.requirements.map(r => r.id === id ? updated : r),
      }));
      log.info('updateRequirement', 'Requirement updated', { id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('updateRequirement', 'Failed to update requirement', { error: message });
    }
  },

  deleteRequirement: async (id: string) => {
    log.info('deleteRequirement', 'Deleting requirement', { id });

    try {
      await api.deleteRequirement(id);
      set(state => ({
        requirements: state.requirements.filter(r => r.id !== id),
        questions: state.questions.filter(q => q.requirementId !== id),
        answers: state.answers.filter(a => {
          const questionIds = state.questions.filter(q => q.requirementId === id).map(q => q.id);
          return !questionIds.includes(a.questionId);
        }),
      }));

      const selection = get() as unknown as { selectedReqId: string | null; selectRequirement: (id: string | null) => void };
      if (selection.selectedReqId === id) {
        selection.selectRequirement(null);
      }

      log.info('deleteRequirement', 'Requirement deleted', { id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('deleteRequirement', 'Failed to delete requirement', { error: message });
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

  deleteQuestion: async (questionId: string) => {
    log.info('deleteQuestion', 'Deleting question', { questionId });

    const question = get().questions.find(q => q.id === questionId);
    const previousQuestions = get().questions;
    const previousAnswers = get().answers;

    set(state => ({
      questions: state.questions.filter(q => q.id !== questionId),
      answers: state.answers.filter(a => a.questionId !== questionId),
    }));

    const selection = get() as unknown as { selectedQuestionId: string | null; selectQuestion: (id: string | null) => void };
    if (selection.selectedQuestionId === questionId) {
      selection.selectQuestion(null);
    }

    try {
      await api.deleteQuestion(questionId);
      log.info('deleteQuestion', 'Question deleted', { questionId });

      if (question?.requirementId) {
        get().suggestQuestions(question.requirementId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('deleteQuestion', 'Failed to delete question, rolling back', { questionId, error: message });
      set({ questions: previousQuestions, answers: previousAnswers });
    }
  },

  updateQuestionText: async (questionId: string, text: string) => {
    log.info('updateQuestionText', 'Updating question text', { questionId });

    const previousQuestions = get().questions;
    set(state => ({
      questions: state.questions.map(q => q.id === questionId ? { ...q, text } : q),
    }));

    try {
      await api.updateQuestion(questionId, { text });
      log.info('updateQuestionText', 'Question text updated', { questionId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('updateQuestionText', 'Failed to update question, rolling back', { questionId, error: message });
      set({ questions: previousQuestions });
    }
  },

  suggestQuestions: async (requirementId: string) => {
    const { suggestingForRequirements, requirements } = get();
    if (suggestingForRequirements.has(requirementId)) {
      log.debug('suggestQuestions', 'Already suggesting for this requirement, skipping', { requirementId });
      return;
    }

    const req = requirements.find(r => r.id === requirementId);
    if (req?.implStatus === 'Implemented') {
      log.debug('suggestQuestions', 'Requirement is implemented, skipping suggestions', { requirementId });
      return;
    }

    log.info('suggestQuestions', 'Requesting AI question suggestions', { requirementId });
    const nextSet = new Set(suggestingForRequirements);
    nextSet.add(requirementId);
    set({ suggestingForRequirements: nextSet, isSuggestingQuestions: nextSet.size > 0 });

    try {
      const suggestions = await api.suggestQuestions(requirementId);

      set(state => {
        const reqQuestions = state.questions.filter(q => q.requirementId === requirementId);
        const exactTexts = new Set(reqQuestions.map(q => q.text.toLowerCase().trim()));
        const allTexts = reqQuestions.map(q => q.text);

        const newSuggestions = suggestions.filter(s => {
          const normalized = s.text.toLowerCase().trim();
          if (exactTexts.has(normalized)) return false;
          if (isSemanticallyDuplicate(s.text, allTexts)) return false;
          exactTexts.add(normalized);
          allTexts.push(s.text);
          return true;
        });

        const updatedSet = new Set(state.suggestingForRequirements);
        updatedSet.delete(requirementId);
        return {
          questions: [...state.questions, ...newSuggestions],
          suggestingForRequirements: updatedSet,
          isSuggestingQuestions: updatedSet.size > 0,
        };
      });

      log.info('suggestQuestions', 'Suggestions updated', {
        requirementId,
        newCount: suggestions.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set(state => {
        const updatedSet = new Set(state.suggestingForRequirements);
        updatedSet.delete(requirementId);
        return {
          suggestingForRequirements: updatedSet,
          isSuggestingQuestions: updatedSet.size > 0,
        };
      });
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

  updateAnswerText: async (answerId: string, text: string) => {
    log.info('updateAnswerText', 'Updating answer text', { answerId });

    const previousAnswers = get().answers;
    set(state => ({
      answers: state.answers.map(a => a.id === answerId ? { ...a, text } : a),
    }));

    try {
      await api.updateAnswer(answerId, { text });
      log.info('updateAnswerText', 'Answer text updated', { answerId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('updateAnswerText', 'Failed to update answer, rolling back', { answerId, error: message });
      set({ answers: previousAnswers });
    }
  },

  suggestAnswer: async (questionId: string) => {
    const { suggestingAnswerForQuestions, skippedAnswerSuggestions, answers, questions } = get();
    if (suggestingAnswerForQuestions.has(questionId)) {
      log.debug('suggestAnswer', 'Already suggesting for this question, skipping', { questionId });
      return;
    }

    if (skippedAnswerSuggestions.has(questionId)) {
      log.debug('suggestAnswer', 'LLM already classified as requires-human, skipping', { questionId });
      return;
    }

    const question = questions.find(q => q.id === questionId);
    if (question?.status === 'Answered') {
      log.debug('suggestAnswer', 'Question already answered, skipping', { questionId });
      return;
    }

    const hasSuggestedAnswer = answers.some(a => a.questionId === questionId && a.isSuggested && !a.isHidden);
    if (hasSuggestedAnswer) {
      log.debug('suggestAnswer', 'Suggested answer already exists, skipping', { questionId });
      return;
    }

    log.info('suggestAnswer', 'Requesting AI answer suggestion', { questionId });
    const nextSet = new Set(suggestingAnswerForQuestions);
    nextSet.add(questionId);
    set({ suggestingAnswerForQuestions: nextSet });

    try {
      const result = await api.suggestAnswer(questionId);

      set(state => {
        const updatedSet = new Set(state.suggestingAnswerForQuestions);
        updatedSet.delete(questionId);

        if ('skipped' in result) {
          log.info('suggestAnswer', 'Question requires human answer', { questionId, reasoning: result.reasoning });
          const nextSkipped = new Set(state.skippedAnswerSuggestions);
          nextSkipped.add(questionId);
          return { suggestingAnswerForQuestions: updatedSet, skippedAnswerSuggestions: nextSkipped };
        }

        const alreadyExists = state.answers.some(a => a.id === result.id);
        return {
          answers: alreadyExists ? state.answers : [...state.answers, result],
          suggestingAnswerForQuestions: updatedSet,
        };
      });

      if (!('skipped' in result)) {
        log.info('suggestAnswer', 'Suggested answer added', { questionId, answerId: result.id });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set(state => {
        const updatedSet = new Set(state.suggestingAnswerForQuestions);
        updatedSet.delete(questionId);
        return { suggestingAnswerForQuestions: updatedSet };
      });
      log.error('suggestAnswer', 'Failed to generate answer suggestion', { questionId, error: message });
    }
  },

  useSuggestedAnswer: async (answerId: string) => {
    log.info('useSuggestedAnswer', 'Accepting suggested answer', { answerId });

    set(state => ({
      answers: state.answers.map(a =>
        a.id === answerId ? { ...a, isSuggested: false } : a,
      ),
    }));

    try {
      await api.updateAnswer(answerId, { isSuggested: false });
      log.info('useSuggestedAnswer', 'Suggested answer accepted', { answerId });
    } catch (err) {
      log.error('useSuggestedAnswer', 'Failed to persist answer acceptance, rolling back', {
        answerId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      set(state => ({
        answers: state.answers.map(a =>
          a.id === answerId ? { ...a, isSuggested: true } : a,
        ),
      }));
    }
  },

  hideSuggestedAnswer: async (answerId: string) => {
    log.info('hideSuggestedAnswer', 'Hiding suggested answer', { answerId });

    set(state => ({
      answers: state.answers.map(a =>
        a.id === answerId ? { ...a, isHidden: true } : a,
      ),
    }));

    try {
      await api.updateAnswer(answerId, { isHidden: true });
      log.info('hideSuggestedAnswer', 'Suggested answer hidden', { answerId });
    } catch (err) {
      log.error('hideSuggestedAnswer', 'Failed to persist answer hide, rolling back', {
        answerId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      set(state => ({
        answers: state.answers.map(a =>
          a.id === answerId ? { ...a, isHidden: false } : a,
        ),
      }));
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
      get().suggestAnswer(id);
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

  checkImplementation: async (requirementId: string) => {
    const { checkingImplementation } = get();
    if (checkingImplementation.has(requirementId)) {
      log.debug('checkImplementation', 'Already checking for this requirement', { requirementId });
      return;
    }

    log.info('checkImplementation', 'Starting implementation check', { requirementId });
    const previousImplStatus = get().requirements.find(r => r.id === requirementId)?.implStatus;
    const nextSet = new Set(checkingImplementation);
    nextSet.add(requirementId);
    set(state => ({
      checkingImplementation: nextSet,
      requirements: state.requirements.map(r =>
        r.id === requirementId ? { ...r, implStatus: 'Checking' as const } : r,
      ),
    }));

    try {
      const result = await api.checkImplementation(requirementId);

      set(state => {
        const updatedSet = new Set(state.checkingImplementation);
        updatedSet.delete(requirementId);
        return {
          requirements: state.requirements.map(r =>
            r.id === requirementId
              ? {
                  ...r,
                  implStatus: result.impl_status as Requirement['implStatus'],
                  implConfidence: result.impl_confidence ?? undefined,
                  implCheckedAt: result.impl_checked_at,
                  implEvidence: result.impl_evidence,
                  implAnalysis: result.impl_analysis ?? undefined,
                  ...(result.deploy_status ? {
                    deployStatus: result.deploy_status as Requirement['deployStatus'],
                    deployUrl: result.deploy_url ?? undefined,
                    deployCheckedAt: result.deploy_checked_at,
                  } : {}),
                }
              : r,
          ),
          checkingImplementation: updatedSet,
        };
      });

      log.info('checkImplementation', 'Check complete', { requirementId, status: result.impl_status });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set(state => {
        const updatedSet = new Set(state.checkingImplementation);
        updatedSet.delete(requirementId);
        return {
          checkingImplementation: updatedSet,
          requirements: state.requirements.map(r =>
            r.id === requirementId ? { ...r, implStatus: previousImplStatus } : r,
          ),
        };
      });
      log.error('checkImplementation', 'Implementation check failed', { requirementId, error: message });
    }
  },

  checkDeployStatus: async (requirementId: string) => {
    const { checkingDeploy } = get();
    if (checkingDeploy.has(requirementId)) {
      log.debug('checkDeployStatus', 'Already checking deploy for this requirement', { requirementId });
      return;
    }

    log.info('checkDeployStatus', 'Starting deploy check', { requirementId });
    const nextSet = new Set(checkingDeploy);
    nextSet.add(requirementId);
    set(state => ({
      checkingDeploy: nextSet,
      requirements: state.requirements.map(r =>
        r.id === requirementId ? { ...r, deployStatus: 'checking' as Requirement['deployStatus'] } : r,
      ),
    }));

    try {
      const result = await api.checkDeployStatus(requirementId);

      set(state => {
        const updatedSet = new Set(state.checkingDeploy);
        updatedSet.delete(requirementId);
        return {
          requirements: state.requirements.map(r =>
            r.id === requirementId
              ? {
                  ...r,
                  deployStatus: result.deploy_status as Requirement['deployStatus'],
                  deployUrl: result.deploy_url ?? undefined,
                  deployCheckedAt: result.deploy_checked_at,
                }
              : r,
          ),
          checkingDeploy: updatedSet,
        };
      });

      log.info('checkDeployStatus', 'Deploy check complete', { requirementId, status: result.deploy_status });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set(state => {
        const updatedSet = new Set(state.checkingDeploy);
        updatedSet.delete(requirementId);
        return {
          checkingDeploy: updatedSet,
          requirements: state.requirements.map(r =>
            r.id === requirementId ? { ...r, deployStatus: 'unknown' as Requirement['deployStatus'] } : r,
          ),
        };
      });
      log.error('checkDeployStatus', 'Deploy check failed', { requirementId, error: message });
    }
  },

  fetchCardAssignees: async (projectId: string) => {
    log.info('fetchCardAssignees', 'Loading assignees for project', { projectId });
    try {
      const assignees = await api.getCardAssignees(projectId);
      const grouped: Record<string, CardAssignee[]> = {};
      for (const a of assignees) {
        const key = `${a.entityType}:${a.entityId}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(a);
      }
      set({ cardAssignees: grouped });
      log.info('fetchCardAssignees', 'Assignees loaded', { count: assignees.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('fetchCardAssignees', 'Failed to load assignees', { error: message });
    }
  },

  assignUser: async (entityType: EntityType, entityId: string, userId: string) => {
    log.info('assignUser', 'Assigning user to entity', { entityType, entityId, userId });
    try {
      const assignee = await api.assignUser(entityType, entityId, userId);
      set(state => {
        const key = `${entityType}:${entityId}`;
        const existing = state.cardAssignees[key] || [];
        return { cardAssignees: { ...state.cardAssignees, [key]: [...existing, assignee] } };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('assignUser', 'Failed to assign user', { entityType, entityId, userId, error: message });
    }
  },

  unassignUser: async (assigneeId: string, entityType: EntityType, entityId: string) => {
    log.info('unassignUser', 'Removing assignment', { assigneeId });
    try {
      await api.unassignUser(assigneeId);
      set(state => {
        const key = `${entityType}:${entityId}`;
        const existing = state.cardAssignees[key] || [];
        return { cardAssignees: { ...state.cardAssignees, [key]: existing.filter(a => a.id !== assigneeId) } };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('unassignUser', 'Failed to unassign user', { assigneeId, error: message });
    }
  },

  deactivateEntity: async (entityType: EntityType, entityId: string) => {
    log.info('deactivateEntity', 'Deactivating entity', { entityType, entityId });
    try {
      if (entityType === 'requirement') {
        await api.deactivateRequirement(entityId);
        set(state => ({
          requirements: state.requirements.filter(r => r.id !== entityId),
        }));
      } else if (entityType === 'question') {
        await api.deactivateQuestion(entityId);
        set(state => ({
          questions: state.questions.filter(q => q.id !== entityId),
        }));
      } else if (entityType === 'answer') {
        await api.deactivateAnswer(entityId);
        set(state => ({
          answers: state.answers.filter(a => a.id !== entityId),
        }));
      }
      log.info('deactivateEntity', 'Entity deactivated', { entityType, entityId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('deactivateEntity', 'Deactivation failed', { entityType, entityId, error: message });
    }
  },
});
