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

import { ARVID, MARIA } from '../mini-demo/actors';

const contentPool: ContentPool = {
  requirements: [
    { id: 'con-r1', shortId: 'R01', title: 'Onboarding flow for new team members', owner: 'Sarah K.', createdAt: 'Today', completeness: 0, clarity: 'Low', risk: 'Medium', status: 'Pre backlog', implStatus: 'Not implemented' },
    { id: 'con-r2', shortId: 'R02', title: 'Customer feedback digest pipeline', owner: 'Sarah K.', createdAt: 'Today', completeness: 0, clarity: 'Low', risk: 'Low', status: 'Pre backlog', implStatus: 'Not implemented' },
    { id: 'con-r3', shortId: 'R03', title: 'Invoice PDF generation for billing', owner: 'Sarah K.', createdAt: 'Today', completeness: 0, clarity: 'Low', risk: 'High', status: 'Pre backlog', implStatus: 'Not implemented' },
    { id: 'con-r4', shortId: 'R04', title: 'Automated contract renewal alerts', owner: 'Sarah K.', createdAt: 'Today', completeness: 0, clarity: 'Low', risk: 'Medium', status: 'Pre backlog', implStatus: 'Not implemented' },
  ],
  questions: {
    _default: [
      { id: 'conq1', shortId: 'Q01', text: 'What onboarding steps are required before accessing production?', status: 'Unanswered', importance: 'Critical', category: 'Process', author: 'Arvid', createdAt: 'Today' },
      { id: 'conq2', shortId: 'Q02', text: 'Should the digest include sentiment analysis or just raw feedback?', status: 'Unanswered', importance: 'Important', category: 'Product', author: 'Arvid', createdAt: 'Today' },
      { id: 'conq3', shortId: 'Q03', text: 'What PDF template engine should be used for invoices?', status: 'Unanswered', importance: 'Important', category: 'Architecture', author: 'Arvid', createdAt: 'Today' },
      { id: 'conq4', shortId: 'Q04', text: 'How far in advance should renewal alerts be triggered?', status: 'Unanswered', importance: 'Critical', category: 'Policy', author: 'Arvid', createdAt: 'Today' },
    ],
  },
  answers: {
    _default: [
      { id: 'cona1', shortId: 'A01', author: 'Sarah K.', date: 'Today', text: 'Gate production access behind onboarding checklist completion and manager approval.', isCurrent: true },
      { id: 'cona2', shortId: 'A02', author: 'Sarah K.', date: 'Today', text: 'Include sentiment tags plus verbatim feedback excerpts in each digest.', isCurrent: true },
      { id: 'cona3', shortId: 'A03', author: 'Sarah K.', date: 'Today', text: 'Use a shared invoice template service so billing exports stay consistent across teams.', isCurrent: true },
    ],
  },
  slackSuggestions: [
    { id: 'con-r1', text: 'Onboarding flow for new team members', source: '#hr-requests' },
    { id: 'con-r2', text: 'Customer feedback digest pipeline', source: 'support@acme.com' },
    { id: 'con-r3', text: 'Invoice PDF generation for billing', source: 'billing-spec.docx' },
    { id: 'con-r4', text: 'Automated contract renewal alerts', source: '#sales-ops' },
  ],
};

export const connectorDirection: Direction = {
  goal: (s) =>
    s.acceptedQuestions.length >= 2 &&
    s.requirements.length >= 3 &&
    Object.values(s.answers).some(answerIds => answerIds.length > 0),

  actors: [MARIA, ARVID],

  rules: [
    openImportModalRule(MARIA.id, 4),
    startImportRule(MARIA.id),
    extractRule(ARVID.id),
    showSuggestionsRule(ARVID.id),
    selectSuggestionRule(ARVID.id),
    closeModalRule(MARIA.id),
    selectRequirementRule(MARIA.id),
    generateQuestionsRule(ARVID.id),
    acceptQuestionRule(MARIA.id, 2),
    selectQuestionRule(MARIA.id),
    answerQuestionRule(MARIA.id),
  ],

  contentPool,

  initialState: {
    browsed: true,
  },
};
