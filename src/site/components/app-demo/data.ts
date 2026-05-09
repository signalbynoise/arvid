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
  { id: 'q2', shortId: 'Q02', text: 'Should rate limits differ per API key tier or be uniform?', status: 'Unanswered', importance: 'Important', category: 'Policy', author: 'Arvid', createdAt: 'Today' },
];

export const ANSWERS_R13: Answer[] = [
  { id: 'a1', shortId: 'A01', author: 'David M.', date: 'Today', text: 'Token bucket with configurable burst. Start at 100 req/min for free tier, 1000 for paid.', isCurrent: true },
];

export const SUMMARY_R13: Summary = {
  title: 'API rate limiting for public endpoints',
  shortId: 'S13',
  objective: 'Implement token-bucket rate limiting on all public API endpoints with per-tier configuration...',
  tags: ['Rate Limiting', 'Redis', 'API Gateway'],
  targetCompleteness: 35,
};

export const SEQUENCE: Step[] = [
  // ── Settle (~3s / 10%) ─────────────────────────────────────────
  // Beat 1: Shell appears with 12 requirements
  { action: 'show_shell', delay: 0 },
  { action: 'show_requirements', delay: 800 },

  // Beat 2: Sarah scrolls the requirements column
  { action: 'noop', delay: 800, cursors: [{ id: 'sarah', x: '22%', y: '30%' }] },
  { action: 'scroll_requirements', delay: 1000 },

  // ── Flow — Import (~7s) ────────────────────────────────────────
  // Beat 3: Sarah moves to "+" button
  { action: 'noop', delay: 800, cursors: [{ id: 'sarah', x: '33%', y: '7%' }] },

  // Step 1: Modal opens with big "Import from Slack" button
  { action: 'show_import_modal', delay: 600 },

  // Sarah clicks the import button
  { action: 'noop', delay: 800, cursors: [{ id: 'sarah', x: '48%', y: '46%' }] },

  // Step 2: Arvid extracts — Sarah steps back, Arvid takes over
  { action: 'extracting_slack', delay: 600, cursors: [{ id: 'sarah', x: '22%', y: '30%' }] },
  { action: 'noop', delay: 1200, cursors: [{ id: 'arvid', x: '48%', y: '42%' }] },

  // Step 3: Suggestions appear, Arvid selects the first one
  { action: 'show_slack_options', delay: 600 },
  { action: 'noop', delay: 800, cursors: [{ id: 'arvid', x: '46%', y: '40%' }] },
  { action: 'select_slack_item', delay: 600 },

  // Modal closes, new req appears
  { action: 'close_modal', delay: 800 },

  // ── Flow — Knowledge Tree (~8s) ───────────────────────────────
  // Beat 9: Sarah clicks the new requirement
  { action: 'noop', delay: 800, cursors: [{ id: 'sarah', x: '22%', y: '16%' }] },
  { action: 'select_requirement', delay: 600 },
  { action: 'show_summary', delay: 600 },

  // Beat 11: Arvid generates Q01
  { action: 'noop', delay: 800, cursors: [{ id: 'arvid', x: '42%', y: '14%' }] },
  { action: 'suggest_q1', delay: 600 },

  // Beat 12: Arvid generates Q02
  { action: 'noop', delay: 600, cursors: [{ id: 'arvid', x: '42%', y: '30%' }] },
  { action: 'suggest_q2', delay: 600 },

  // Beat 13: Sarah accepts Q01
  { action: 'noop', delay: 800, cursors: [{ id: 'sarah', x: '44%', y: '16%' }] },
  { action: 'accept_q1', delay: 600 },

  // Beat 14: David appears, selects Q01
  { action: 'noop', delay: 800, cursors: [{ id: 'david', x: '46%', y: '18%' }] },
  { action: 'select_question', delay: 600 },

  // Beat 15: David answers
  { action: 'noop', delay: 600, cursors: [{ id: 'david', x: '66%', y: '14%' }] },
  { action: 'show_answer', delay: 600 },

  // ── Resolve (~6s / 20%) ───────────────────────────────────────
  // Beat 16: Arvid at Summary, completeness rises
  { action: 'noop', delay: 800, cursors: [{ id: 'arvid', x: '86%', y: '16%' }] },
  { action: 'animate_completeness', delay: 600 },

  // Beat 17: David sends to Linear
  { action: 'noop', delay: 800, cursors: [{ id: 'david', x: '84%', y: '62%' }] },
  { action: 'show_linear_confirmation', delay: 600 },

  // Beat 18: David sends to Cursor
  { action: 'noop', delay: 800, cursors: [{ id: 'david', x: '88%', y: '62%' }] },
  { action: 'show_cursor_confirmation', delay: 600 },

  // ── Drift (~2.6s / 9%) ────────────────────────────────────────
  // Beat 19: Hold, fade, loop
  { action: 'reset', delay: 2600 },
];
