import React from 'react';
import { Chip, type ChipAccent } from './Chip';
import type { ImplStatus } from '../../../shared/schemas';

interface GitHubStatusChipProps {
  implStatus: ImplStatus | 'Not Checked';
  implConfidence?: number;
  implCheckedAt?: string;
  onRetry?: () => void;
}

const STATUS_ACCENT: Record<string, ChipAccent> = {
  'Implemented': 'success',
  'Partially Implemented': 'warning',
  'Not Implemented': 'error',
};

const STATUS_LABEL: Record<string, string> = {
  'Not Checked': 'Not Checked',
  'Checking': 'Analyzing...',
  'Implemented': 'Implemented',
  'Partially Implemented': 'Partial',
  'Not Implemented': 'Not Implemented',
  'No Repo': 'No Repo',
  'Unknown': 'Unknown',
};

function buildTooltip(implStatus: string, implConfidence?: number, implCheckedAt?: string): string {
  if (implStatus === 'Checking') return 'Analyzing repository code...';
  const parts: string[] = [`Code: ${implStatus}`];
  if (implConfidence !== undefined) {
    parts.push(`Confidence: ${Math.round(implConfidence * 100)}%`);
  }
  if (implCheckedAt) {
    parts.push(`Checked: ${new Date(implCheckedAt).toLocaleString()}`);
  }
  return parts.join(' · ');
}

export function GitHubStatusChip({ implStatus, implConfidence, implCheckedAt, onRetry }: GitHubStatusChipProps) {
  const accent = STATUS_ACCENT[implStatus] ?? 'default';
  const label = STATUS_LABEL[implStatus] ?? implStatus;
  const isRetryable = implStatus === 'Not Checked' || implStatus === 'Unknown';
  const isChecking = implStatus === 'Checking';
  const isChecked = implStatus !== 'Not Checked' && implStatus !== 'Checking';
  const tooltip = buildTooltip(implStatus, implConfidence, implCheckedAt);

  return (
    <Chip
      border="dashed"
      accent={accent}
      onClick={isRetryable ? onRetry : undefined}
    >
      <img
        src="/github.svg"
        alt=""
        className={`w-3 h-3 ${isChecking ? 'animate-pulse opacity-80' : isChecked ? 'opacity-100' : 'opacity-60'}`}
      />
      <span
        className={`whitespace-nowrap ${isChecking ? 'text-accent animate-pulse' : accent === 'success' ? 'text-status-success' : accent === 'warning' ? 'text-status-warning' : accent === 'error' ? 'text-status-error' : 'text-text-tertiary'}`}
        title={tooltip}
      >
        {label}
      </span>
    </Chip>
  );
}
