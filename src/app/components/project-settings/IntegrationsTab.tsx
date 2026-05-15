import React from 'react';
import { Github, Slack, Database, BarChart3, Check, X } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import type { Project } from '../../types';

interface IntegrationsTabProps {
  project: Project;
}

interface IntegrationRowProps {
  icon: React.ReactNode;
  label: string;
  connected: boolean;
  detail: string | undefined;
}

function IntegrationRow({ icon, label, connected, detail }: IntegrationRowProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-card bg-surface-frost-02 border border-border-default">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 text-text-quaternary">{icon}</div>
        <div className="min-w-0">
          <p className="text-caption-lg text-text-primary">{label}</p>
          {detail && (
            <p className="text-label-sm text-text-tertiary truncate">{detail}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {connected ? (
          <span className="flex items-center gap-1 text-label text-status-success">
            <Check size={ICON_SIZE.xs} />
            Connected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-label text-text-quaternary">
            <X size={ICON_SIZE.xs} />
            Not linked
          </span>
        )}
      </div>
    </div>
  );
}

export function IntegrationsTab({ project }: IntegrationsTabProps) {
  return (
    <div className="p-5 space-y-4">
      <span className="text-label-upper text-text-tertiary">
        Integrations
      </span>

      <div className="space-y-2">
        <IntegrationRow
          icon={<Github size={ICON_SIZE.md} />}
          label="GitHub"
          connected={!!project.githubRepo}
          detail={project.githubRepo}
        />

        <IntegrationRow
          icon={<BarChart3 size={ICON_SIZE.md} />}
          label="Linear"
          connected={!!project.linearProjectName}
          detail={project.linearProjectName}
        />

        <IntegrationRow
          icon={<Slack size={ICON_SIZE.md} />}
          label="Slack"
          connected={!!project.slackNotificationChannelId}
          detail={project.slackNotificationChannelId ? 'Alert channel set' : undefined}
        />

        <IntegrationRow
          icon={<Database size={ICON_SIZE.md} />}
          label="Supabase"
          connected={!!project.supabaseProjectRef}
          detail={project.supabaseProjectRef}
        />
      </div>

      <p className="text-label-sm text-text-empty">
        Manage integrations through the sidebar footer when this project is selected.
      </p>
    </div>
  );
}
