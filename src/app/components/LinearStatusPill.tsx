import React from 'react';

const STATUS_TYPE_STYLES: Record<string, string> = {
  triage: 'text-text-tertiary bg-surface-frost-05 border-border-subtle',
  backlog: 'text-text-tertiary bg-surface-frost-05 border-border-subtle',
  unstarted: 'text-text-tertiary bg-surface-frost-05 border-border-subtle',
  started: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  completed: 'text-status-success bg-status-success-surface border-status-success-border',
  cancelled: 'text-text-quaternary bg-surface-frost-03 border-border-subtle line-through',
};

const PRE_BACKLOG_STYLE = 'text-text-quaternary bg-transparent border-border-subtle';

interface LinearStatusPillProps {
  status?: string;
  statusType?: string;
}

export function LinearStatusPill({ status, statusType }: LinearStatusPillProps) {
  const displayStatus = status || 'Pre-backlog';
  const isPreBacklog = displayStatus === 'Pre-backlog';
  const style = isPreBacklog
    ? PRE_BACKLOG_STYLE
    : STATUS_TYPE_STYLES[statusType ?? ''] ?? STATUS_TYPE_STYLES.unstarted;

  return (
    <span className={`ml-auto text-[10px] font-[var(--fw-medium)] px-1.5 py-0.5 rounded-standard border whitespace-nowrap ${style}`}>
      {displayStatus}
    </span>
  );
}
