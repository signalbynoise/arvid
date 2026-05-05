import { create } from 'zustand';
import { EntitiesSlice, createEntitiesSlice } from './slices/entities';
import { SelectionSlice, createSelectionSlice } from './slices/selection';
import { ProjectsSlice, createProjectsSlice } from './slices/projects';
import { SummariesSlice, createSummariesSlice } from './slices/summaries';
import { GitHubSlice, createGitHubSlice } from './slices/github';
import { LinearSlice, createLinearSlice } from './slices/linear';
import { SlackSlice, createSlackSlice } from './slices/slack';
import { UISlice, createUISlice } from './slices/ui';

export type AppState = EntitiesSlice & SelectionSlice & ProjectsSlice & SummariesSlice & GitHubSlice & LinearSlice & SlackSlice & UISlice;

export const useStore = create<AppState>()((...args) => ({
  ...createEntitiesSlice(...args),
  ...createSelectionSlice(...args),
  ...createProjectsSlice(...args),
  ...createSummariesSlice(...args),
  ...createGitHubSlice(...args),
  ...createLinearSlice(...args),
  ...createSlackSlice(...args),
  ...createUISlice(...args),
}));

export type { UISlice, ModalIntent, PendingModal } from './slices/ui';
export type { DataState, DataStatus } from './slices/entities';
export type { SummaryDataState, SummaryDataStatus } from './slices/summaries';
export type { GitHubConnectionState, GitHubRepo, RepoFetchStatus } from './slices/github';
export type { LinearConnectionState, LinearTeam, LinearProject, LinearLinkStatus, SendToLinearStatus } from './slices/linear';
export type { SlackConnectionState, SlackChannel, ExtractionStatus } from './slices/slack';
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
  selectIsAnswerSuggestionSkipped,
  selectSummary,
  selectSummaryDataState,
  selectCommandPaletteOpen,
  selectPendingModal,
  selectSlackConnection,
  selectSlackChannels,
} from './selectors';
