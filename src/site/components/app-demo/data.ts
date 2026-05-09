import type { Team, Requirement, Question, Answer, Summary, Step } from './types';

export const WORKSPACE_NAME = 'Acme Inc.';

export const COLLABORATORS = [
  { id: 'sarah', name: 'Sarah K.' },
  { id: 'arvid', name: 'Arvid' },
  { id: 'david', name: 'David M.' },
] as const;

export const TEAMS: Team[] = [
  {
    id: 't1',
    name: 'Engineering',
    projects: [
      { id: 'p1', name: 'Mobile App', isActive: true, children: [
        { id: 'p1a', name: 'Auth Flow' },
        { id: 'p1b', name: 'Dashboard' },
      ]},
      { id: 'p2', name: 'API v2', children: [] },
    ],
  },
  {
    id: 't2',
    name: 'Design',
    projects: [
      { id: 'p3', name: 'Design System', children: [] },
    ],
  },
];

export const REQUIREMENTS: Requirement[] = [
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
];

export interface SlackSuggestion {
  id: string;
  text: string;
  source: string;
}

export const SLACK_SUGGESTIONS: SlackSuggestion[] = [
  { id: 's1', text: 'API rate limiting for public endpoints', source: '#eng-requests' },
  { id: 's2', text: 'Webhook delivery retry logic', source: '#integrations' },
  { id: 's3', text: 'Browser push notification opt-in', source: '#product' },
];

export const IMPORTED_REQUIREMENT: Requirement = {
  id: 'r13', shortId: 'R13', title: 'API rate limiting for public endpoints', owner: 'Sarah K.', createdAt: 'Today', completeness: 0, clarity: 'Low', risk: 'High',
};

export const QUESTIONS_R13: Question[] = [
  { id: 'q1', shortId: 'Q01', text: 'What rate limit strategy — token bucket or sliding window?', status: 'Answered', importance: 'Critical', category: 'Architecture', author: 'Arvid', createdAt: 'Today' },
  { id: 'q2', shortId: 'Q02', text: 'Should rate limits differ per API key tier or be uniform?', status: 'Answered', importance: 'Important', category: 'Policy', author: 'Arvid', createdAt: 'Today' },
  { id: 'q3', shortId: 'Q03', text: 'How should the system handle burst traffic above the limit?', status: 'Unanswered', importance: 'Critical', category: 'Architecture', author: 'Arvid', createdAt: 'Today' },
  { id: 'q4', shortId: 'Q04', text: 'What response code and body for rate-limited requests?', status: 'Unanswered', importance: 'Important', category: 'API Design', author: 'Arvid', createdAt: 'Today' },
  { id: 'q5', shortId: 'Q05', text: 'Should rate limit headers be included in every response?', status: 'Unanswered', importance: 'Important', category: 'API Design', author: 'Arvid', createdAt: 'Today' },
  { id: 'q6', shortId: 'Q06', text: 'Where should rate limit state be stored — Redis or in-memory?', status: 'Unanswered', importance: 'Critical', category: 'Infrastructure', author: 'Arvid', createdAt: 'Today' },
  { id: 'q7', shortId: 'Q07', text: 'Should webhooks and internal APIs be exempt from rate limits?', status: 'Unanswered', importance: 'Important', category: 'Policy', author: 'Arvid', createdAt: 'Today' },
  { id: 'q8', shortId: 'Q08', text: 'How should rate limits apply to batch endpoints?', status: 'Unanswered', importance: 'Important', category: 'API Design', author: 'Arvid', createdAt: 'Today' },
  { id: 'q9', shortId: 'Q09', text: 'What monitoring and alerting should be in place for limit breaches?', status: 'Unanswered', importance: 'Important', category: 'Observability', author: 'Arvid', createdAt: 'Today' },
  { id: 'q10', shortId: 'Q10', text: 'Should clients be able to request temporary limit increases?', status: 'Unanswered', importance: 'Low', category: 'Policy', author: 'Arvid', createdAt: 'Today' },
  { id: 'q11', shortId: 'Q11', text: 'How does rate limiting interact with authentication middleware?', status: 'Unanswered', importance: 'Important', category: 'Architecture', author: 'Arvid', createdAt: 'Today' },
  { id: 'q12', shortId: 'Q12', text: 'What is the expected request volume at launch per endpoint?', status: 'Unanswered', importance: 'Critical', category: 'Scale', author: 'Arvid', createdAt: 'Today' },
];

