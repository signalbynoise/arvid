import type { Direction, ContentPool } from '../mini-demo/types';
import {
  browsRule,
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
  generateSummaryRule,
  exportToLinearRule,
  exportToCursorRule,
  deleteRequirementRule,
} from '../mini-demo/rules';

const SARAH = { id: 'sarah', name: 'Sarah K.' };
const ARVID = { id: 'arvid', name: 'Arvid' };
const DAVID = { id: 'david', name: 'David M.' };

const contentPool: ContentPool = {
  requirements: [
    { id: 'r1', shortId: 'R01', title: 'User authentication with SSO support', owner: 'Sarah K.', createdAt: 'May 1', completeness: 85, clarity: 'High', risk: 'Low' },
    { id: 'r2', shortId: 'R02', title: 'Real-time notifications system', owner: 'James L.', createdAt: 'Apr 29', completeness: 42, clarity: 'Medium', risk: 'Medium' },
    { id: 'r3', shortId: 'R03', title: 'Data export & reporting module', owner: 'Emily R.', createdAt: 'Apr 25', completeness: 15, clarity: 'Low', risk: 'High' },
    { id: 'r4', shortId: 'R04', title: 'Role-based access control', owner: 'David M.', createdAt: 'Apr 22', completeness: 68, clarity: 'High', risk: 'Low' },
    { id: 'r5', shortId: 'R05', title: 'Audit log for compliance', owner: 'Sarah K.', createdAt: 'Apr 20', completeness: 30, clarity: 'Medium', risk: 'High' },
    { id: 'r6', shortId: 'R06', title: 'Webhook event delivery', owner: 'David M.', createdAt: 'Apr 18', completeness: 55, clarity: 'Medium', risk: 'Medium' },
    { id: 'r7', shortId: 'R07', title: 'Multi-tenant data isolation', owner: 'Emily R.', createdAt: 'Apr 15', completeness: 72, clarity: 'High', risk: 'Low' },
    { id: 'r8', shortId: 'R08', title: 'File upload & attachment support', owner: 'James L.', createdAt: 'Apr 12', completeness: 10, clarity: 'Low', risk: 'Medium' },
    { id: 'r9', shortId: 'R09', title: 'Search & filtering engine', owner: 'David M.', createdAt: 'Apr 10', completeness: 48, clarity: 'Medium', risk: 'Low' },
    { id: 'r10', shortId: 'R10', title: 'CI/CD pipeline integration', owner: 'Sarah K.', createdAt: 'Apr 8', completeness: 25, clarity: 'Low', risk: 'High' },
    { id: 'r11', shortId: 'R11', title: 'Email digest scheduling', owner: 'Emily R.', createdAt: 'Apr 5', completeness: 60, clarity: 'High', risk: 'Low' },
    { id: 'r12', shortId: 'R12', title: 'GraphQL API gateway', owner: 'David M.', createdAt: 'Apr 3', completeness: 38, clarity: 'Medium', risk: 'Medium' },
    { id: 'slack-1', shortId: 'R13', title: 'API rate limiting for public endpoints', owner: 'Sarah K.', createdAt: 'Today', completeness: 0, clarity: 'Low', risk: 'High' },
    { id: 'slack-2', shortId: 'R14', title: 'Webhook delivery retry logic', owner: 'Sarah K.', createdAt: 'Today', completeness: 0, clarity: 'Low', risk: 'Medium' },
    { id: 'slack-3', shortId: 'R15', title: 'Browser push notification opt-in', owner: 'Sarah K.', createdAt: 'Today', completeness: 0, clarity: 'Low', risk: 'Medium' },
  ],
  questions: {
    _default: [
      { id: 'q1', shortId: 'Q01', text: 'What rate limit strategy — token bucket or sliding window?', status: 'Unanswered', importance: 'Critical', category: 'Architecture', author: 'Arvid', createdAt: 'Today' },
      { id: 'q2', shortId: 'Q02', text: 'Should rate limits differ per API key tier or be uniform?', status: 'Unanswered', importance: 'Important', category: 'Policy', author: 'Arvid', createdAt: 'Today' },
      { id: 'q3', shortId: 'Q03', text: 'How should the system handle burst traffic above the limit?', status: 'Unanswered', importance: 'Critical', category: 'Architecture', author: 'Arvid', createdAt: 'Today' },
      { id: 'q4', shortId: 'Q04', text: 'What response code and body for rate-limited requests?', status: 'Unanswered', importance: 'Important', category: 'API Design', author: 'Arvid', createdAt: 'Today' },
      { id: 'q5', shortId: 'Q05', text: 'Should rate limit headers be included in every response?', status: 'Unanswered', importance: 'Important', category: 'API Design', author: 'Arvid', createdAt: 'Today' },
      { id: 'q6', shortId: 'Q06', text: 'Where should rate limit state be stored — Redis or in-memory?', status: 'Unanswered', importance: 'Critical', category: 'Infrastructure', author: 'Arvid', createdAt: 'Today' },
      { id: 'q7', shortId: 'Q07', text: 'Should webhooks and internal APIs be exempt from rate limits?', status: 'Unanswered', importance: 'Important', category: 'Policy', author: 'Arvid', createdAt: 'Today' },
      { id: 'q8', shortId: 'Q08', text: 'How should rate limits apply to batch endpoints?', status: 'Unanswered', importance: 'Important', category: 'API Design', author: 'Arvid', createdAt: 'Today' },
      { id: 'q9', shortId: 'Q09', text: 'What monitoring and alerting should be in place?', status: 'Unanswered', importance: 'Important', category: 'Observability', author: 'Arvid', createdAt: 'Today' },
      { id: 'q10', shortId: 'Q10', text: 'Should clients be able to request temporary limit increases?', status: 'Unanswered', importance: 'Low', category: 'Policy', author: 'Arvid', createdAt: 'Today' },
      { id: 'q11', shortId: 'Q11', text: 'How does rate limiting interact with authentication middleware?', status: 'Unanswered', importance: 'Important', category: 'Architecture', author: 'Arvid', createdAt: 'Today' },
      { id: 'q12', shortId: 'Q12', text: 'What is the expected request volume at launch per endpoint?', status: 'Unanswered', importance: 'Critical', category: 'Scale', author: 'Arvid', createdAt: 'Today' },
    ],
  },
  answers: {
    _default: [
      { id: 'a1', shortId: 'A01', author: 'David M.', date: 'Today', text: 'Token bucket with configurable burst. Start at 100 req/min for free tier, 1000 for paid.', isCurrent: true },
      { id: 'a2', shortId: 'A02', author: 'Sarah K.', date: 'Today', text: 'Yes, tier-based. Free, Pro, and Enterprise each get separate limits defined in the plan config.', isCurrent: true },
    ],
  },
  slackSuggestions: [
    { id: 'slack-1', text: 'API rate limiting for public endpoints', source: '#eng-requests' },
    { id: 'slack-2', text: 'Webhook delivery retry logic', source: '#integrations' },
    { id: 'slack-3', text: 'Browser push notification opt-in', source: '#product' },
  ],
};

export const heroDirection: Direction = {
  goal: (s) => s.exports.includes('cursor'),

  actors: [SARAH, ARVID, DAVID],

  rules: [
    browsRule(SARAH.id),
    openImportModalRule(SARAH.id),
    startImportRule(SARAH.id),
    extractRule(ARVID.id),
    showSuggestionsRule(ARVID.id),
    selectSuggestionRule(ARVID.id),
    closeModalRule(SARAH.id),
    deleteRequirementRule(SARAH.id, 5),
    selectRequirementRule(SARAH.id),
    generateQuestionsRule(ARVID.id),
    acceptQuestionRule(DAVID.id, 2),
    acceptQuestionRule(SARAH.id, 1),
    selectQuestionRule(DAVID.id),
    answerQuestionRule(DAVID.id),
    answerQuestionRule(SARAH.id),
    generateSummaryRule(ARVID.id),
    exportToLinearRule(DAVID.id),
    exportToCursorRule(DAVID.id),
  ],

  contentPool,

  initialState: {
    requirements: contentPool.requirements.slice(0, 2).map(r => r.id),
  },
};
