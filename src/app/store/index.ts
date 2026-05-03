import { create } from 'zustand';
import { EntitiesSlice, createEntitiesSlice } from './slices/entities';
import { SelectionSlice, createSelectionSlice } from './slices/selection';
import { ProjectsSlice, createProjectsSlice } from './slices/projects';

export type AppState = EntitiesSlice & SelectionSlice & ProjectsSlice;

export const useStore = create<AppState>()((...args) => ({
  ...createEntitiesSlice(...args),
  ...createSelectionSlice(...args),
  ...createProjectsSlice(...args),
}));

export type { DataState, DataStatus } from './slices/entities';
export { selectRequirements, selectQuestions, selectAnswers, selectDataState, selectProjects, selectSelectedReqId, selectSelectedQuestionId, selectSelectedProjectId } from './selectors';
