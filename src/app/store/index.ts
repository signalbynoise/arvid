import { create } from 'zustand';
import { EntitiesSlice, createEntitiesSlice } from './slices/entities';
import { SelectionSlice, createSelectionSlice } from './slices/selection';
import { ProjectsSlice, createProjectsSlice } from './slices/projects';
import { SummariesSlice, createSummariesSlice } from './slices/summaries';
import { GitHubSlice, createGitHubSlice } from './slices/github';
import { LinearSlice, createLinearSlice } from './slices/linear';

export type AppState = EntitiesSlice & SelectionSlice & ProjectsSlice & SummariesSlice & GitHubSlice & LinearSlice;

export const useStore = create<AppState>()((...args) => ({
  ...createEntitiesSlice(...args),
  ...createSelectionSlice(...args),
  ...createProjectsSlice(...args),
  ...createSummariesSlice(...args),
  ...createGitHubSlice(...args),
  ...createLinearSlice(...args),
}));

export type { DataState, DataStatus } from './slices/entities';
export type { SummaryDataState, SummaryDataStatus } from './slices/summaries';
export type { GitHubConnectionState, GitHubRepo, RepoFetchStatus } from './slices/github';
export type { LinearConnectionState, LinearTeam, LinearProject, LinearLinkStatus, SendToLinearStatus } from './slices/linear';
export {
  selectRequirements,
  selectQuestions,
  selectAnswers,
  selectDataState,
  selectProjects,
  selectSelectedReqId,
  selectSelectedQuestionId,
  selectSelectedProjectId,
  selectIsSuggestingQuestions,
  selectIsSuggestingAnswer,
  selectSummary,
  selectSummaryDataState,
} from './selectors';
