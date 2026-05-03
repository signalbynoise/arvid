import { AppState } from './index';

export const selectRequirements = (state: AppState) => state.requirements;
export const selectQuestions = (state: AppState) => state.questions;
export const selectAnswers = (state: AppState) => state.answers;
export const selectDataState = (state: AppState) => state.dataState;
export const selectProjects = (state: AppState) => state.projects;

export const selectSelectedReqId = (state: AppState) => state.selectedReqId;
export const selectSelectedQuestionId = (state: AppState) => state.selectedQuestionId;
export const selectSelectedProjectId = (state: AppState) => state.selectedProjectId;

export const selectSelectedReq = (state: AppState) =>
  state.requirements.find(r => r.id === state.selectedReqId) ?? null;

export const selectReqQuestions = (state: AppState) =>
  state.questions.filter(q => q.requirementId === state.selectedReqId);

export const selectSelectedQuestionAnswers = (state: AppState) =>
  state.answers.filter(a => a.questionId === state.selectedQuestionId);
