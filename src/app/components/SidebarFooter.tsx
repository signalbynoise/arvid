import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { SidebarFooterItem } from './SidebarFooterItem';
import { FooterDropdownTrigger } from './FooterDropdownTrigger';
import { ChangeIntegrationModal } from './ChangeIntegrationModal';
import { RepoSelector } from './RepoSelector';
import { LinearProjectSelector } from './LinearProjectSelector';
import { SlackNotifySelector } from './SlackNotifySelector';
import { SupabaseProjectSelector } from './SupabaseProjectSelector';
import { useStore, selectProjects, selectSelectedProjectId } from '../store';
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
  const slackChannels = useStore(s => s.slackChannels);
  const repoFetchStatus = useStore(s => s.repoFetchStatus);
  const dbFetchStatus = useStore(s => s.dbFetchStatus);
  const integrationFocus = useStore(s => s.integrationFocus);
  const clearIntegrationFocus = useStore(s => s.clearIntegrationFocus);

  const [confirmTarget, setConfirmTarget] = useState<IntegrationKey | null>(null);
  const [unlocked, setUnlocked] = useState<Set<IntegrationKey>>(new Set());

  const footerRef = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (integrationFocus) {
      setUnlocked(prev => new Set(prev).add(integrationFocus));
      clearIntegrationFocus();
      requestAnimationFrame(() => {
        footerRef.current[integrationFocus]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [integrationFocus, clearIntegrationFocus]);

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

  const showGithub = githubConnection.status === 'connected';
  const showLinear = linearConnection.status === 'connected';
  const showSlack = slackConnection.status === 'connected';
  const showSupabase = supabaseConnection.status === 'connected';

  if (!showGithub && !showLinear && !showSlack && !showSupabase) return null;

  const slackChannel = slackChannels.find(c => c.id === project.slackNotificationChannelId);

  return (
    <>
      <div className="border-t border-border-subtle shrink-0 py-4 space-y-4">
        {showGithub && (
          <div ref={el => { footerRef.current['repository'] = el; }}>
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
              <FooterDropdownTrigger onClick={() => handleRequestChange('repository')}>
                <span className="text-text-primary">{project.githubRepo}</span>
              </FooterDropdownTrigger>
            ) : (
              <RepoSelector projectId={project.id} onLinked={onProjectsReload} />
            )}
          </SidebarFooterItem>
          </div>
        )}

        {showLinear && (
          <>
            {showGithub && <div className="border-t border-border-subtle" />}
            <div ref={el => { footerRef.current['project'] = el; }}>
            <SidebarFooterItem
              icon={<img src="/linear.svg" alt="" className="w-3.5 h-3.5 opacity-40" />}
              label="Project"
              isConnected={!!project.linearProjectName}
            >
              {project.linearProjectName && !isUnlocked('project') ? (
                <FooterDropdownTrigger onClick={() => handleRequestChange('project')}>
                  <span className="text-text-primary">{project.linearProjectName}</span>
                </FooterDropdownTrigger>
              ) : (
                <LinearProjectSelector projectId={project.id} onLinked={onProjectsReload} />
              )}
            </SidebarFooterItem>
            </div>
          </>
        )}

        {showSlack && (
          <>
            {(showGithub || showLinear) && <div className="border-t border-border-subtle" />}
            <div ref={el => { footerRef.current['alerts'] = el; }}>
            <SidebarFooterItem
              icon={<img src="/slack.svg" alt="" className="w-3.5 h-3.5 opacity-40" />}
              label="Alerts"
              isConnected={!!project.slackNotificationChannelId}
            >
              {project.slackNotificationChannelId && !isUnlocked('alerts') ? (
                <FooterDropdownTrigger onClick={() => handleRequestChange('alerts')}>
                  <span className="text-text-primary">{slackChannel ? `#${slackChannel.name}` : 'Channel set'}</span>
                </FooterDropdownTrigger>
              ) : (
                <SlackNotifySelector projectId={project.id} />
              )}
            </SidebarFooterItem>
            </div>
          </>
        )}

        {showSupabase && (
          <>
            {(showGithub || showLinear || showSlack) && <div className="border-t border-border-subtle" />}
            <div ref={el => { footerRef.current['database'] = el; }}>
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
              isConnected={!!project.supabaseProjectRef}
            >
              {project.supabaseProjectRef && !isUnlocked('database') ? (
                <FooterDropdownTrigger onClick={() => handleRequestChange('database')}>
                  <span className="text-text-primary">{project.supabaseProjectRef}</span>
                </FooterDropdownTrigger>
              ) : (
                <SupabaseProjectSelector projectId={project.id} onLinked={onProjectsReload} />
              )}
            </SidebarFooterItem>
            </div>
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
