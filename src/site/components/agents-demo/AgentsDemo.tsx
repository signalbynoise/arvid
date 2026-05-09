import { Folder, Network } from 'lucide-react';
import { DemoShellView } from '../mini-demo';
import type { DemoLayoutConfig } from '../mini-demo/types';
import { agentsDirection } from './direction';

const layout: DemoLayoutConfig = {
  boundaryId: 'agents-demo',
  workspace: 'Acme Inc.',
  breadcrumbs: [
    { label: 'Acme Inc.' },
    { label: 'Engineering', icon: Network },
    { label: 'Mobile App', icon: Folder },
  ],
  sidebar: {
    teams: [
      { id: 't1', name: 'Engineering', projects: [
        { id: 'p1', name: 'Mobile App', isActive: true, children: [{ id: 'p1a', name: 'Auth Flow' }, { id: 'p1b', name: 'Notifications' }] },
      ]},
    ],
    expandedProjectId: 'p1',
    integrations: [
      { icon: '/github.svg', label: 'Repository', value: 'acme/mobile-app', connected: true },
      { icon: '/cursor.svg', label: 'Cursor', value: 'Connected', connected: true },
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
  showAnswers: true,
  showSummary: false,
};

export function AgentsDemo() {
  return <DemoShellView direction={agentsDirection} layout={layout} />;
}
