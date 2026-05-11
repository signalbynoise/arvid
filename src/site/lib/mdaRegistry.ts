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
  'accordance-dmc': {
    label: 'Accordance Score & Code Drift',
    component: lazy(() => import('../components/accordance-dmc').then((m) => ({ default: m.AccordanceDmc }))),
  },
  'supabase-dmc': {
    label: 'Arvid Understands Supabase',
    component: lazy(() => import('../components/supabase-dmc').then((m) => ({ default: m.SupabaseDmc }))),
  },
  'slack-dmc': {
    label: 'Arvid Talks to Slack',
    component: lazy(() => import('../components/slack-dmc').then((m) => ({ default: m.SlackDmc }))),
  },
};

export const MDA_OPTIONS = Object.entries(MDA_REGISTRY).map(([id, entry]) => ({
  id,
  label: entry.label,
}));
