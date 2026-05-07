import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { SidebarFooterItem } from './SidebarFooterItem';
import { ChangeIntegrationModal } from './ChangeIntegrationModal';
import { RepoSelector } from './RepoSelector';
import { LinearProjectSelector } from './LinearProjectSelector';
import { SlackNotifySelector } from './SlackNotifySelector';
import { useStore, selectProjects, selectSelectedProjectId } from '../store';
import type { Project } from '../types';

type IntegrationKey = 'repository' | 'project' | 'alerts';

interface ValueTriggerProps {
  value: string;
  onClick: () => void;
}

function ValueTrigger({ value, onClick }: ValueTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between w-full p-3 bg-surface-panel border border-border-default rounded-comfortable text-label text-text-primary hover:border-border-hover transition-colors"
    >
      <span className="truncate">{value}</span>
      <ChevronDown size={16} className="text-text-quaternary shrink-0 ml-2" />
    </button>
  );
}

interface SidebarFooterProps {
  project: Project;
  onProjectsReload: () => void;
}

export function SidebarFooter({ project, onProjectsReload }: SidebarFooterProps) {
  const githubConnection = useStore(s => s.githubConnection);
  const linearConnection = useStore(s => s.linearConnection);
  const slackConnection = useStore(s => s.slackConnection);
  const slackChannels = useStore(s => s.slackChannels);
  const repoFetchStatus = useStore(s => s.repoFetchStatus);

  const [confirmTarget, setConfirmTarget] = useState<IntegrationKey | null>(null);
  const [unlocked, setUnlocked] = useState<Set<IntegrationKey>>(new Set());

  const prevProjectRef = useRef({ repo: project.githubRepo, linear: project.linearProjectName, slack: project.slackNotificationChannelId });
  useEffect(() => {
    const prev = prevProjectRef.current;
    const changed = new Set<IntegrationKey>();
    if (prev.repo !== project.githubRepo) changed.add('repository');
    if (prev.linear !== project.linearProjectName) changed.add('project');
    if (prev.slack !== project.slackNotificationChannelId) changed.add('alerts');
    if (changed.size > 0) {
      setUnlocked(current => {
        const next = new Set(current);
        changed.forEach(k => next.delete(k));
        return next;
      });
    }
    prevProjectRef.current = { repo: project.githubRepo, linear: project.linearProjectName, slack: project.slackNotificationChannelId };
  }, [project.githubRepo, project.linearProjectName, project.slackNotificationChannelId]);

  const confirmValue = useMemo(() => {
    if (!confirmTarget) return '';
    if (confirmTarget === 'repository') return project.githubRepo ?? '';
    if (confirmTarget === 'project') return project.linearProjectName ?? '';
    if (confirmTarget === 'alerts') {
      const ch = slackChannels.find(c => c.id === project.slackNotificationChannelId);
      return ch ? `#${ch.name}` : '';
    }
    return '';
  }, [confirmTarget, project, slackChannels]);

  const confirmLabel = useMemo(() => {
    if (confirmTarget === 'repository') return 'Repository';
    if (confirmTarget === 'project') return 'Project';
    if (confirmTarget === 'alerts') return 'Alert Channel';
    return '';
  }, [confirmTarget]);

  const handleRequestChange = (key: IntegrationKey) => {
    setConfirmTarget(key);
  };

  const handleConfirm = () => {
    if (confirmTarget) {
      setUnlocked(prev => new Set(prev).add(confirmTarget));
    }
    setConfirmTarget(null);
  };

  const isUnlocked = (key: IntegrationKey) => unlocked.has(key);

  const showGithub = githubConnection.status === 'connected';
  const showLinear = linearConnection.status === 'connected';
  const showSlack = slackConnection.status === 'connected';

  if (!showGithub && !showLinear && !showSlack) return null;

  const slackChannel = slackChannels.find(c => c.id === project.slackNotificationChannelId);

  return (
    <>
      <div className="border-t border-border-subtle shrink-0 py-4 space-y-4">
        {showGithub && (
          <SidebarFooterItem
            icon={
              <>
                <img src="/github.svg" alt="" className="w-3.5 h-3.5 opacity-40" />
                {repoFetchStatus === 'fetching' && (
                  <Loader2 size={10} className="animate-spin text-text-quaternary" />
                )}
              </>
            }
            label="Repository"
            isConnected={!!project.githubRepo}
          >
            {project.githubRepo && !isUnlocked('repository') ? (
              <ValueTrigger
                value={project.githubRepo}
                onClick={() => handleRequestChange('repository')}
              />
            ) : (
              <RepoSelector projectId={project.id} onLinked={onProjectsReload} />
            )}
          </SidebarFooterItem>
        )}

        {showLinear && (
          <>
            {showGithub && <div className="border-t border-border-subtle" />}
            <SidebarFooterItem
              icon={<img src="/linear.svg" alt="" className="w-3.5 h-3.5 opacity-40" />}
              label="Project"
              isConnected={!!project.linearProjectName}
            >
              {project.linearProjectName && !isUnlocked('project') ? (
                <ValueTrigger
                  value={project.linearProjectName}
                  onClick={() => handleRequestChange('project')}
                />
              ) : (
                <LinearProjectSelector projectId={project.id} onLinked={onProjectsReload} />
              )}
            </SidebarFooterItem>
          </>
        )}

        {showSlack && (
          <>
            {(showGithub || showLinear) && <div className="border-t border-border-subtle" />}
            <SidebarFooterItem
              icon={<img src="/slack.svg" alt="" className="w-3.5 h-3.5 opacity-40" />}
              label="Alerts"
              isConnected={!!project.slackNotificationChannelId}
            >
              {project.slackNotificationChannelId && !isUnlocked('alerts') ? (
                <ValueTrigger
                  value={slackChannel ? `#${slackChannel.name}` : 'Channel set'}
                  onClick={() => handleRequestChange('alerts')}
                />
              ) : (
                <SlackNotifySelector projectId={project.id} />
              )}
            </SidebarFooterItem>
          </>
        )}
      </div>

      <ChangeIntegrationModal
        isOpen={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirm}
        integrationName={confirmLabel}
        currentValue={confirmValue}
      />
    </>
  );
}
