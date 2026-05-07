import { useState, useRef, useEffect, useCallback } from 'react';
import { LogOut, Settings, UserRound, ToggleRight, ToggleLeft } from 'lucide-react';
import { IconButton } from './IconButton';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { DropdownDivider } from './ui/DropdownDivider';
import { useAuth } from '../auth/AuthProvider';
import { useStore } from '../store';
import { api } from '../api';
import { logger } from '../logger';

const log = logger.create('UserMenu');

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

  const toggleIndicator = (connected: boolean) =>
    connected
      ? <ToggleRight size={16} className="text-status-success" />
      : <ToggleLeft size={16} className="text-text-quaternary" />;

  return (
    <div className="relative" ref={menuRef}>
      <IconButton
        onClick={() => setIsOpen(prev => !prev)}
        title={fullName || email}
      >
        <Settings size={14} />
      </IconButton>

      {isOpen && (
        <DropdownPanel position="below" align="end">
          <DropdownSection label="Profile">
            <DropdownItem
              icon={<UserRound size={16} />}
              label={fullName || email}
            />
          </DropdownSection>

          <DropdownDivider />

          <DropdownSection label="Integrations">
            <DropdownItem
              icon={<img src="/github.svg" alt="" className="w-4 h-4 opacity-60" />}
              label="Github"
              right={toggleIndicator(githubConnection.status === 'connected')}
              onClick={githubConnection.status === 'connected' ? disconnectGitHub : handleConnectGitHub}
            />
            <DropdownItem
              icon={<img src="/linear.svg" alt="" className="w-4 h-4 opacity-60" />}
              label="Linear"
              right={toggleIndicator(linearConnection.status === 'connected')}
              onClick={linearConnection.status === 'connected' ? disconnectLinear : handleConnectLinear}
            />
            <DropdownItem
              icon={<img src="/slack.svg" alt="" className="w-4 h-4 opacity-60" />}
              label="Slack"
              right={toggleIndicator(slackConnection.status === 'connected')}
              onClick={slackConnection.status === 'connected' ? disconnectSlack : handleConnectSlack}
            />
          </DropdownSection>

          <DropdownDivider />

          <DropdownSection label="Avoid">
            <DropdownItem
              icon={<LogOut size={16} />}
              label="Leave Arvid"
              variant="muted"
              onClick={handleSignOut}
            />
          </DropdownSection>
        </DropdownPanel>
      )}
    </div>
  );
}
