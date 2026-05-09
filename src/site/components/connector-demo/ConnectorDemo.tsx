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
  },
  columns: [
    { key: 'requirements', title: 'Requirements', width: 'w-1/2' },
    { key: 'questions', title: 'Questions', width: 'w-1/2', borderRight: false },
  ],
  shell: {
    className: 'absolute w-[800px] h-[600px] top-[40px] right-[40px] md:right-auto md:left-0',
    shadow: false,
    roundedRight: false,
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
};

export function ConnectorDemo() {
  return <DemoShellView direction={connectorDirection} layout={layout} />;
}
