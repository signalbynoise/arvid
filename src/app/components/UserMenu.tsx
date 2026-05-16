import { useState, useRef, useEffect, useCallback } from 'react';
import { LogOut, UserRound, CreditCard, Sun, Moon } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { IconButton } from './IconButton';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { DropdownDivider } from './ui/DropdownDivider';
import { ToggleIndicator } from './ToggleIndicator';
import { AccountSettingsModal } from './AccountSettingsModal';
import { useAuth } from '../auth/AuthProvider';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { logger } from '../logger';

const log = logger.create('UserMenu');

type SettingsTab = 'account' | 'integrations' | 'deployment' | 'plan' | 'invoices';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [accountSettingsInitialTab, setAccountSettingsInitialTab] = useState<SettingsTab | undefined>(undefined);
  const menuRef = useRef<HTMLDivElement>(null);

  const { theme, toggleTheme } = useTheme();

  const githubConnection = useStore(s => s.githubConnection);
  const linearConnection = useStore(s => s.linearConnection);
  const slackConnection = useStore(s => s.slackConnection);
  const supabaseConnection = useStore(s => s.supabaseConnection);
  const figmaConnection = useStore(s => s.figmaConnection);
  const renderConnection = useStore(s => s.renderConnection);

  const loadGitHubStatus = useStore(s => s.loadGitHubStatus);
  const loadLinearStatus = useStore(s => s.loadLinearStatus);
  const loadSlackStatus = useStore(s => s.loadSlackStatus);
  const loadSupabaseConnectStatus = useStore(s => s.loadSupabaseConnectStatus);
  const loadFigmaStatus = useStore(s => s.loadFigmaStatus);
  const loadRenderStatus = useStore(s => s.loadRenderStatus);

  useEffect(() => {
    loadGitHubStatus();
    loadLinearStatus();
    loadSlackStatus();
    loadSupabaseConnectStatus();
    loadFigmaStatus();
    loadRenderStatus();
  }, [loadGitHubStatus, loadLinearStatus, loadSlackStatus, loadSupabaseConnectStatus, loadFigmaStatus, loadRenderStatus]);

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

  const openTab = (tab: SettingsTab) => {
    setIsOpen(false);
    setAccountSettingsInitialTab(tab);
    setAccountSettingsOpen(true);
  };

  const closeSettings = () => {
    setAccountSettingsOpen(false);
    setAccountSettingsInitialTab(undefined);
  };

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

        <DropdownSection label="Appearance">
          <DropdownItem
            icon={theme === 'dark'
              ? <Moon size={ICON_SIZE.md} />
              : <Sun size={ICON_SIZE.md} />}
            label={theme === 'dark' ? 'Dark mode' : 'Light mode'}
            right={<ToggleIndicator connected={theme === 'light'} />}
            onClick={toggleTheme}
          />
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection label="Integrations">
          <DropdownItem
            icon={<img src="/github.svg" alt="" className="w-4 h-4 opacity-60" />}
            label="Github"
            right={<ToggleIndicator connected={githubConnection.status === 'connected'} />}
            onClick={() => openTab('integrations')}
          />
          <DropdownItem
            icon={<img src="/linear.svg" alt="" className="w-4 h-4 opacity-60" />}
            label="Linear"
            right={<ToggleIndicator connected={linearConnection.status === 'connected'} />}
            onClick={() => openTab('integrations')}
          />
          <DropdownItem
            icon={<img src="/slack.svg" alt="" className="w-4 h-4 opacity-60" />}
            label="Slack"
            right={<ToggleIndicator connected={slackConnection.status === 'connected'} />}
            onClick={() => openTab('integrations')}
          />
          <DropdownItem
            icon={<img src="/supabase.svg" alt="" className="w-4 h-4 opacity-60" />}
            label="Supabase"
            right={<ToggleIndicator connected={supabaseConnection.status === 'connected'} />}
            onClick={() => openTab('integrations')}
          />
          <DropdownItem
            icon={<img src="/figma.svg" alt="" className="w-4 h-4 opacity-60" />}
            label="Figma"
            right={<ToggleIndicator connected={figmaConnection.status === 'connected'} />}
            onClick={() => openTab('integrations')}
          />
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection label="Deployment">
          <DropdownItem
            icon={<img src="/render.svg" alt="" className="w-4 h-4 opacity-60" />}
            label="Render"
            right={<ToggleIndicator connected={renderConnection.status === 'connected'} />}
            onClick={() => openTab('deployment')}
          />
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection label="Account">
          <DropdownItem
            icon={<CreditCard size={ICON_SIZE.md} />}
            label="Account settings"
            onClick={() => openTab('account')}
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
        onClose={closeSettings}
        initialTab={accountSettingsInitialTab}
      />
    </div>
  );
}
