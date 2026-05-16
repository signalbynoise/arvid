import React from 'react';
import { Chip, type ChipAccent } from './Chip';
import type { DeployStatus } from '../../../shared/schemas';

interface RenderStatusChipProps {
  deployStatus?: DeployStatus;
  deployUrl?: string;
  deployCheckedAt?: string;
  disabled?: boolean;
  onCheck?: () => void;
}

const STATUS_ACCENT: Record<string, ChipAccent> = {
  live: 'success',
  not_deployed: 'default',
  deploy_failed: 'error',
};

const STATUS_LABEL: Record<string, string> = {
  live: 'Live',
  not_deployed: 'Not Deployed',
  deploy_failed: 'Deploy Failed',
  unknown: 'Unknown',
  checking: 'Checking...',
  not_checked: 'Not Checked',
};

const CHECKABLE = new Set<string | undefined>([undefined, 'unknown', 'not_checked']);

function buildTooltip(deployStatus: string | undefined, deployCheckedAt?: string, disabled?: boolean): string {
  if (disabled) return 'Implementation check must run first';
  if (!deployStatus || CHECKABLE.has(deployStatus)) return 'Click to check deploy status';
  const parts: string[] = [`Deploy: ${STATUS_LABEL[deployStatus] ?? deployStatus}`];
  if (deployCheckedAt) {
    parts.push(`Checked: ${new Date(deployCheckedAt).toLocaleString()}`);
  }
  if (deployStatus === 'live') {
    parts.push('Click to open live site');
  } else {
    parts.push('Click to re-check');
  }
  return parts.join(' · ');
}

export function RenderStatusChip({ deployStatus, deployUrl, deployCheckedAt, disabled, onCheck }: RenderStatusChipProps) {
  const isChecking = deployStatus === ('checking' as DeployStatus);
  const isCheckable = CHECKABLE.has(deployStatus);
  const isLive = deployStatus === 'live';
  const accent = disabled ? 'default' : (STATUS_ACCENT[deployStatus ?? ''] ?? 'default');
  const label = STATUS_LABEL[deployStatus ?? 'not_checked'] ?? 'Not Checked';
  const tooltip = buildTooltip(deployStatus, deployCheckedAt, disabled);

  const handleClick = disabled
    ? undefined
    : isLive && deployUrl
      ? undefined
      : onCheck;

  return (
    <Chip
      border="dashed"
      accent={accent}
      href={isLive && deployUrl ? deployUrl : undefined}
      onClick={handleClick}
    >
      <img
        src="/render.svg"
        alt=""
        className={`w-3 h-3 ${isChecking ? 'animate-pulse opacity-60' : isLive ? 'opacity-100' : 'opacity-60'}`}
      />
      <span
        className={`whitespace-nowrap ${
          isChecking ? 'text-text-tertiary animate-pulse' :
          accent === 'success' ? 'text-status-success' :
          accent === 'error' ? 'text-status-error' :
          'text-text-tertiary'
        }`}
        title={tooltip}
      >
        {label}
      </span>
    </Chip>
  );
}
