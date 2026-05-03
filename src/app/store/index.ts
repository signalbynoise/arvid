import { create } from 'zustand';
import { EntitiesSlice, createEntitiesSlice } from './slices/entities';
import { SelectionSlice, createSelectionSlice } from './slices/selection';
import { ProjectsSlice, createProjectsSlice } from './slices/projects';
import { SummariesSlice, createSummariesSlice } from './slices/summaries';

export type AppState = EntitiesSlice & SelectionSlice & ProjectsSlice & SummariesSlice;

export const useStore = create<AppState>()((...args) => ({
  ...createEntitiesSlice(...args),
  ...createSelectionSlice(...args),
  ...createProjectsSlice(...args),
  ...createSummariesSlice(...args),
}));

export type { DataState, DataStatus } from './slices/entities';
export type { SummaryDataState, SummaryDataStatus } from './slices/summaries';
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
  selectSummary,
  selectSummaryDataState,
} from './selectors';
