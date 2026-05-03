import { useState, useMemo, useEffect } from 'react';
import { api } from '../api';
import { logger } from '../logger';
import { DEFAULT_PROJECTS } from '../constants';
import { Requirement, Question, Answer, Project } from '../types';
import { deriveQuestionStatus } from '../domain/questions';

const log = logger.create('AppState');

export function useAppState() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('p1');

  useEffect(() => {
    async function loadData() {
      log.info('loadData', 'Loading initial data');
      try {
        const [reqs, qs, ans] = await Promise.all([
          api.getRequirements(),
          api.getQuestions(),
          api.getAnswers(),
        ]);
        setRequirements(reqs);
        setQuestions(qs);
        setAnswers(ans);
        log.info('loadData', 'Data loaded successfully', { requirements: reqs.length, questions: qs.length, answers: ans.length });
      } catch (err) {
        log.error('loadData', 'Failed to load data from API', { error: err instanceof Error ? err.message : err });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    setSelectedReqId(null);
    setSelectedQuestionId(null);
  }, [selectedProjectId]);

  const selectedReq = useMemo(
    () => requirements.find(r => r.id === selectedReqId) || null,
    [requirements, selectedReqId],
  );

  const reqQuestions = useMemo(
    () => questions.filter(q => q.requirementId === selectedReqId),
    [questions, selectedReqId],
  );

  const selectedQuestionAnswers = useMemo(
    () => answers.filter(a => a.questionId === selectedQuestionId),
    [answers, selectedQuestionId],
  );

  const selectRequirement = (id: string) => {
    if (id === selectedReqId) {
      setSelectedReqId(null);
      setSelectedQuestionId(null);
    } else {
      setSelectedReqId(id);
      setSelectedQuestionId(null);
    }
    log.debug('selectRequirement', 'Requirement selection changed', { id });
  };

  const selectQuestion = (id: string) => {
    setSelectedQuestionId(id === selectedQuestionId ? null : id);
    log.debug('selectQuestion', 'Question selection changed', { id });
  };

  const useSuggestion = async (id: string) => {
    log.info('useSuggestion', 'Accepting suggestion', { id });
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, isSuggested: false, type: 'Manual' } : q));
    await api.updateQuestion(id, { isSuggested: false, type: 'Manual' });
  };

  const hideSuggestion = async (id: string) => {
    log.info('hideSuggestion', 'Hiding suggestion', { id });
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, isHidden: true } : q));
    await api.updateQuestion(id, { isHidden: true });
  };

  const toggleCurrentAnswer = async (answerId: string) => {
    const toggledAnswer = answers.find(a => a.id === answerId);
    if (!toggledAnswer) return;

    const targetQuestionId = toggledAnswer.questionId;
    const newIsCurrent = !toggledAnswer.isCurrent;

    log.info('toggleCurrentAnswer', 'Toggling answer status', { answerId, newIsCurrent });

    const newAnswers = answers.map(a =>
      a.id === answerId ? { ...a, isCurrent: newIsCurrent } : a,
    );
    setAnswers(newAnswers);
    await api.updateAnswer(answerId, { isCurrent: newIsCurrent });

    const newStatus = deriveQuestionStatus(newAnswers, targetQuestionId);
    setQuestions(prev => prev.map(q =>
      q.id === targetQuestionId ? { ...q, status: newStatus } : q,
    ));
    await api.updateQuestion(targetQuestionId, { status: newStatus });
  };

  const createRequirement = async (text: string) => {
    const title = text.length > 50 ? text.substring(0, 50) + '...' : text;
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

    log.info('createRequirement', 'Creating requirement', { title });
    try {
      const created = await api.createRequirement(newReq);
      setRequirements(prev => [created, ...prev]);
    } catch (err) {
      log.error('createRequirement', 'Failed to create requirement', { error: err instanceof Error ? err.message : err });
    }
  };

  const createProject = (parentId?: string) => {
    const name = prompt('Enter project name:');
    if (!name) return;

    const newProject: Project = { id: `p${Date.now()}`, name, subProjects: [] };
    log.info('createProject', 'Creating project', { name, parentId });

    if (parentId) {
      const addSubProject = (projs: Project[]): Project[] => {
        return projs.map(p => {
          if (p.id === parentId) {
            return { ...p, subProjects: [...(p.subProjects || []), newProject] };
          }
          if (p.subProjects) {
            return { ...p, subProjects: addSubProject(p.subProjects) };
          }
          return p;
        });
      };
      setProjects(addSubProject(projects));
    } else {
      setProjects(prev => [...prev, newProject]);
    }
  };

  return {
    loading,
    requirements,
    questions: reqQuestions,
    answers: selectedQuestionAnswers,
    selectedReqId,
    selectedQuestionId,
    selectedReq,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectRequirement,
    selectQuestion,
    useSuggestion,
    hideSuggestion,
    toggleCurrentAnswer,
    createRequirement,
    createProject,
  };
}
