import { useEffect, useState, useCallback } from 'react';
import { Check, X, Loader2, Unplug } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { useStore } from '../../store';
import { api } from '../../api';
import { logger } from '../../logger';

const log = logger.create('AccountIntegrations');

type ConnectionStatus = 'idle' | 'loading' | 'connected' | 'disconnected' | 'error';

interface IntegrationDef {
  id: string;
  label: string;
  icon: string;
  getStatus: () => ConnectionStatus;
  getDetail: () => string | undefined;
  loadStatus: () => Promise<void>;
  getAuthUrl: () => Promise<string>;
  disconnect: () => Promise<void>;
}

interface IntegrationRowProps {
  def: IntegrationDef;
  isDisconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function IntegrationRow({ def, isDisconnecting, onConnect, onDisconnect }: IntegrationRowProps) {
  const status = def.getStatus();
  const detail = def.getDetail();
  const isLoading = status === 'idle' || status === 'loading';
  const isConnected = status === 'connected';

  return (
    <div className="flex items-center justify-between p-4 rounded-card bg-surface-frost-02 border border-border-default">
      <div className="flex items-center gap-3 min-w-0">
        <img src={def.icon} alt="" className="w-5 h-5 opacity-70 shrink-0" />
        <div className="min-w-0">
          <p className="text-caption-lg text-text-primary">{def.label}</p>
          {isConnected && detail && (
            <p className="text-label-sm text-text-tertiary truncate">{detail}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {isLoading ? (
          <Loader2 size={ICON_SIZE.sm} className="animate-spin text-text-quaternary" />
        ) : isConnected ? (
          <>
            <span className="flex items-center gap-1 text-label text-status-success">
              <Check size={ICON_SIZE.xs} />
              Connected
            </span>
            <button
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className="flex items-center gap-1.5 text-label text-text-quaternary hover:text-status-error transition-colors"
              title={`Disconnect ${def.label}`}
            >
              {isDisconnecting ? (
                <Loader2 size={ICON_SIZE.xs} className="animate-spin" />
              ) : (
                <Unplug size={ICON_SIZE.xs} />
              )}
              <span>Disconnect</span>
            </button>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1 text-label text-text-quaternary">
              <X size={ICON_SIZE.xs} />
              Not connected
            </span>
            <button
              onClick={onConnect}
              className="btn-ghost text-label"
            >
              Connect
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function IntegrationsTab() {
  const githubStatus = useStore(s => s.githubConnection.status);
  const githubUsername = useStore(s => s.githubConnection.username);
  const loadGitHubStatus = useStore(s => s.loadGitHubStatus);
  const disconnectGitHub = useStore(s => s.disconnectGitHub);

  const linearStatus = useStore(s => s.linearConnection.status);
  const linearUsername = useStore(s => s.linearConnection.username);
  const loadLinearStatus = useStore(s => s.loadLinearStatus);
  const disconnectLinear = useStore(s => s.disconnectLinear);

  const slackStatus = useStore(s => s.slackConnection.status);
  const slackTeamName = useStore(s => s.slackConnection.teamName);
  const loadSlackStatus = useStore(s => s.loadSlackStatus);
  const disconnectSlack = useStore(s => s.disconnectSlack);

  const supabaseStatus = useStore(s => s.supabaseConnection.status);
  const supabaseOrgName = useStore(s => s.supabaseConnection.orgName);
  const loadSupabaseStatus = useStore(s => s.loadSupabaseConnectStatus);
  const disconnectSupabase = useStore(s => s.disconnectSupabase);

  const figmaStatus = useStore(s => s.figmaConnection.status);
  const figmaUsername = useStore(s => s.figmaConnection.username);
  const loadFigmaStatus = useStore(s => s.loadFigmaStatus);
  const disconnectFigma = useStore(s => s.disconnectFigma);

  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    loadGitHubStatus();
    loadLinearStatus();
    loadSlackStatus();
    loadSupabaseStatus();
    loadFigmaStatus();
  }, [loadGitHubStatus, loadLinearStatus, loadSlackStatus, loadSupabaseStatus, loadFigmaStatus]);

  const handleConnect = useCallback(async (getAuthUrl: () => Promise<string>, label: string) => {
    try {
      const url = await getAuthUrl();
      window.location.href = url;
    } catch (err) {
      log.error('connect', `Failed to get ${label} auth URL`, {
        error: err instanceof Error ? err.message : 'Unknown',
      });
    }
  }, []);

  const handleDisconnect = useCallback(async (id: string, disconnect: () => Promise<void>, label: string) => {
    setDisconnecting(id);
    try {
      await disconnect();
      log.info('disconnect', `${label} disconnected`);
    } catch (err) {
      log.error('disconnect', `Failed to disconnect ${label}`, {
        error: err instanceof Error ? err.message : 'Unknown',
      });
    } finally {
      setDisconnecting(null);
    }
  }, []);

  const integrations: IntegrationDef[] = [
    {
      id: 'github',
      label: 'GitHub',
      icon: '/github.svg',
      getStatus: () => githubStatus,
      getDetail: () => githubUsername,
      loadStatus: loadGitHubStatus,
      getAuthUrl: async () => (await api.getGitHubAuthUrl()).url,
      disconnect: disconnectGitHub,
    },
    {
      id: 'linear',
      label: 'Linear',
      icon: '/linear.svg',
      getStatus: () => linearStatus,
      getDetail: () => linearUsername,
      loadStatus: loadLinearStatus,
      getAuthUrl: async () => (await api.getLinearAuthUrl()).url,
      disconnect: disconnectLinear,
    },
    {
      id: 'slack',
      label: 'Slack',
      icon: '/slack.svg',
      getStatus: () => slackStatus,
      getDetail: () => slackTeamName,
      loadStatus: loadSlackStatus,
      getAuthUrl: async () => (await api.getSlackAuthUrl()).url,
      disconnect: disconnectSlack,
    },
    {
      id: 'supabase',
      label: 'Supabase',
      icon: '/supabase.svg',
      getStatus: () => supabaseStatus,
      getDetail: () => supabaseOrgName,
      loadStatus: loadSupabaseStatus,
      getAuthUrl: async () => (await api.getSupabaseConnectAuthUrl()).url,
      disconnect: disconnectSupabase,
    },
    {
      id: 'figma',
      label: 'Figma',
      icon: '/figma.svg',
      getStatus: () => figmaStatus,
      getDetail: () => figmaUsername,
      loadStatus: loadFigmaStatus,
      getAuthUrl: async () => (await api.getFigmaAuthUrl()).url,
      disconnect: disconnectFigma,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <span className="text-label-upper text-text-tertiary">
          Connected Accounts
        </span>
        <p className="text-label-sm text-text-quaternary">
          Connect your accounts to enable project-level integrations.
        </p>
      </div>

      <div className="space-y-2">
        {integrations.map(def => (
          <IntegrationRow
            key={def.id}
            def={def}
            isDisconnecting={disconnecting === def.id}
            onConnect={() => handleConnect(def.getAuthUrl, def.label)}
            onDisconnect={() => handleDisconnect(def.id, def.disconnect, def.label)}
          />
        ))}
      </div>
    </div>
  );
}
