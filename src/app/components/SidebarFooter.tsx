import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { SidebarFooterItem } from './SidebarFooterItem';
import { FooterDropdownTrigger } from './FooterDropdownTrigger';
import { ChangeIntegrationModal } from './ChangeIntegrationModal';
import { RepoSelector } from './RepoSelector';
import { LinearProjectSelector } from './LinearProjectSelector';
import { SlackNotifySelector } from './SlackNotifySelector';
import { SupabaseProjectSelector } from './SupabaseProjectSelector';
import { useStore, selectWorkspaces, selectActiveWorkspaceId } from '../store';
import { canManageIntegrations } from '../domain/access';
import type { Project } from '../types';

type IntegrationKey = 'repository' | 'project' | 'alerts' | 'database';

interface SidebarFooterProps {
  project: Project;
  onProjectsReload: () => void;
}

export function SidebarFooter({ project, onProjectsReload }: SidebarFooterProps) {
  const githubConnection = useStore(s => s.githubConnection);
  const linearConnection = useStore(s => s.linearConnection);
  const slackConnection = useStore(s => s.slackConnection);
  const supabaseConnection = useStore(s => s.supabaseConnection);
  const renderConnection = useStore(s => s.renderConnection);
  const slackChannels = useStore(s => s.slackChannels);
  const repoFetchStatus = useStore(s => s.repoFetchStatus);
  const dbFetchStatus = useStore(s => s.dbFetchStatus);

  const workspaces = useStore(selectWorkspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const userRole = workspaces.find(w => w.id === activeWorkspaceId)?.userRole;
  const canManage = canManageIntegrations(userRole);

  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<IntegrationKey | null>(null);
  const [unlocked, setUnlocked] = useState<Set<IntegrationKey>>(new Set());

  const prevProjectRef = useRef({ repo: project.githubRepo, linear: project.linearProjectName, slack: project.slackNotificationChannelId, supabase: project.supabaseProjectRef });
  useEffect(() => {
    const prev = prevProjectRef.current;
    const changed = new Set<IntegrationKey>();
    if (prev.repo !== project.githubRepo) changed.add('repository');
    if (prev.linear !== project.linearProjectName) changed.add('project');
    if (prev.slack !== project.slackNotificationChannelId) changed.add('alerts');
    if (prev.supabase !== project.supabaseProjectRef) changed.add('database');
    if (changed.size > 0) {
      setUnlocked(current => {
        const next = new Set(current);
        changed.forEach(k => next.delete(k));
        return next;
      });
    }
    prevProjectRef.current = { repo: project.githubRepo, linear: project.linearProjectName, slack: project.slackNotificationChannelId, supabase: project.supabaseProjectRef };
  }, [project.githubRepo, project.linearProjectName, project.slackNotificationChannelId, project.supabaseProjectRef]);

  const confirmValue = useMemo(() => {
    if (!confirmTarget) return '';
    if (confirmTarget === 'repository') return project.githubRepo ?? '';
    if (confirmTarget === 'project') return project.linearProjectName ?? '';
    if (confirmTarget === 'alerts') {
      const ch = slackChannels.find(c => c.id === project.slackNotificationChannelId);
      return ch ? `#${ch.name}` : '';
    }
    if (confirmTarget === 'database') return project.supabaseProjectRef ?? '';
    return '';
  }, [confirmTarget, project, slackChannels]);

  const confirmLabel = useMemo(() => {
    if (confirmTarget === 'repository') return 'Repository';
    if (confirmTarget === 'project') return 'Project';
    if (confirmTarget === 'alerts') return 'Alert Channel';
    if (confirmTarget === 'database') return 'Database';
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

  const ghUserConnected = githubConnection.status === 'connected';
  const linearUserConnected = linearConnection.status === 'connected';
  const slackUserConnected = slackConnection.status === 'connected';
  const supabaseUserConnected = supabaseConnection.status === 'connected';
  const renderUserConnected = renderConnection.status === 'connected';

  const ghProjectLinked = !!project.githubRepo;
  const linearProjectLinked = !!project.linearProjectName;
  const slackProjectLinked = !!project.slackNotificationChannelId;
  const supabaseProjectLinked = !!project.supabaseProjectRef;
  const renderProjectLinked = !!project.renderServiceName;

  const showGithub = ghProjectLinked || (ghUserConnected && canManage);
  const showLinear = linearProjectLinked || (linearUserConnected && canManage);
  const showSlack = slackProjectLinked || (slackUserConnected && canManage);
  const showSupabase = supabaseProjectLinked || (supabaseUserConnected && canManage);
  const showRender = renderProjectLinked || (renderUserConnected && canManage);

  if (!showGithub && !showLinear && !showSlack && !showSupabase && !showRender) return null;

  const slackChannel = slackChannels.find(c => c.id === project.slackNotificationChannelId);

  const canEditGithub = canManage && ghUserConnected;
  const canEditLinear = canManage && linearUserConnected;
  const canEditSlack = canManage && slackUserConnected;
  const canEditSupabase = canManage && supabaseUserConnected;

  return (
    <>
      <div
        className={`border-t border-border-subtle shrink-0 flex flex-col ${
          isExpanded ? 'p-4 gap-4' : 'px-4 py-4 gap-4'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          className="text-left text-caption-lg text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
        >
          Integrations
        </button>

        {isExpanded ? (
          <div className="flex flex-col gap-4">
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
                isConnected={ghProjectLinked}
              >
                {canEditGithub ? (
                  ghProjectLinked && !isUnlocked('repository') ? (
                    <FooterDropdownTrigger onClick={() => handleRequestChange('repository')}>
                      <span className="text-text-primary">{project.githubRepo}</span>
                    </FooterDropdownTrigger>
                  ) : (
                    <RepoSelector projectId={project.id} onLinked={onProjectsReload} />
                  )
                ) : (
                  <FooterDropdownTrigger onClick={() => {}} disabled>
                    <span className="text-text-primary">{project.githubRepo ?? 'Not linked'}</span>
                  </FooterDropdownTrigger>
                )}
              </SidebarFooterItem>
            )}

            {showSupabase && (
              <SidebarFooterItem
                icon={
                  <>
                    <img src="/supabase.svg" alt="" className="w-3.5 h-3.5 opacity-40" />
                    {dbFetchStatus === 'fetching' && (
                      <Loader2 size={10} className="animate-spin text-text-quaternary" />
                    )}
                  </>
                }
                label="Database"
                isConnected={supabaseProjectLinked}
              >
                {canEditSupabase ? (
                  supabaseProjectLinked && !isUnlocked('database') ? (
                    <FooterDropdownTrigger onClick={() => handleRequestChange('database')}>
                      <span className="text-text-primary">{project.supabaseProjectRef}</span>
                    </FooterDropdownTrigger>
                  ) : (
                    <SupabaseProjectSelector projectId={project.id} onLinked={onProjectsReload} />
                  )
                ) : (
                  <FooterDropdownTrigger onClick={() => {}} disabled>
                    <span className="text-text-primary">{project.supabaseProjectRef ?? 'Not linked'}</span>
                  </FooterDropdownTrigger>
                )}
              </SidebarFooterItem>
            )}

            {showLinear && (
              <SidebarFooterItem
                icon={<img src="/linear.svg" alt="" className="w-3.5 h-3.5 opacity-40" />}
                label="Project"
                isConnected={linearProjectLinked}
              >
                {canEditLinear ? (
                  linearProjectLinked && !isUnlocked('project') ? (
                    <FooterDropdownTrigger onClick={() => handleRequestChange('project')}>
                      <span className="text-text-primary">{project.linearProjectName}</span>
                    </FooterDropdownTrigger>
                  ) : (
                    <LinearProjectSelector projectId={project.id} onLinked={onProjectsReload} />
                  )
                ) : (
                  <FooterDropdownTrigger onClick={() => {}} disabled>
                    <span className="text-text-primary">{project.linearProjectName ?? 'Not linked'}</span>
                  </FooterDropdownTrigger>
                )}
              </SidebarFooterItem>
            )}

            {showSlack && (
              <SidebarFooterItem
                icon={<img src="/slack.svg" alt="" className="w-3.5 h-3.5 opacity-40" />}
                label="Alerts"
                isConnected={slackProjectLinked}
              >
                {canEditSlack ? (
                  slackProjectLinked && !isUnlocked('alerts') ? (
                    <FooterDropdownTrigger onClick={() => handleRequestChange('alerts')}>
                      <span className="text-text-primary">{slackChannel ? `#${slackChannel.name}` : 'Channel set'}</span>
                    </FooterDropdownTrigger>
                  ) : (
                    <SlackNotifySelector projectId={project.id} />
                  )
                ) : (
                  <FooterDropdownTrigger onClick={() => {}} disabled>
                    <span className="text-text-primary">{slackChannel ? `#${slackChannel.name}` : slackProjectLinked ? 'Channel set' : 'Not linked'}</span>
                  </FooterDropdownTrigger>
                )}
              </SidebarFooterItem>
            )}

            {showRender && (
              <SidebarFooterItem
                icon={<img src="/render.svg" alt="" className="w-3.5 h-3.5 opacity-40" />}
                label="Deployment"
                isConnected={renderProjectLinked || renderUserConnected}
              >
                <FooterDropdownTrigger onClick={() => {}} disabled>
                  <span className="text-text-primary">
                    {project.renderServiceName ?? renderConnection.ownerName ?? 'Connected'}
                  </span>
                </FooterDropdownTrigger>
              </SidebarFooterItem>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {showGithub && (
              <div className="relative">
                <img src="/github.svg" alt="GitHub" className="w-4 h-4 opacity-50" />
                {ghProjectLinked && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-status-success" />
                )}
              </div>
            )}
            {showSupabase && (
              <div className="relative">
                <img src="/supabase.svg" alt="Supabase" className="w-4 h-4 opacity-50" />
                {supabaseProjectLinked && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-status-success" />
                )}
              </div>
            )}
            {showLinear && (
              <div className="relative">
                <img src="/linear.svg" alt="Linear" className="w-4 h-4 opacity-50" />
                {linearProjectLinked && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-status-success" />
                )}
              </div>
            )}
            {showSlack && (
              <div className="relative">
                <img src="/slack.svg" alt="Slack" className="w-4 h-4 opacity-50" />
                {slackProjectLinked && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-status-success" />
                )}
              </div>
            )}
            {showRender && (
              <div className="relative">
                <img src="/render.svg" alt="Render" className="w-4 h-4 opacity-50" />
                {(renderProjectLinked || renderUserConnected) && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-status-success" />
                )}
              </div>
            )}
          </div>
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
