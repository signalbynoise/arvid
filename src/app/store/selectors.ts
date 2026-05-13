import { AppState } from './index';
import { resolvePlan } from '../domain/billing';

export const selectRequirements = (state: AppState) => state.requirements;
export const selectQuestions = (state: AppState) => state.questions;
export const selectAnswers = (state: AppState) => state.answers;
export const selectDataState = (state: AppState) => state.dataState;
export const selectProjects = (state: AppState) => state.projects;

export const selectSelectedReqId = (state: AppState) => state.selectedReqId;
export const selectSelectedQuestionId = (state: AppState) => state.selectedQuestionId;
export const selectSelectedProjectId = (state: AppState) => state.selectedProjectId;

export const selectIsSuggestingQuestions = (state: AppState) =>
  state.selectedReqId ? state.suggestingForRequirements.has(state.selectedReqId) : false;

export const selectIsSuggestingAnswer = (state: AppState) =>
  state.selectedQuestionId ? state.suggestingAnswerForQuestions.has(state.selectedQuestionId) : false;

export const selectIsAnswerSuggestionSkipped = (state: AppState) =>
  state.selectedQuestionId ? state.skippedAnswerSuggestions.has(state.selectedQuestionId) : false;

export const selectSummary = (state: AppState) => state.summary;
export const selectSummaryDataState = (state: AppState) => state.summaryDataState;

export const selectCommandPaletteOpen = (state: AppState) => state.commandPaletteOpen;
export const selectPendingModal = (state: AppState) => state.pendingModal;
export const selectHintRequirementCards = (state: AppState) => state.hintRequirementCards;

export const selectSlackConnection = (state: AppState) => state.slackConnection;
export const selectSlackChannels = (state: AppState) => state.slackChannels;

export const selectWorkspaces = (state: AppState) => state.workspaces;
export const selectActiveWorkspaceId = (state: AppState) => state.activeWorkspaceId;
export const selectTeams = (state: AppState) => state.teams;
export const selectMembers = (state: AppState) => state.members;
export const selectInvitations = (state: AppState) => state.invitations;
export const selectCardAssignees = (state: AppState) => state.cardAssignees;

export const selectGitHubConnection = (state: AppState) => state.githubConnection;
export const selectLinearConnection = (state: AppState) => state.linearConnection;
export const selectSupabaseConnection = (state: AppState) => state.supabaseConnection;
export const selectFigmaConnection = (state: AppState) => state.figmaConnection;

export const selectSimilarities = (state: AppState) => state.similarities;
export const selectScoringRequirements = (state: AppState) => state.scoringRequirements;
export const selectPendingScores = (state: AppState) => state.pendingScores;
export const selectSubscription = (state: AppState) => state.subscription;
export const selectCurrentPlan = (state: AppState) => resolvePlan(state.subscription);
export const selectPlanLimits = (state: AppState) => state.planLimits;
export const selectPlanUsage = (state: AppState) => state.planUsage;
export const selectSubscriptionLoading = (state: AppState) => state.subscriptionLoading;
