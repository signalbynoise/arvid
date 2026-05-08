import React from 'react';
import { api } from '../api';
import { logger } from '../logger';

const log = logger.create('ConnectGitHubButton');

interface ConnectGitHubButtonProps {
  compact?: boolean;
}

export function ConnectGitHubButton({ compact }: ConnectGitHubButtonProps) {
  const handleConnect = async () => {
    log.info('connect', 'Initiating GitHub OAuth for repo access');

    try {
      const { url } = await api.getGitHubAuthUrl();
      window.location.href = url;
    } catch (err) {
      log.error('connect', 'Failed to get GitHub auth URL', {
        message: err instanceof Error ? err.message : 'Unknown',
      });
    }
  };

  if (compact) {
    return (
      <button type="button" onClick={handleConnect} className="btn-ghost flex items-center gap-1.5">
        <img src="/github.svg" alt="" className="w-4 h-4 opacity-60" />
        <span>Connect GitHub</span>
      </button>
    );
  }

  return (
    <button type="button" onClick={handleConnect} className="btn-ghost w-full flex items-center justify-center gap-2">
      <img src="/github.svg" alt="" className="w-4 h-4 opacity-60" />
      <span>Connect GitHub Account</span>
    </button>
  );
}
