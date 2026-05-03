import { AppState } from './index';

export const selectRequirements = (state: AppState) => state.requirements;
export const selectQuestions = (state: AppState) => state.questions;
export const selectAnswers = (state: AppState) => state.answers;
export const selectDataState = (state: AppState) => state.dataState;
export const selectProjects = (state: AppState) => state.projects;

export const selectSelectedReqId = (state: AppState) => state.selectedReqId;
export const selectSelectedQuestionId = (state: AppState) => state.selectedQuestionId;
export const selectSelectedProjectId = (state: AppState) => state.selectedProjectId;

export const selectIsSuggestingQuestions = (state: AppState) => state.isSuggestingQuestions;

export const selectSummary = (state: AppState) => state.summary;
export const selectSummaryDataState = (state: AppState) => state.summaryDataState;
