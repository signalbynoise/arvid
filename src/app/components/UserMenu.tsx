import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { IconButton } from './IconButton';
import { useAuth } from '../auth/AuthProvider';
import { useStore } from '../store';
import { api } from '../api';
import { logger } from '../logger';

const log = logger.create('UserMenu');

function IntegrationRow({ icon, label, connected, onConnect, onDisconnect }: {
  icon: React.ReactNode;
  label: string;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={connected ? onDisconnect : onConnect}
      className="w-full flex items-center justify-between p-2 bg-surface-frost-02 border border-border-default rounded-comfortable transition-colors hover:bg-surface-frost-06"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[12px] font-[var(--fw-regular)] text-text-tertiary">
          {connected ? label : `Connect ${label}`}
        </span>
      </div>
      <span className={`h-2 w-2 rounded-full shrink-0 ${connected ? 'bg-status-success' : 'bg-border-subtle'}`} />
    </button>
  );
}

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const githubConnection = useStore(s => s.githubConnection);
  const loadGitHubStatus = useStore(s => s.loadGitHubStatus);
  const disconnectGitHub = useStore(s => s.disconnectGitHub);
  const linearConnection = useStore(s => s.linearConnection);
  const loadLinearStatus = useStore(s => s.loadLinearStatus);
  const disconnectLinear = useStore(s => s.disconnectLinear);
  const slackConnection = useStore(s => s.slackConnection);
  const loadSlackStatus = useStore(s => s.loadSlackStatus);
  const disconnectSlack = useStore(s => s.disconnectSlack);

  useEffect(() => {
    loadGitHubStatus();
    loadLinearStatus();
    loadSlackStatus();
  }, [loadGitHubStatus, loadLinearStatus, loadSlackStatus]);

  const fullName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || null;
  const email = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url
    || user?.user_metadata?.picture
    || null;

  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : email.slice(0, 1).toUpperCase();

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const handleConnectGitHub = async () => {
    log.info('connect', 'Initiating GitHub OAuth');
    try {
      const { url } = await api.getGitHubAuthUrl();
      window.location.href = url;
    } catch (err) {
      log.error('connect', 'Failed to get GitHub auth URL', { error: err instanceof Error ? err.message : 'Unknown' });
    }
  };

  const handleConnectLinear = async () => {
    log.info('connect', 'Initiating Linear OAuth');
    try {
      const { url } = await api.getLinearAuthUrl();
      window.location.href = url;
    } catch (err) {
      log.error('connect', 'Failed to get Linear auth URL', { error: err instanceof Error ? err.message : 'Unknown' });
    }
  };

  const handleConnectSlack = async () => {
    log.info('connect', 'Initiating Slack OAuth');
    try {
      const { url } = await api.getSlackAuthUrl();
      window.location.href = url;
    } catch (err) {
      log.error('connect', 'Failed to get Slack auth URL', { error: err instanceof Error ? err.message : 'Unknown' });
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <IconButton
        onClick={() => setIsOpen(prev => !prev)}
        title={fullName || email}
      >
        <Settings size={14} />
      </IconButton>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-elevated border border-border-default rounded-panel shadow-modal z-50 overflow-hidden p-4 flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full border border-border-subtle flex items-center justify-center shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              ) : (
                <span className="bg-surface-frost-10 h-full w-full flex items-center justify-center text-[11px] font-[var(--fw-medium)] text-text-primary">
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0">
              {fullName && (
                <p className="text-[14px] font-[var(--fw-regular)] text-text-primary truncate">{fullName}</p>
              )}
              <p className="text-[12px] text-text-tertiary truncate">{email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <IntegrationRow
              icon={<img src="/github.svg" alt="" className="w-4 h-4 opacity-60" />}
              label="Github"
              connected={githubConnection.status === 'connected'}
              onConnect={handleConnectGitHub}
              onDisconnect={disconnectGitHub}
            />
            <IntegrationRow
              icon={<img src="/linear.svg" alt="" className="w-4 h-4 opacity-60" />}
              label="Linear"
              connected={linearConnection.status === 'connected'}
              onConnect={handleConnectLinear}
              onDisconnect={disconnectLinear}
            />
            <IntegrationRow
              icon={<img src="/slack.svg" alt="" className="w-4 h-4 opacity-60" />}
              label="Slack"
              connected={slackConnection.status === 'connected'}
              onConnect={handleConnectSlack}
              onDisconnect={disconnectSlack}
            />
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-[12px] font-[var(--fw-regular)] text-text-tertiary hover:text-text-primary transition-colors"
          >
            <LogOut size={16} className="text-text-tertiary" />
            <span>Leave Arvid</span>
          </button>
        </div>
      )}
    </div>
  );
}
