import type { MiniTeam, Step } from '../mini-demo/types';
import type { Requirement, Question } from '../app-demo/types';

export const WORKSPACE_NAME = 'Acme Inc.';

export const TEAMS: MiniTeam[] = [
  {
    id: 't1',
    name: 'Engineering',
    projects: [
      { id: 'p1', name: 'Arvid', isActive: true, children: [
        { id: 'p1a', name: 'Commerce Co...' },
      ]},
      { id: 'p2', name: 'Design System', children: [] },
    ],
  },
];

export interface Repo {
  name: string;
  visibility: 'public' | 'private';
}

export const REPOS: Repo[] = [
  { name: 'acme/web-app', visibility: 'private' },
  { name: 'acme/api-server', visibility: 'private' },
  { name: 'acme/design-system', visibility: 'public' },
];

export const REQUIREMENTS: Requirement[] = [
  { id: 'r1', shortId: 'R01', title: 'Post-Login OAuth Profile Refresh', owner: 'Erik L.', createdAt: 'May 1', completeness: 55, clarity: 'Medium', risk: 'Low' },
  { id: 'r2', shortId: 'R02', title: 'GitHub OAuth & Repository Analysis', owner: 'Erik L.', createdAt: 'Apr 28', completeness: 100, clarity: 'High', risk: 'Low' },
];

export const QUESTIONS: Question[] = [
  { id: 'q1', shortId: 'Q01', text: 'How should the system detect a \'successful login\' to trigger the refresh—via a session flag, or event?', status: 'Unanswered', importance: 'Critical', category: 'Auth', author: 'Arvid', createdAt: 'May 2' },
  { id: 'q2', shortId: 'Q02', text: 'What specific profile fields from GitHub should be synced to the Supabase users table?', status: 'Unanswered', importance: 'Important', category: 'Data', author: 'Arvid', createdAt: 'May 2' },
  { id: 'q3', shortId: 'Q03', text: 'How does the system determine which provider to query for profile data?', status: 'Unanswered', importance: 'Important', category: 'Auth', author: 'Arvid', createdAt: 'May 3' },
];

export const SEQUENCE: Step[] = [
  // Settle — shell appears, sidebar expands (~2.6s)
  { action: 'show_shell', delay: 0 },
  { action: 'expand_project', delay: 1400 },
  { action: 'show_footer', delay: 1200 },

  // Flow — connect repo, fetch requirements, select (~10.2s)
  { action: 'open_selector', delay: 1400 },
  { action: 'select_repo', delay: 2000 },
  { action: 'start_fetching', delay: 1000 },
  { action: 'fetch_done', delay: 2000 },
  { action: 'show_req_1', delay: 1200 },
  { action: 'show_req_2', delay: 1200 },
  { action: 'select_req', delay: 1400 },

  // Resolve — AI suggests questions one by one (~6.4s)
  { action: 'suggest_q1', delay: 1200 },
  { action: 'suggest_q2', delay: 1400 },
  { action: 'accept_q1', delay: 1400 },
  { action: 'suggest_q3', delay: 1200 },
  { action: 'accept_q2', delay: 1200 },

  // Drift — hold, then gently loop (~3.5s)
  { action: 'reset', delay: 3500 },
];
