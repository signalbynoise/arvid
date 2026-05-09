import { Folder } from 'lucide-react';
import { DemoShellView } from '../mini-demo';
import type { DemoLayoutConfig } from '../mini-demo/types';
import { githubDirection } from './direction';

const layout: DemoLayoutConfig = {
  boundaryId: 'github-demo',
  workspace: 'Acme Inc.',
  breadcrumbs: [
    { label: 'Acme Inc.' },
    { label: 'Engineering', icon: Folder },
    { label: 'Arvid', icon: Folder },
  ],
  sidebar: {
    teams: [
      { id: 't1', name: 'Engineering', projects: [
        { id: 'p1', name: 'Arvid', isActive: true, children: [{ id: 'p1a', name: 'Commerce Co...' }] },
        { id: 'p2', name: 'Design System', children: [] },
      ]},
    ],
    expandedProjectId: 'p1',
    integrations: [
      { icon: '/github.svg', label: 'Repository', value: 'acme/web-app', connected: true },
    ],
  },
  columns: [
    { key: 'requirements', title: 'Requirements' },
    { key: 'questions', title: 'Questions' },
  ],
  shell: {
    className: 'absolute w-[800px] h-[600px] top-[40px] left-[40px] lg:left-auto lg:right-0 lg:rounded-r-none lg:border-r-0',
    shadow: false,
    roundedRight: false,
  },
  modal: {
    title: 'Connect Repository',
    extractingMessage: 'Arvid is analyzing your codebase...',
  },
  showAnswers: true,
  showSummary: false,
};

export function GitHubDemo() {
  return <DemoShellView direction={githubDirection} layout={layout} />;
}
