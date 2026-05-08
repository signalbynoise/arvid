import type { Team, Requirement, Question, Answer, Summary, Step } from './types';

export const WORKSPACE_NAME = 'Acme Inc.';

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
];

export const QUESTIONS_R1: Question[] = [
  { id: 'q1', shortId: 'Q01', text: 'What identity providers should be supported beyond Google?', status: 'Answered', importance: 'Critical', category: 'Security', author: 'Arvid', createdAt: 'May 2' },
  { id: 'q2', shortId: 'Q02', text: 'Should session tokens use JWT or opaque references?', status: 'Answered', importance: 'Important', category: 'Architecture', author: 'Arvid', createdAt: 'May 2' },
  { id: 'q3', shortId: 'Q03', text: 'What is the expected concurrent user load at launch?', status: 'Unanswered', importance: 'Critical', category: 'Scale', author: 'Arvid', createdAt: 'May 3' },
];

export const QUESTIONS_R2: Question[] = [
  { id: 'q4', shortId: 'Q04', text: 'Should notifications support push, email, or both?', status: 'Answered', importance: 'Critical', category: 'Channels', author: 'Arvid', createdAt: 'May 3' },
  { id: 'q5', shortId: 'Q05', text: 'What is the acceptable delivery latency for real-time alerts?', status: 'Unanswered', importance: 'Important', category: 'Performance', author: 'Arvid', createdAt: 'May 4' },
];

export const ANSWERS_R1: Answer[] = [
  { id: 'a1', shortId: 'A01', author: 'Sarah K.', date: 'May 2', text: 'We need Google, Microsoft Entra ID, and generic SAML for enterprise clients.', isCurrent: true },
  { id: 'a2', shortId: 'A02', author: 'David M.', date: 'Apr 28', text: 'Start with Google and Microsoft. SAML can come in v2 if needed.', isCurrent: false },
];

export const ANSWERS_R2: Answer[] = [
  { id: 'a3', shortId: 'A03', author: 'James L.', date: 'May 3', text: 'Both push and email. Push for urgent, email for digests.', isCurrent: true },
];

export const SUMMARY_R1: Summary = {
  title: 'User authentication with SSO support',
  shortId: 'S01',
  objective: 'Implement SSO authentication supporting Google, Microsoft, and SAML providers with session management...',
  tags: ['OAuth 2.0', 'JWT tokens', 'RBAC'],
  targetCompleteness: 85,
};

export const SUMMARY_R2: Summary = {
  title: 'Real-time notifications system',
  shortId: 'S02',
  objective: 'Build a multi-channel notification system with push and email delivery, configurable per-user preferences...',
  tags: ['WebSockets', 'FCM', 'SendGrid'],
  targetCompleteness: 42,
};

export const SEQUENCE: Step[] = [
  { action: 'show_shell', delay: 0 },
  { action: 'expand_project', delay: 1000 },
  { action: 'show_requirements', delay: 1000 },

  { action: 'select_req_0', delay: 1600 },
  { action: 'show_summary', delay: 1000 },
  { action: 'suggest_q1', delay: 800 },
  { action: 'suggest_q2', delay: 1000 },
  { action: 'accept_q1', delay: 1000 },
  { action: 'suggest_q3', delay: 1000 },
  { action: 'accept_q2', delay: 800 },
  { action: 'select_question', delay: 1200 },
  { action: 'show_answer_1', delay: 800 },
  { action: 'show_answer_2', delay: 800 },
  { action: 'animate_completeness', delay: 800 },
  { action: 'enable_send', delay: 2400 },

  { action: 'select_req_1', delay: 2400 },
  { action: 'show_summary_r2', delay: 1000 },
  { action: 'suggest_q4', delay: 800 },
  { action: 'accept_q4', delay: 1000 },
  { action: 'suggest_q5', delay: 800 },
  { action: 'select_question_r2', delay: 1000 },
  { action: 'show_answer_r2', delay: 800 },
  { action: 'animate_completeness_r2', delay: 1000 },

  { action: 'reset', delay: 3500 },
];
