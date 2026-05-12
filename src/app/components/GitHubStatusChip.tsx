import React from 'react';
import { Chip, type ChipAccent } from './Chip';
import type { ImplStatus } from '../../../shared/schemas';

interface GitHubStatusChipProps {
  implStatus: ImplStatus | 'Not Checked';
  implConfidence?: number;
  implCheckedAt?: string;
  implEvidence?: string;
  disabled?: boolean;
  onRetry?: () => void;
  onViewDetails?: () => void;
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

const HAS_RESULT = new Set(['Implemented', 'Partially Implemented', 'Not Implemented']);

function buildTooltip(implStatus: string, implConfidence?: number, implCheckedAt?: string, disabled?: boolean): string {
  if (disabled) return 'Linear task must be Done before checking implementation';
  if (implStatus === 'Checking') return 'Analyzing repository code...';
  const parts: string[] = [`Code: ${implStatus}`];
  if (implConfidence !== undefined) {
    parts.push(`Confidence: ${Math.round(implConfidence * 100)}%`);
  }
  if (implCheckedAt) {
    parts.push(`Checked: ${new Date(implCheckedAt).toLocaleString()}`);
  }
  if (HAS_RESULT.has(implStatus)) {
    parts.push('Click for details');
  }
  return parts.join(' · ');
}

export function GitHubStatusChip({ implStatus, implConfidence, implCheckedAt, disabled, onRetry, onViewDetails }: GitHubStatusChipProps) {
  const accent = disabled ? 'default' : (STATUS_ACCENT[implStatus] ?? 'default');
  const label = STATUS_LABEL[implStatus] ?? implStatus;
  const isRetryable = implStatus === 'Not Checked' || implStatus === 'Unknown';
  const isChecking = implStatus === 'Checking';
  const hasResult = HAS_RESULT.has(implStatus);
  const isChecked = implStatus !== 'Not Checked' && !isChecking;
  const tooltip = buildTooltip(implStatus, implConfidence, implCheckedAt, disabled);

  const handleClick = disabled ? undefined : (isRetryable ? onRetry : hasResult ? onViewDetails : undefined);

  return (
    <Chip
      border="dashed"
      accent={accent}
      onClick={handleClick}
    >
      <img
        src="/github.svg"
        alt=""
        className={`w-3 h-3 ${isChecking ? 'animate-pulse opacity-60' : isChecked ? 'opacity-100' : 'opacity-60'}`}
      />
      <span
        className={`whitespace-nowrap ${isChecking ? 'text-text-tertiary animate-pulse' : accent === 'success' ? 'text-status-success' : accent === 'warning' ? 'text-status-warning' : accent === 'error' ? 'text-status-error' : 'text-text-tertiary'}`}
        title={tooltip}
      >
        {label}
      </span>
    </Chip>
  );
}
