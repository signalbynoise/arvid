import React from 'react';
import { Chip, type ChipAccent } from './Chip';
import type { DeployStatus } from '../../../shared/schemas';

interface RenderStatusChipProps {
  deployStatus?: DeployStatus;
  deployUrl?: string;
  deployCheckedAt?: string;
}

const STATUS_ACCENT: Record<string, ChipAccent> = {
  'live': 'success',
  'not_deployed': 'default',
  'deploy_failed': 'error',
  'unknown': 'default',
};

const STATUS_LABEL: Record<string, string> = {
  'live': 'Live',
  'not_deployed': 'Not Deployed',
  'deploy_failed': 'Deploy Failed',
  'unknown': 'Unknown',
};

function buildTooltip(deployStatus: string, deployCheckedAt?: string): string {
  const parts: string[] = [`Deploy: ${STATUS_LABEL[deployStatus] ?? deployStatus}`];
  if (deployCheckedAt) {
    parts.push(`Checked: ${new Date(deployCheckedAt).toLocaleString()}`);
  }
  if (deployStatus === 'live') {
    parts.push('Click to open live site');
  }
  return parts.join(' · ');
}

export function RenderStatusChip({ deployStatus, deployUrl, deployCheckedAt }: RenderStatusChipProps) {
  if (!deployStatus || deployStatus === 'unknown') return null;

  const accent = STATUS_ACCENT[deployStatus] ?? 'default';
  const label = STATUS_LABEL[deployStatus] ?? deployStatus;
  const tooltip = buildTooltip(deployStatus, deployCheckedAt);
  const isLive = deployStatus === 'live';

  return (
    <Chip
      border="dashed"
      accent={accent}
      href={isLive && deployUrl ? deployUrl : undefined}
    >
      <img
        src="/render.svg"
        alt=""
        className={`w-3 h-3 ${isLive ? 'opacity-100' : 'opacity-60'}`}
      />
      <span
        className={`whitespace-nowrap ${
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
