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
} from '../mini-demo/rules';

const SARAH = { id: 'sarah', name: 'Sarah K.' };
const ARVID = { id: 'arvid', name: 'Arvid' };

const contentPool: ContentPool = {
  requirements: [
    { id: 'gh-r1', shortId: 'R01', title: 'Post-Login OAuth Profile Refresh', owner: 'Erik L.', createdAt: 'May 1', completeness: 0, clarity: 'Low', risk: 'Low' },
    { id: 'gh-r2', shortId: 'R02', title: 'GitHub OAuth & Repository Analysis', owner: 'Erik L.', createdAt: 'Apr 28', completeness: 0, clarity: 'Low', risk: 'Low' },
    { id: 'gh-r3', shortId: 'R03', title: 'Webhook payload validation', owner: 'Erik L.', createdAt: 'Apr 25', completeness: 0, clarity: 'Low', risk: 'Medium' },
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
    _default: [],
  },
  slackSuggestions: [
    { id: 'gh-r1', text: 'Post-Login OAuth Profile Refresh', source: 'codebase analysis' },
    { id: 'gh-r2', text: 'GitHub OAuth & Repository Analysis', source: 'codebase analysis' },
    { id: 'gh-r3', text: 'Webhook payload validation', source: 'codebase analysis' },
  ],
};

export const githubDirection: Direction = {
  goal: (s) => s.acceptedQuestions.length >= 2,

  actors: [SARAH, ARVID],

  rules: [
    openImportModalRule(SARAH.id, 2),
    startImportRule(SARAH.id),
    extractRule(ARVID.id),
    showSuggestionsRule(ARVID.id),
    selectSuggestionRule(ARVID.id),
    closeModalRule(SARAH.id),
    selectRequirementRule(SARAH.id),
    generateQuestionsRule(ARVID.id),
    acceptQuestionRule(SARAH.id, 2),
  ],

  contentPool,
};
