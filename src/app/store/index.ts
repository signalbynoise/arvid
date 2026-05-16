import { create } from 'zustand';
import { EntitiesSlice, createEntitiesSlice } from './slices/entities';
import { SelectionSlice, createSelectionSlice } from './slices/selection';
import { ProjectsSlice, createProjectsSlice } from './slices/projects';
import { SummariesSlice, createSummariesSlice } from './slices/summaries';
import { GitHubSlice, createGitHubSlice } from './slices/github';
import { LinearSlice, createLinearSlice } from './slices/linear';
import { SlackSlice, createSlackSlice } from './slices/slack';
import { UISlice, createUISlice } from './slices/ui';
import { WorkspacesSlice, createWorkspacesSlice } from './slices/workspaces';
import { SupabaseConnectSlice, createSupabaseConnectSlice } from './slices/supabaseConnect';
import { FigmaSlice, createFigmaSlice } from './slices/figma';
import { BillingSlice, createBillingSlice } from './slices/billing';
import { SearchSlice, createSearchSlice } from './slices/search';
import { RenderSlice, createRenderSlice } from './slices/render';

export type AppState = EntitiesSlice & SelectionSlice & ProjectsSlice & SummariesSlice & GitHubSlice & LinearSlice & SlackSlice & UISlice & WorkspacesSlice & SupabaseConnectSlice & FigmaSlice & BillingSlice & SearchSlice & RenderSlice;

export const useStore = create<AppState>()((...args) => ({
  ...createEntitiesSlice(...args),
  ...createSelectionSlice(...args),
  ...createProjectsSlice(...args),
  ...createSummariesSlice(...args),
  ...createGitHubSlice(...args),
  ...createLinearSlice(...args),
  ...createSlackSlice(...args),
  ...createUISlice(...args),
  ...createWorkspacesSlice(...args),
  ...createSupabaseConnectSlice(...args),
  ...createFigmaSlice(...args),
  ...createBillingSlice(...args),
  ...createSearchSlice(...args),
  ...createRenderSlice(...args),
}));

export type { UISlice, ModalIntent, PendingModal } from './slices/ui';
export type { DataState, DataStatus } from './slices/entities';
export type { SummaryDataState, SummaryDataStatus } from './slices/summaries';
export type { GitHubConnectionState, GitHubRepo, RepoFetchStatus } from './slices/github';
export type { LinearConnectionState, LinearTeam, LinearProject, LinearLinkStatus, SendToLinearStatus } from './slices/linear';
export type { SlackConnectionState, SlackChannel, ExtractionStatus } from './slices/slack';
export type { SupabaseConnectionState, SupabaseProject, DbFetchStatus } from './slices/supabaseConnect';
export type { FigmaConnectionState, ResolvedFigmaDesign } from './slices/figma';
export type { WorkspacesSlice, WorkspacesDataState, WorkspacesDataStatus, BootStatus } from './slices/workspaces';
export type { BillingSlice, PlanLimits, PlanUsage } from './slices/billing';
export type { SearchSlice, SearchStatus } from './slices/search';
export type { RenderSlice, RenderConnectionState, RenderServiceItem, ProjectRenderService, ProjectServicesStatus } from './slices/render';
export { resolvePlan } from '../domain/billing';
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
  selectWorkspaces,
  selectActiveWorkspaceId,
  selectTeams,
  selectMembers,
  selectInvitations,
  selectCardAssignees,
  selectSimilarities,
  selectScoringRequirements,
  selectPendingScores,
  selectGitHubConnection,
  selectLinearConnection,
  selectSupabaseConnection,
  selectFigmaConnection,
  selectHintRequirementCards,
  selectSubscription,
  selectCurrentPlan,
  selectPlanLimits,
  selectPlanUsage,
  selectSubscriptionLoading,
  selectSearchResults,
  selectSearchStatus,
  selectSearchHasMore,
  selectSearchQuery,
  selectRenderConnection,
} from './selectors';
