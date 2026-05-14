import { useState, useRef, useEffect, useCallback } from 'react';
import { LogOut, UserRound, ToggleRight, ToggleLeft, CreditCard } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { IconButton } from './IconButton';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { DropdownDivider } from './ui/DropdownDivider';
import { AccountSettingsModal } from './AccountSettingsModal';
import { useAuth } from '../auth/AuthProvider';
import { useStore } from '../store';
import { api } from '../api';
import { logger } from '../logger';

const log = logger.create('UserMenu');

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
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
  const supabaseConnection = useStore(s => s.supabaseConnection);
  const loadSupabaseConnectStatus = useStore(s => s.loadSupabaseConnectStatus);
  const disconnectSupabase = useStore(s => s.disconnectSupabase);
  const figmaConnection = useStore(s => s.figmaConnection);
  const loadFigmaStatus = useStore(s => s.loadFigmaStatus);
  const disconnectFigma = useStore(s => s.disconnectFigma);

  useEffect(() => {
    loadGitHubStatus();
    loadLinearStatus();
    loadSlackStatus();
    loadSupabaseConnectStatus();
    loadFigmaStatus();
  }, [loadGitHubStatus, loadLinearStatus, loadSlackStatus, loadSupabaseConnectStatus, loadFigmaStatus]);

  useEffect(() => {
    const handler = () => setAccountSettingsOpen(true);
    window.addEventListener('arvid:open-account-settings', handler);
    return () => window.removeEventListener('arvid:open-account-settings', handler);
  }, []);

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

  const handleConnectSupabase = async () => {
    log.info('connect', 'Initiating Supabase OAuth');
    try {
      const { url } = await api.getSupabaseConnectAuthUrl();
      window.location.href = url;
    } catch (err) {
      log.error('connect', 'Failed to get Supabase auth URL', { error: err instanceof Error ? err.message : 'Unknown' });
    }
  };

  const handleConnectFigma = async () => {
    log.info('connect', 'Initiating Figma OAuth');
    try {
      const { url } = await api.getFigmaAuthUrl();
      window.location.href = url;
    } catch (err) {
      log.error('connect', 'Failed to get Figma auth URL', { error: err instanceof Error ? err.message : 'Unknown' });
    }
  };

  const toggleIndicator = (connected: boolean) =>
    connected
      ? <ToggleRight size={ICON_SIZE.md} className="text-status-success" />
      : <ToggleLeft size={ICON_SIZE.md} className="text-text-quaternary" />;

  return (
    <div className="relative" ref={menuRef}>
      <IconButton
        onClick={() => setIsOpen(prev => !prev)}
        title={fullName || email}
      >
        <UserRound size={ICON_SIZE.sm} />
      </IconButton>

      <DropdownPanel isOpen={isOpen} position="below" align="end">
        <DropdownSection label="Profile">
          <DropdownItem
            icon={<UserRound size={ICON_SIZE.md} />}
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
          <DropdownItem
            icon={<img src="/supabase.svg" alt="" className="w-4 h-4 opacity-60" />}
            label="Supabase"
            right={toggleIndicator(supabaseConnection.status === 'connected')}
            onClick={supabaseConnection.status === 'connected' ? disconnectSupabase : handleConnectSupabase}
          />
          <DropdownItem
            icon={<img src="/figma.svg" alt="" className="w-4 h-4 opacity-60" />}
            label="Figma"
            right={toggleIndicator(figmaConnection.status === 'connected')}
            onClick={figmaConnection.status === 'connected' ? disconnectFigma : handleConnectFigma}
          />
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection label="Account">
          <DropdownItem
            icon={<CreditCard size={ICON_SIZE.md} />}
            label="Account settings"
            onClick={() => { setIsOpen(false); setAccountSettingsOpen(true); }}
          />
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection label="Avoid">
          <DropdownItem
            icon={<LogOut size={ICON_SIZE.md} />}
            label="Leave Arvid"
            variant="muted"
            onClick={handleSignOut}
          />
        </DropdownSection>
      </DropdownPanel>

      <AccountSettingsModal
        isOpen={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />
    </div>
  );
}
