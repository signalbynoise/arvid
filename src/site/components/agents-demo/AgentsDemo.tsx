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
    { key: 'questions', title: 'Questions', width: 'w-1/3' },
  ],
  shell: {
    className: 'absolute w-[800px] h-[600px] top-[40px] left-[40px] md:left-auto md:right-0',
    shadow: false,
    roundedRight: false,
  },
  showAnswers: true,
  showSummary: true,
};

export function AgentsDemo() {
  return <DemoShellView direction={agentsDirection} layout={layout} />;
}
