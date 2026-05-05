import React from 'react';
import { api } from '../api';
import { logger } from '../logger';

const log = logger.create('ConnectLinearButton');

interface ConnectLinearButtonProps {
  compact?: boolean;
}

export function ConnectLinearButton({ compact }: ConnectLinearButtonProps) {
  const handleConnect = async () => {
    log.info('connect', 'Initiating Linear OAuth');

    try {
      const { url } = await api.getLinearAuthUrl();
      window.location.href = url;
    } catch (err) {
      log.error('connect', 'Failed to get Linear auth URL', {
        message: err instanceof Error ? err.message : 'Unknown',
      });
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleConnect}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary bg-surface-frost-04 hover:bg-surface-frost-08 border border-border-default rounded-comfortable transition-colors"
      >
        <img src="/linear.svg" alt="" className="w-4 h-4 opacity-60" />
        <span>Connect Linear</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      className="flex items-center justify-center gap-2 w-full h-10 px-4 text-[13px] font-[var(--fw-medium)] text-text-secondary hover:text-text-primary bg-surface-frost-04 hover:bg-surface-frost-08 border border-border-default rounded-comfortable transition-colors"
    >
      <img src="/linear.svg" alt="" className="w-4 h-4 opacity-60" />
      <span>Connect Linear Account</span>
    </button>
  );
}
