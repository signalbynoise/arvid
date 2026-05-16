import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Check, Unplug } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { useStore } from '../../store';
import { api } from '../../api';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { Select } from '../ui/Select';
import { logger } from '../../logger';

const log = logger.create('DeploymentTab');

interface RenderOwner {
  id: string;
  name: string;
  email: string;
  type: string;
}

export function DeploymentTab() {
  const renderConnection = useStore(s => s.renderConnection);
  const connectRender = useStore(s => s.connectRender);
  const disconnectRender = useStore(s => s.disconnectRender);
  const loadRenderStatus = useStore(s => s.loadRenderStatus);

  const isConnected = renderConnection.status === 'connected';

  const [apiKey, setApiKey] = useState('');
  const [owners, setOwners] = useState<RenderOwner[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRenderStatus();
  }, [loadRenderStatus]);

  useEffect(() => {
    if (!isConnected) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isConnected]);

  const validateAndLoadOwners = useCallback(async (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('rnd_')) {
      setError('Render API keys start with rnd_');
      return;
    }

    setError(null);
    setIsValidating(true);

    try {
      const result = await api.validateRenderKey(trimmed);
      if (result.valid && result.owners.length > 0) {
        setOwners(result.owners);
        setSelectedOwnerId(result.owners[0].id);
        log.info('validateKey', 'Key validated, owners loaded', { count: result.owners.length });
      } else {
        setError('No workspaces found for this API key.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Validation failed';
      setError(message.includes('401') ? 'Invalid API key' : message);
      log.error('validateKey', 'Key validation failed', { error: message });
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleKeyBlur = () => {
    if (apiKey.trim() && owners.length === 0 && !isValidating) {
      validateAndLoadOwners(apiKey);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateAndLoadOwners(apiKey);
    }
  };

  const handleConnect = async () => {
    const owner = owners.find(o => o.id === selectedOwnerId);
    if (!owner) return;

    setError(null);
    setIsConnecting(true);

    try {
      const success = await connectRender(apiKey.trim(), owner.id, owner.name);
      if (!success) {
        setError('Failed to connect. Please try again.');
      } else {
        log.info('connect', 'Render connected', { ownerName: owner.name });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectRender();
      setApiKey('');
      setOwners([]);
      setSelectedOwnerId('');
      setError(null);
      log.info('disconnect', 'Render disconnected');
    } catch (err) {
      log.error('disconnect', 'Disconnect failed', { error: err instanceof Error ? err.message : 'Unknown' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const workspaceOptions = [
    { value: '', label: 'Select workspace' },
    ...owners.map(o => ({ value: o.id, label: o.name })),
  ];

  const canConnect = selectedOwnerId && apiKey.trim() && !isConnecting && !isValidating;

  if (isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/render.svg" alt="" className="w-5 h-5 opacity-70" />
            <div>
              <p className="text-caption-lg text-text-primary">Render</p>
              <p className="text-label-sm text-text-tertiary">{renderConnection.ownerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-label text-status-success">
              <Check size={ICON_SIZE.xs} />
              Connected
            </span>
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="flex items-center gap-1.5 text-label text-text-quaternary hover:text-status-error transition-colors"
            >
              {isDisconnecting ? (
                <Loader2 size={ICON_SIZE.xs} className="animate-spin" />
              ) : (
                <Unplug size={ICON_SIZE.xs} />
              )}
              <span>Disconnect</span>
            </button>
          </div>
        </div>

        <FormField label="API Key">
          <TextInput value="••••" onChange={() => {}} disabled />
        </FormField>

        <FormField label="Render Workspace">
          <TextInput value={renderConnection.ownerName ?? ''} onChange={() => {}} disabled />
        </FormField>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FormField
        label="API Key"
        hint="Find your API key at dashboard.render.com → Account Settings → API Keys"
        error={error}
      >
        <TextInput
          value={apiKey}
          onChange={(v) => { setApiKey(v); setError(null); }}
          onKeyDown={handleKeyDown}
          onBlur={handleKeyBlur}
          inputRef={inputRef}
          hasError={!!error}
          placeholder="rnd_..."
        />
      </FormField>

      <FormField label="Render Workspace">
        {isValidating ? (
          <div className="flex items-center gap-2 p-3">
            <Loader2 size={ICON_SIZE.sm} className="animate-spin text-text-quaternary" />
            <span className="text-caption-lg text-text-tertiary">Loading workspaces...</span>
          </div>
        ) : (
          <Select
            value={selectedOwnerId}
            onChange={setSelectedOwnerId}
            options={workspaceOptions}
            disabled={owners.length === 0}
          />
        )}
      </FormField>

      {owners.length > 0 && (
        <button
          onClick={handleConnect}
          disabled={!canConnect}
          className="btn-primary flex items-center gap-2"
        >
          {isConnecting && <Loader2 size={ICON_SIZE.sm} className="animate-spin" />}
          <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
        </button>
      )}
    </div>
  );
}