export const ANSWERS_R13: Answer[] = [
  { id: 'a1', shortId: 'A01', author: 'David M.', date: 'Today', text: 'Token bucket with configurable burst. Start at 100 req/min for free tier, 1000 for paid.', isCurrent: true },
  { id: 'a2', shortId: 'A02', author: 'Sarah K.', date: 'Today', text: 'Yes, tier-based. Free, Pro, and Enterprise each get separate limits defined in the plan config.', isCurrent: true },
];

export const SUMMARY_R13: Summary = {
  title: 'API rate limiting for public endpoints',
  shortId: 'S13',
  objective: 'Implement token-bucket rate limiting on all public API endpoints with per-tier configuration...',
  tags: ['Rate Limiting', 'Redis', 'API Gateway'],
  targetCompleteness: 35,
};

export const SEQUENCE: Step[] = [
  // ── Settle (~2.6s) ─────────────────────────────────────────────
  { action: 'show_shell', delay: 0 },
  { action: 'show_requirements', delay: 800 },
  { action: 'noop', delay: 800, cursors: [{ id: 'sarah', target: 'req-column-body' }] },
  { action: 'scroll_requirements', delay: 1000 },

  // ── Flow — Import (~6s) ────────────────────────────────────────
  { action: 'noop', delay: 800, cursors: [{ id: 'sarah', target: 'req-add' }] },
  { action: 'show_import_modal', delay: 600 },
  { action: 'noop', delay: 800, cursors: [{ id: 'sarah', target: 'modal-import-slack' }] },
  { action: 'extracting_slack', delay: 600, cursors: [{ id: 'sarah', target: 'req-column-body' }] },
  { action: 'noop', delay: 1200, cursors: [{ id: 'arvid', target: 'modal-import-slack' }] },
  { action: 'show_slack_options', delay: 600 },
  { action: 'noop', delay: 800, cursors: [{ id: 'arvid', target: 'modal-slack-s1' }] },
  { action: 'select_slack_item', delay: 600 },
  { action: 'close_modal', delay: 800 },

  // ── Flow — Knowledge Tree + Questions (~10s) ──────────────────
  { action: 'noop', delay: 800, cursors: [{ id: 'sarah', target: 'req-r13' }] },
  { action: 'select_requirement', delay: 600 },
  { action: 'show_summary', delay: 600 },

  { action: 'noop', delay: 800, cursors: [{ id: 'arvid', target: 'q-column-body' }] },
  { action: 'suggest_q1', delay: 400 },
  { action: 'suggest_q2', delay: 400 },
  { action: 'suggest_q3', delay: 400 },
  { action: 'suggest_q4', delay: 400 },
  { action: 'suggest_q5', delay: 400 },
  { action: 'suggest_q6', delay: 400 },

  { action: 'noop', delay: 800, cursors: [{ id: 'david', target: 'q-q3' }] },
  { action: 'scroll_questions', delay: 800 },

  { action: 'noop', delay: 600, cursors: [{ id: 'david', target: 'q-q1' }] },
  { action: 'accept_q1', delay: 600 },

  { action: 'noop', delay: 600, cursors: [{ id: 'david', target: 'q-q2' }] },
  { action: 'accept_q2', delay: 600 },

  { action: 'select_question', delay: 600 },
  { action: 'noop', delay: 600, cursors: [{ id: 'david', target: 'a-a1' }] },
  { action: 'show_answer_1', delay: 600 },

  { action: 'noop', delay: 600, cursors: [{ id: 'sarah', target: 'a-a2' }] },
  { action: 'show_answer_2', delay: 600 },

  // ── Resolve (~4s) ─────────────────────────────────────────────
  { action: 'noop', delay: 800, cursors: [{ id: 'arvid', target: 'summary' }] },
  { action: 'animate_completeness', delay: 600 },

  { action: 'noop', delay: 600, cursors: [{ id: 'david', target: 'btn-linear' }] },
  { action: 'show_linear_confirmation', delay: 600 },

  { action: 'noop', delay: 600, cursors: [{ id: 'david', target: 'btn-cursor' }] },
  { action: 'show_cursor_confirmation', delay: 600 },

  // ── Drift — fade cursors, hold, then seamless reset ───────────
  { action: 'noop', delay: 1000, cursors: [
    { id: 'sarah', target: 'req-column-body', visible: false },
    { id: 'david', target: 'btn-cursor', visible: false },
    { id: 'arvid', target: 'summary', visible: false },
  ]},
  { action: 'reset', delay: 2000 },
];
