import { Folder, Hash } from 'lucide-react';
import type { Project, Requirement, Question, Answer, Summary, Step } from './types';

export const PROJECTS: Project[] = [
  { id: 'p1', name: 'Mobile App', icon: Folder, children: [
    { id: 'p1a', name: 'Auth Flow', icon: Hash },
    { id: 'p1b', name: 'Dashboard', icon: Hash },
  ]},
  { id: 'p2', name: 'Design System', icon: Folder, children: [] },
  { id: 'p3', name: 'API v2', icon: Folder, children: [] },
];

export const REQUIREMENTS: Requirement[] = [
  { id: 'r1', title: 'User authentication with SSO support', owner: 'Sarah K.', completeness: 85, clarity: 'High', risk: 'Low' },
  { id: 'r2', title: 'Real-time notifications system', owner: 'James L.', completeness: 42, clarity: 'Medium', risk: 'Medium' },
  { id: 'r3', title: 'Data export & reporting module', owner: 'Emily R.', completeness: 15, clarity: 'Low', risk: 'High' },
];

export const QUESTIONS_R1: Question[] = [
  { id: 'q1', text: 'What identity providers should be supported beyond Google?', status: 'Answered', importance: 'Critical', category: 'Security' },
  { id: 'q2', text: 'Should session tokens use JWT or opaque references?', status: 'Answered', importance: 'Important', category: 'Architecture' },
  { id: 'q3', text: 'What is the expected concurrent user load at launch?', status: 'Unanswered', importance: 'Critical', category: 'Scale' },
];

export const QUESTIONS_R2: Question[] = [
  { id: 'q4', text: 'Should notifications support push, email, or both?', status: 'Answered', importance: 'Critical', category: 'Channels' },
  { id: 'q5', text: 'What is the acceptable delivery latency for real-time alerts?', status: 'Unanswered', importance: 'Important', category: 'Performance' },
];

export const ANSWERS_R1: Answer[] = [
  { id: 'a1', author: 'Sarah K.', date: 'May 2', text: 'We need Google, Microsoft Entra ID, and generic SAML for enterprise clients.', isCurrent: true },
  { id: 'a2', author: 'David M.', date: 'Apr 28', text: 'Start with Google and Microsoft. SAML can come in v2 if needed.', isCurrent: false },
];

export const ANSWERS_R2: Answer[] = [
  { id: 'a3', author: 'James L.', date: 'May 3', text: 'Both push and email. Push for urgent, email for digests.', isCurrent: true },
];

export const SUMMARY_R1: Summary = {
  title: 'User authentication with SSO support',
  objective: 'Implement SSO authentication supporting Google, Microsoft, and SAML providers with session management...',
  tags: ['OAuth 2.0', 'JWT tokens', 'RBAC'],
  targetCompleteness: 85,
};

export const SUMMARY_R2: Summary = {
  title: 'Real-time notifications system',
  objective: 'Build a multi-channel notification system with push and email delivery, configurable per-user preferences...',
  tags: ['WebSockets', 'FCM', 'SendGrid'],
  targetCompleteness: 42,
};

export const SEQUENCE: Step[] = [
  { action: 'show_shell', delay: 0 },
  { action: 'expand_project', delay: 600 },
  { action: 'show_requirements', delay: 600 },

  { action: 'select_req_0', delay: 1000 },
  { action: 'show_summary', delay: 600 },
  { action: 'suggest_q1', delay: 400 },
  { action: 'suggest_q2', delay: 600 },
  { action: 'accept_q1', delay: 600 },
  { action: 'suggest_q3', delay: 600 },
  { action: 'accept_q2', delay: 500 },
  { action: 'select_question', delay: 700 },
  { action: 'show_answer_1', delay: 400 },
  { action: 'show_answer_2', delay: 500 },
  { action: 'animate_completeness', delay: 500 },
  { action: 'enable_send', delay: 1600 },

  { action: 'select_req_1', delay: 1600 },
  { action: 'show_summary_r2', delay: 600 },
  { action: 'suggest_q4', delay: 400 },
  { action: 'accept_q4', delay: 600 },
  { action: 'suggest_q5', delay: 400 },
  { action: 'select_question_r2', delay: 600 },
  { action: 'show_answer_r2', delay: 400 },
  { action: 'animate_completeness_r2', delay: 600 },

  { action: 'reset', delay: 2100 },
];
