import { Folder } from 'lucide-react';
import { DemoShellView } from '../mini-demo';
import type { DemoLayoutConfig } from '../mini-demo/types';
import { connectorDirection } from './direction';

const layout: DemoLayoutConfig = {
  boundaryId: 'connector-demo',
  workspace: 'Acme Inc.',
  breadcrumbs: [
    { label: 'Acme Inc.' },
    { label: 'Product', icon: Folder },
    { label: 'Platform', icon: Folder },
  ],
  sidebar: {
    teams: [
      { id: 't1', name: 'Product', projects: [
        { id: 'p1', name: 'Platform', isActive: true, children: [{ id: 'p1a', name: 'Onboarding' }, { id: 'p1b', name: 'Billing' }] },
      ]},
    ],
    expandedProjectId: 'p1',
    integrations: [
      { icon: '/slack.svg', label: 'Slack', value: '#product', connected: true },
      { icon: '/linear.svg', label: 'Project', value: 'Platform', connected: true },
    ],
  },
  columns: [
    { key: 'requirements', title: 'Requirements' },
    { key: 'questions', title: 'Questions' },
  ],
  shell: {
    className: 'absolute w-[800px] h-[600px] top-[40px] right-[40px] lg:right-auto lg:left-0 lg:rounded-l-none lg:border-l-0',
    shadow: false,
    roundedRight: true,
  },
  modal: {
    title: 'Import Requirements',
    extractingMessage: 'Arvid is extracting requirements...',
    importOptions: [
      { icon: 'slack', label: 'Import from Slack', primary: true },
      { icon: 'mail', label: 'Import from Email', primary: false },
      { icon: 'file', label: 'Import from Document', primary: false },
    ],
  },
  showAnswers: true,
  showSummary: false,
};

export function ConnectorDemo() {
  return <DemoShellView direction={connectorDirection} layout={layout} />;
}
