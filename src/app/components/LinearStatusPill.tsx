import React from 'react';
import { Chip, type ChipAccent } from './Chip';

interface LinearStatusPillProps {
  status?: string;
  statusType?: string;
  issueUrl?: string;
  issueIdentifier?: string;
}

const STATUS_ACCENT: Record<string, ChipAccent> = {
  completed: 'success',
  cancelled: 'error',
};

export function LinearStatusPill({ status, statusType, issueUrl, issueIdentifier }: LinearStatusPillProps) {
  const label = issueIdentifier && status
    ? `${issueIdentifier} · ${status}`
    : issueIdentifier || status || 'Pre Backlog';
  const accent = STATUS_ACCENT[statusType ?? ''] ?? 'default';
  const isComplete = statusType === 'completed';

  return (
    <Chip border="dashed" accent={accent} href={issueUrl}>
      <img src="/linear.svg" alt="" className={`w-3 h-3 ${isComplete ? 'opacity-100' : 'opacity-60'}`} />
      <span className={`whitespace-nowrap ${isComplete ? 'text-status-success' : 'text-text-tertiary'}`}>{label}</span>
    </Chip>
  );
}
