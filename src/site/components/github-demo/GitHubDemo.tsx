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
  },
  columns: [
    { key: 'requirements', title: 'Requirements', width: 'w-1/2' },
    { key: 'questions', title: 'Questions', width: 'w-1/2', borderRight: false },
  ],
  shell: {
    className: 'absolute w-[800px] h-[600px] top-[40px] left-[40px] md:left-auto md:right-0',
    shadow: false,
    roundedRight: false,
  },
  modal: {
    title: 'Connect Repository',
    extractingMessage: 'Arvid is analyzing your codebase...',
  },
};

export function GitHubDemo() {
  return <DemoShellView direction={githubDirection} layout={layout} />;
}
