import type { Direction, ContentPool } from '../mini-demo/types';
import {
  openImportModalRule,
  startImportRule,
  extractRule,
  showSuggestionsRule,
  selectSuggestionRule,
  closeModalRule,
  selectRequirementRule,
  generateQuestionsRule,
  acceptQuestionRule,
  selectQuestionRule,
  answerQuestionRule,
} from '../mini-demo/rules';

import { ARVID, JONAS } from '../mini-demo/actors';

const contentPool: ContentPool = {
  requirements: [
    { id: 'gh-r1', shortId: 'R01', title: 'Post-Login OAuth Profile Refresh', owner: 'Erik L.', createdAt: 'May 1', completeness: 0, clarity: 'Low', risk: 'Low', status: 'Pre backlog', implStatus: 'Not implemented' },
    { id: 'gh-r2', shortId: 'R02', title: 'GitHub OAuth & Repository Analysis', owner: 'Erik L.', createdAt: 'Apr 28', completeness: 0, clarity: 'Low', risk: 'Low', status: 'Pre backlog', implStatus: 'Not implemented' },
    { id: 'gh-r3', shortId: 'R03', title: 'Webhook payload validation', owner: 'Erik L.', createdAt: 'Apr 25', completeness: 0, clarity: 'Low', risk: 'Medium', status: 'Pre backlog', implStatus: 'Not implemented' },
  ],
  questions: {
    _default: [
      { id: 'ghq1', shortId: 'Q01', text: 'How should the system detect a successful login to trigger the refresh?', status: 'Unanswered', importance: 'Critical', category: 'Auth', author: 'Arvid', createdAt: 'May 2' },
      { id: 'ghq2', shortId: 'Q02', text: 'What specific profile fields from GitHub should be synced?', status: 'Unanswered', importance: 'Important', category: 'Data', author: 'Arvid', createdAt: 'May 2' },
      { id: 'ghq3', shortId: 'Q03', text: 'How does the system determine which provider to query?', status: 'Unanswered', importance: 'Important', category: 'Auth', author: 'Arvid', createdAt: 'May 3' },
      { id: 'ghq4', shortId: 'Q04', text: 'Should repo analysis run on every push or only on connect?', status: 'Unanswered', importance: 'Critical', category: 'Architecture', author: 'Arvid', createdAt: 'May 3' },
    ],
  },
  answers: {
    _default: [
      { id: 'gha1', shortId: 'A01', author: 'Sarah K.', date: 'Today', text: 'Trigger refresh when OAuth callback succeeds and persist provider session metadata.', isCurrent: true },
      { id: 'gha2', shortId: 'A02', author: 'Sarah K.', date: 'Today', text: 'Sync username, avatar, team memberships, and repository permissions from GitHub.', isCurrent: true },
      { id: 'gha3', shortId: 'A03', author: 'Sarah K.', date: 'Today', text: 'Run repo analysis on initial connect, then queue incremental scans on webhook pushes.', isCurrent: true },
    ],
  },
  slackSuggestions: [
    { id: 'gh-r1', text: 'Post-Login OAuth Profile Refresh', source: 'codebase analysis' },
    { id: 'gh-r2', text: 'GitHub OAuth & Repository Analysis', source: 'codebase analysis' },
    { id: 'gh-r3', text: 'Webhook payload validation', source: 'codebase analysis' },
  ],
};

export const githubDirection: Direction = {
  goal: (s) => s.acceptedQuestions.length >= 2 && Object.values(s.answers).some(answerIds => answerIds.length > 0),

  actors: [JONAS, ARVID],

  rules: [
    openImportModalRule(JONAS.id, 2),
    startImportRule(JONAS.id),
    extractRule(ARVID.id),
    showSuggestionsRule(ARVID.id),
    selectSuggestionRule(ARVID.id),
    closeModalRule(JONAS.id),
    selectRequirementRule(JONAS.id),
    generateQuestionsRule(ARVID.id),
    acceptQuestionRule(JONAS.id, 2),
    selectQuestionRule(JONAS.id),
    answerQuestionRule(JONAS.id),
  ],

  contentPool,

  initialState: {
    browsed: true,
  },
};
