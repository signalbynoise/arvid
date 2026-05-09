import React, { useMemo } from 'react';
import {
  Plus, Users, Command, LoaderPinwheel, MousePointerClick, FolderPlus,
} from 'lucide-react';
import { SuggestionAction } from './SuggestionAction';
import {
  useStore,
  selectRequirements,
  selectProjects,
  selectSelectedProjectId,
  selectGitHubConnection,
  selectLinearConnection,
  selectSlackConnection,
  selectSupabaseConnection,
} from '../store';
import type { IntegrationFocus } from '../store/slices/ui';
import { api } from '../api';
import { logger } from '../logger';

const log = logger.create('EmptyStateSuggestions');

interface Suggestion {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  action: () => void;
}

interface EmptyStateSuggestionsProps {
  onCreateRequirement: () => void;
  onCreateSubProject: () => void;
  onInviteMembers: () => void;
  onOpenCommandPalette: () => void;
}

export function EmptyStateSuggestions({
  onCreateRequirement,
  onCreateSubProject,
  onInviteMembers,
  onOpenCommandPalette,
}: EmptyStateSuggestionsProps) {
  const requirements = useStore(selectRequirements);
  const projects = useStore(selectProjects);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const githubConnection = useStore(selectGitHubConnection);
  const linearConnection = useStore(selectLinearConnection);
  const slackConnection = useStore(selectSlackConnection);
  const supabaseConnection = useStore(selectSupabaseConnection);
  const flashRequirementHint = useStore(s => s.flashRequirementHint);
  const focusIntegration = useStore(s => s.focusIntegration);

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  const hasRequirements = requirements.length > 0;

  const suggestions = useMemo<Suggestion[]>(() => {
    const items: Suggestion[] = [];

    if (!hasRequirements) {
      items.push({
        id: 'create-req',
        icon: <Plus size={16} />,
        label: 'Create a requirement',
        description: 'Define what your project needs to deliver',
        action: onCreateRequirement,
      });
    }

    items.push({
      id: 'invite',
      icon: <Users size={16} />,
      label: 'Invite members to project',
      description: 'Collaborate on requirements and answers',
      action: onInviteMembers,
    });

    items.push({
      id: 'sub-project',
      icon: <FolderPlus size={16} />,
      label: 'Create a sub-project',
      description: 'Organize work into smaller scopes',
      action: onCreateSubProject,
    });

    return items;
  }, [hasRequirements, onCreateRequirement, onInviteMembers, onCreateSubProject]);

  const integrationSuggestions = useMemo<Suggestion[]>(() => {
    const items: Suggestion[] = [];

    const ghConnected = githubConnection.status === 'connected';
    const linearConnected = linearConnection.status === 'connected';
    const slackConnected = slackConnection.status === 'connected';
    const supabaseConnected = supabaseConnection.status === 'connected';

    if (ghConnected && selectedProject && !selectedProject.githubRepo) {
      items.push({
        id: 'link-repo',
        icon: <img src="/github.svg" alt="" className="w-4 h-4 opacity-40" />,
        label: 'Link a repository',
        description: 'Connect a GitHub repo to this project',
        action: () => focusIntegration('repository'),
      });
    } else if (!ghConnected) {
      items.push({
        id: 'connect-github',
        icon: <img src="/github.svg" alt="" className="w-4 h-4 opacity-40" />,
        label: 'Connect GitHub',
        description: 'Link repositories for code-aware analysis',
        action: async () => {
          log.info('connect', 'Initiating GitHub OAuth from empty state');
          const { url } = await api.getGitHubAuthUrl();
          window.location.href = url;
        },
      });
    }

    if (linearConnected && selectedProject && !selectedProject.linearProjectName) {
      items.push({
        id: 'link-linear',
        icon: <img src="/linear.svg" alt="" className="w-4 h-4 opacity-40" />,
        label: 'Link a Linear project',
        description: 'Sync issues and track implementation',
        action: () => focusIntegration('project'),
      });
    } else if (!linearConnected) {
      items.push({
        id: 'connect-linear',
        icon: <img src="/linear.svg" alt="" className="w-4 h-4 opacity-40" />,
        label: 'Connect Linear',
        description: 'Sync issues and track implementation status',
        action: async () => {
          log.info('connect', 'Initiating Linear OAuth from empty state');
          const { url } = await api.getLinearAuthUrl();
          window.location.href = url;
        },
      });
    }

    if (slackConnected && selectedProject && !selectedProject.slackNotificationChannelId) {
      items.push({
        id: 'link-slack',
        icon: <img src="/slack.svg" alt="" className="w-4 h-4 opacity-40" />,
        label: 'Set an alert channel',
        description: 'Get notified in Slack about changes',
        action: () => focusIntegration('alerts'),
      });
    } else if (!slackConnected) {
      items.push({
        id: 'connect-slack',
        icon: <img src="/slack.svg" alt="" className="w-4 h-4 opacity-40" />,
        label: 'Connect Slack',
        description: 'Extract knowledge from team conversations',
        action: async () => {
          log.info('connect', 'Initiating Slack OAuth from empty state');
          const { url } = await api.getSlackAuthUrl();
          window.location.href = url;
        },
      });
    }

    if (supabaseConnected && selectedProject && !selectedProject.supabaseProjectRef) {
      items.push({
        id: 'link-supabase',
        icon: <img src="/supabase.svg" alt="" className="w-4 h-4 opacity-40" />,
        label: 'Link a database',
        description: 'Import schema as project context',
        action: () => focusIntegration('database'),
      });
    } else if (!supabaseConnected) {
      items.push({
        id: 'connect-supabase',
        icon: <img src="/supabase.svg" alt="" className="w-4 h-4 opacity-40" />,
        label: 'Connect Supabase',
        description: 'Import database schema as project context',
        action: async () => {
          log.info('connect', 'Initiating Supabase OAuth from empty state');
          const { url } = await api.getSupabaseConnectAuthUrl();
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
    selectedProject,
    focusIntegration,
  ]);

  const hasIntegrationSuggestions = integrationSuggestions.length > 0;

  return (
    <div className="flex-1 bg-surface-panel flex flex-col items-center justify-center text-text-quaternary">
      <LoaderPinwheel size={48} className="mb-8 opacity-10" />

      <div className="w-[320px] space-y-1">
        {suggestions.map((s) => (
          <SuggestionAction
            key={s.id}
            icon={s.icon}
            label={s.label}
            description={s.description}
            onClick={s.action}
          />
        ))}

        {hasIntegrationSuggestions && (
          <>
            <div className="border-t border-border-subtle my-2" />
            {integrationSuggestions.map((s) => (
              <SuggestionAction
                key={s.id}
                icon={s.icon}
                label={s.label}
                description={s.description}
                onClick={s.action}
              />
            ))}
          </>
        )}

        <div className="border-t border-border-subtle my-2" />
        <SuggestionAction
          icon={<Command size={16} />}
          label="Open Command Central"
          description="Quick actions, search, and navigation"
          onClick={onOpenCommandPalette}
        />

        {hasRequirements && (
          <SuggestionAction
            icon={<MousePointerClick size={16} />}
            label="Select a requirement"
            description="View its knowledge flow and questions"
            onClick={flashRequirementHint}
          />
        )}
      </div>
    </div>
  );
}
