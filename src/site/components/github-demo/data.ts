import type { Step } from '../app-demo/types';

export interface Repo {
  name: string;
  desc: string;
  lang: string;
  isPrivate: boolean;
}

export const REPOS: Repo[] = [
  { name: 'acme/web-app', desc: 'Main product frontend', lang: 'TypeScript', isPrivate: true },
  { name: 'acme/api-server', desc: 'REST + GraphQL backend', lang: 'Go', isPrivate: true },
  { name: 'acme/design-system', desc: 'Shared component library', lang: 'TypeScript', isPrivate: false },
];

export const SEQUENCE: Step[] = [
  { action: 'show_shell', delay: 0 },
  { action: 'show_repo_section', delay: 800 },
  { action: 'open_selector', delay: 800 },
  { action: 'select_repo', delay: 1600 },
  { action: 'start_fetching', delay: 600 },
  { action: 'fetch_done', delay: 1600 },
  { action: 'show_branch_icon', delay: 400 },
  { action: 'show_req_1', delay: 600 },
  { action: 'show_req_2', delay: 400 },
  { action: 'select_req', delay: 600 },
  { action: 'show_context_badge', delay: 600 },
  { action: 'suggest_q1', delay: 400 },
  { action: 'suggest_q2', delay: 600 },
  { action: 'accept_q1', delay: 600 },
  { action: 'suggest_q3', delay: 600 },
  { action: 'accept_q2', delay: 600 },
  { action: 'reset', delay: 2700 },
];
