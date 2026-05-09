import React from 'react';
import { api } from '../api';
import { logger } from '../logger';

const log = logger.create('ConnectSupabaseButton');

interface ConnectSupabaseButtonProps {
  compact?: boolean;
}

export function ConnectSupabaseButton({ compact }: ConnectSupabaseButtonProps) {
  const handleConnect = async () => {
    log.info('connect', 'Initiating Supabase OAuth for project access');

    try {
      const { url } = await api.getSupabaseConnectAuthUrl();
      window.location.href = url;
    } catch (err) {
      log.error('connect', 'Failed to get Supabase auth URL', {
        message: err instanceof Error ? err.message : 'Unknown',
      });
    }
  };

  if (compact) {
    return (
      <button type="button" onClick={handleConnect} className="btn-ghost flex items-center gap-1.5">
        <img src="/supabase.svg" alt="" className="w-4 h-4 opacity-60" />
        <span>Connect Supabase</span>
      </button>
    );
  }

  return (
    <button type="button" onClick={handleConnect} className="btn-ghost w-full flex items-center justify-center gap-2">
      <img src="/supabase.svg" alt="" className="w-4 h-4 opacity-60" />
      <span>Connect Supabase Project</span>
    </button>
  );
}
