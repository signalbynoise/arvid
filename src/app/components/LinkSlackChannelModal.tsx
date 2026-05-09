import React, { useEffect, useState } from 'react';
import { LoaderPinwheel, Hash, Lock } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { useStore } from '../store';
import { logger } from '../logger';

const log = logger.create('LinkSlackChannelModal');

interface LinkSlackChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function LinkSlackChannelModal({ isOpen, onClose, projectId }: LinkSlackChannelModalProps) {
  const slackChannels = useStore(s => s.slackChannels);
  const loadSlackChannels = useStore(s => s.loadSlackChannels);
  const setNotificationChannel = useStore(s => s.setNotificationChannel);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadSlackChannels().finally(() => setIsLoading(false));
    }
  }, [isOpen, loadSlackChannels]);

  const handleSelect = async (channelId: string) => {
    setIsSaving(true);
    log.info('select', 'Setting notification channel', { projectId, channelId });

    try {
      await setNotificationChannel(projectId, channelId);
      onClose();
    } catch (err) {
      log.error('select', 'Failed to set notification channel', {
        error: err instanceof Error ? err.message : 'Unknown',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const nonImChannels = slackChannels.filter(ch => !ch.isIm);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Set Alert Channel" size="sm">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoaderPinwheel size={20} className="animate-spin text-text-quaternary" />
        </div>
      ) : nonImChannels.length === 0 ? (
        <p className="text-[13px] text-text-quaternary text-center py-8">
          No channels found. Reinstall the Slack app to grant channel permissions.
        </p>
      ) : (
        <div className="max-h-[320px] overflow-y-auto hide-scrollbar space-y-0.5">
          {nonImChannels.map(ch => (
            <button
              key={ch.id}
              type="button"
              disabled={isSaving}
              onClick={() => handleSelect(ch.id)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-comfortable text-left transition-colors hover:bg-surface-frost-04 disabled:opacity-50"
            >
              <span className="shrink-0 text-text-quaternary">
                {ch.isPrivate ? <Lock size={16} /> : <Hash size={16} />}
              </span>
              <span className="text-[13px] text-text-secondary">{ch.name}</span>
            </button>
          ))}
        </div>
      )}
    </BaseModal>
  );
}
