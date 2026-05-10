import { lazy, type ComponentType } from 'react';

interface MdaEntry {
  label: string;
  component: React.LazyExoticComponent<ComponentType>;
}

export const MDA_REGISTRY: Record<string, MdaEntry> = {
  'app-demo': {
    label: 'App Demo',
    component: lazy(() => import('../components/app-demo').then((m) => ({ default: m.AppDemo }))),
  },
  'agents-demo': {
    label: 'Agents Demo',
    component: lazy(() => import('../components/agents-demo').then((m) => ({ default: m.AgentsDemo }))),
  },
  'connector-demo': {
    label: 'Connector Demo',
    component: lazy(() => import('../components/connector-demo').then((m) => ({ default: m.ConnectorDemo }))),
  },
  'github-demo': {
    label: 'GitHub Demo',
    component: lazy(() => import('../components/github-demo').then((m) => ({ default: m.GitHubDemo }))),
  },
};

export const MDA_OPTIONS = Object.entries(MDA_REGISTRY).map(([id, entry]) => ({
  id,
  label: entry.label,
}));
