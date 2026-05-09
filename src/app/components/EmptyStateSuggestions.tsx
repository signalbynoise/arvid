import React, { useMemo } from 'react';
import { Plus, Users, Command, LoaderPinwheel, MousePointerClick } from 'lucide-react';
import { SuggestionAction } from './SuggestionAction';
import { useStore, selectRequirements, selectGitHubConnection, selectLinearConnection, selectSlackConnection, selectSupabaseConnection } from '../store';
import { api } from '../api';
import { logger } from '../logger';

const log = logger.create('EmptyStateSuggestions');

interface IntegrationSuggestion {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  connect: () => Promise<void>;
}

interface EmptyStateSuggestionsProps {
  onCreateRequirement: () => void;
  onInviteMembers: () => void;
  onOpenCommandPalette: () => void;
}

export function EmptyStateSuggestions({
  onCreateRequirement,
  onInviteMembers,
  onOpenCommandPalette,
}: EmptyStateSuggestionsProps) {
  const requirements = useStore(selectRequirements);
  const githubConnection = useStore(selectGitHubConnection);
  const linearConnection = useStore(selectLinearConnection);
  const slackConnection = useStore(selectSlackConnection);
  const supabaseConnection = useStore(selectSupabaseConnection);
  const flashRequirementHint = useStore(s => s.flashRequirementHint);

  const hasRequirements = requirements.length > 0;

  const disconnectedIntegrations = useMemo<IntegrationSuggestion[]>(() => {
    const items: IntegrationSuggestion[] = [];

    if (githubConnection.status !== 'connected') {
      items.push({
        id: 'github',
        icon: <img src="/github.svg" alt="" className="w-4 h-4 opacity-40" />,
        label: 'Connect GitHub',
        description: 'Link repositories for code-aware analysis',
        connect: async () => {
          log.info('connect', 'Initiating GitHub OAuth from empty state');
          const { url } = await api.getGitHubAuthUrl();
          window.location.href = url;
        },
      });
    }

    if (supabaseConnection.status !== 'connected') {
      items.push({
        id: 'supabase',
        icon: <img src="/supabase.svg" alt="" className="w-4 h-4 opacity-40" />,
        label: 'Connect Supabase',
        description: 'Import database schema as project context',
        connect: async () => {
          log.info('connect', 'Initiating Supabase OAuth from empty state');
          const { url } = await api.getSupabaseConnectAuthUrl();
          window.location.href = url;
        },
      });
    }

    if (linearConnection.status !== 'connected') {
      items.push({
        id: 'linear',
        icon: <img src="/linear.svg" alt="" className="w-4 h-4 opacity-40" />,
        label: 'Connect Linear',
        description: 'Sync issues and track implementation status',
        connect: async () => {
          log.info('connect', 'Initiating Linear OAuth from empty state');
          const { url } = await api.getLinearAuthUrl();
          window.location.href = url;
        },
      });
    }

    if (slackConnection.status !== 'connected') {
      items.push({
        id: 'slack',
        icon: <img src="/slack.svg" alt="" className="w-4 h-4 opacity-40" />,
        label: 'Connect Slack',
        description: 'Extract knowledge from team conversations',
        connect: async () => {
          log.info('connect', 'Initiating Slack OAuth from empty state');
          const { url } = await api.getSlackAuthUrl();
          window.location.href = url;
        },
      });
    }

    return items;
  }, [
    githubConnection.status,
    linearConnection.status,
    slackConnection.status,
    supabaseConnection.status,
  ]);

  const hasDisconnectedIntegrations = disconnectedIntegrations.length > 0;

  return (
    <div className="flex-1 bg-surface-panel flex flex-col items-center justify-center text-text-quaternary">
      <LoaderPinwheel size={48} className="mb-8 opacity-10" />

      <div className="w-[320px] space-y-1">
        <SuggestionAction
          icon={<Plus size={16} />}
          label="Create a requirement"
          description="Define what your project needs to deliver"
          onClick={onCreateRequirement}
        />
        <SuggestionAction
          icon={<Users size={16} />}
          label="Invite team members"
          description="Collaborate on requirements and answers"
          onClick={onInviteMembers}
        />
        <SuggestionAction
          icon={<Command size={16} />}
          label="Open Command Central"
          description="Quick actions, search, and navigation"
          onClick={onOpenCommandPalette}
        />

        {hasDisconnectedIntegrations && (
          <>
            <div className="border-t border-border-subtle my-2" />
            {disconnectedIntegrations.map((integration) => (
              <SuggestionAction
                key={integration.id}
                icon={integration.icon}
                label={integration.label}
                description={integration.description}
                onClick={integration.connect}
              />
            ))}
          </>
        )}

        {hasRequirements && (
          <>
            <div className="border-t border-border-subtle my-2" />
            <SuggestionAction
              icon={<MousePointerClick size={16} />}
              label="Select a requirement"
              description="View its knowledge flow and questions"
              onClick={flashRequirementHint}
            />
          </>
        )}
      </div>
    </div>
  );
}
