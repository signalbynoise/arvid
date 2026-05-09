import { Network, Folder } from 'lucide-react';
import { DemoShellView } from '../mini-demo';
import type { DemoLayoutConfig } from '../mini-demo/types';
import { heroDirection } from './direction';

const layout: DemoLayoutConfig = {
  boundaryId: 'hero',
  workspace: 'Acme Inc.',
  breadcrumbs: [
    { label: 'Acme Inc.' },
    { label: 'Engineering', icon: Network },
    { label: 'Mobile App', icon: Folder },
  ],
  sidebar: {
    teams: [
      { id: 't1', name: 'Engineering', projects: [
        { id: 'p1', name: 'Mobile App', isActive: true, children: [{ id: 'p1a', name: 'Auth Flow' }, { id: 'p1b', name: 'Dashboard' }] },
        { id: 'p2', name: 'API v2', children: [] },
      ]},
      { id: 't2', name: 'Design', projects: [
        { id: 'p3', name: 'Design System', children: [] },
      ]},
    ],
    expandedProjectId: 'p1',
    integrations: [
      { icon: '/github.svg', label: 'Repository', value: 'acme/mobile-app', connected: true },
      { icon: '/linear.svg', label: 'Project', value: 'Mobile App', connected: true },
      { icon: '/slack.svg', label: 'Alerts', value: '#mobile-alerts', connected: true },
    ],
  },
  columns: [
    { key: 'requirements', title: 'Requirements' },
    { key: 'questions', title: 'Questions' },
  ],
  shell: {
    className: 'absolute bottom-0 right-0 h-[90%] w-[calc(100%-20px)] max-w-[1180px] md:left-1/2 md:right-auto md:w-[95%] md:-translate-x-1/2 lg:min-w-[900px]',
    containerClassName: 'relative w-full h-full',
    roundedBottom: false,
  },
  modal: {
    title: 'Import Requirements',
    extractingMessage: 'Arvid is analyzing Slack messages...',
  },
  showAnswers: true,
  showSummary: true,
};

export function AppDemo() {
  return <DemoShellView direction={heroDirection} layout={layout} />;
}
