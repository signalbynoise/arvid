import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import { Server, Check } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';
import { PickerList, PickerSection, PickerItem } from './ui/PickerList';
import { SubmitButton } from './ui/SubmitButton';
import { ModalFooter } from './ui/ModalFooter';
import { logger } from '../logger';

const log = logger.create('ConnectRenderModal');

interface RenderOwner {
  id: string;
  name: string;
  email: string;
  type: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectRenderModal({ isOpen, onClose }: Props) {
  const renderConnection = useStore(s => s.renderConnection);
  const connectRender = useStore(s => s.connectRender);
  const disconnectRender = useStore(s => s.disconnectRender);

  const [apiKey, setApiKey] = useState('');
  const [owners, setOwners] = useState<RenderOwner[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [keyValidated, setKeyValidated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isConnected = renderConnection.status === 'connected';

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsValidating(false);
      setIsConnecting(false);
      setIsDisconnecting(false);

      if (!isConnected) {
        setApiKey('');
        setOwners([]);
        setSelectedOwnerId('');
        setKeyValidated(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, isConnected]);

  const handleValidateKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('API key is required');
      return;
    }

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
        setKeyValidated(true);
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
  };

  const handleConnect = async () => {
    const owner = owners.find(o => o.id === selectedOwnerId);
    if (!owner) return;

    setError(null);
    setIsConnecting(true);

    try {
      const success = await connectRender(apiKey.trim(), owner.id, owner.name);
      if (success) {
        onClose();
      } else {
        setError('Failed to connect. Please try again.');
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
      setKeyValidated(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      log.error('disconnect', 'Disconnect failed', { error: err instanceof Error ? err.message : 'Unknown' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleBack = () => {
    setKeyValidated(false);
    setOwners([]);
    setSelectedOwnerId('');
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidateKey();
    }
  };

  const connectedFooter = (
    <ModalFooter>
      <button onClick={onClose} className="btn-ghost">Close</button>
      <button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        className="btn-ghost text-status-error hover:text-status-error/80"
      >
        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
      </button>
    </ModalFooter>
  );

  const keyFooter = (
    <ModalFooter>
      <button onClick={onClose} className="btn-ghost">Cancel</button>
      <SubmitButton
        onClick={handleValidateKey}
        disabled={!apiKey.trim()}
        label="Continue"
        loadingLabel="Validating..."
        isLoading={isValidating}
      />
    </ModalFooter>
  );

  const workspaceFooter = (
    <ModalFooter back={<button className="btn-ghost" onClick={handleBack}>Back</button>}>
      <button onClick={onClose} className="btn-ghost">Cancel</button>
      <SubmitButton
        onClick={handleConnect}
        disabled={!selectedOwnerId}
        label="Connect"
        loadingLabel="Connecting..."
        isLoading={isConnecting}
      />
    </ModalFooter>
  );

  if (isConnected) {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="Render" size="sm" footer={connectedFooter}>
        <FormField label="Status">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success shrink-0" />
            <span className="text-caption-lg text-text-primary">
              Connected to {renderConnection.ownerName}
            </span>
          </div>
        </FormField>
      </BaseModal>
    );
  }

  if (keyValidated) {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="Select Workspace" size="sm" footer={workspaceFooter}>
        <FormField label="Render Workspace" error={error}>
          <PickerList>
            {owners.map(o => (
              <PickerItem
                key={o.id}
                icon={<Server size={ICON_SIZE.md} />}
                label={o.name}
                right={o.id === selectedOwnerId ? <Check size={ICON_SIZE.sm} className="text-status-success" /> : undefined}
                onClick={() => setSelectedOwnerId(o.id)}
              />
            ))}
          </PickerList>
        </FormField>
      </BaseModal>
    );
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Connect Render" size="sm" footer={keyFooter}>
      <FormField
        label="API Key"
        hint="Find your API key at dashboard.render.com → Account Settings → API Keys"
        error={error}
      >
        <TextInput
          value={apiKey}
          onChange={(v) => { setApiKey(v); setError(null); }}
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
          hasError={!!error}
          placeholder="rnd_..."
        />
      </FormField>
    </BaseModal>
  );
}
