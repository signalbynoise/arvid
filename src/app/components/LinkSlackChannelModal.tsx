import React, { useEffect, useState } from 'react';
import { LoaderPinwheel, Hash, Lock } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { BaseModal } from './BaseModal';
import { PickerList, PickerItem } from './ui/PickerList';
import { useStore } from '../store';
import { useLinkIntegration } from '../machines/mutations/useLinkIntegration';

interface LinkSlackChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function LinkSlackChannelModal({ isOpen, onClose, projectId }: LinkSlackChannelModalProps) {
  const slackChannels = useStore(s => s.slackChannels);
  const loadSlackChannels = useStore(s => s.loadSlackChannels);
  const setNotificationChannel = useStore(s => s.setNotificationChannel);

  const { error, isLinking, link } = useLinkIntegration({
    integrationType: 'slack',
    link: async (payload) => {
      await setNotificationChannel(projectId, payload.channelId as string);
    },
    onClose,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadSlackChannels().finally(() => setIsLoading(false));
    }
  }, [isOpen, loadSlackChannels]);

  const handleSelect = (channelId: string) => {
    link({ channelId });
  };

  const nonImChannels = slackChannels.filter(ch => !ch.isIm);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Set Alert Channel" size="sm">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoaderPinwheel size={ICON_SIZE.lg} className="animate-spin text-text-quaternary" />
        </div>
      ) : nonImChannels.length === 0 ? (
        <p className="text-caption-lg text-text-quaternary text-center py-8">
          No channels found. Reinstall the Slack app to grant channel permissions.
        </p>
      ) : (
        <PickerList>
          {error && <p className="text-caption-lg text-status-error px-3">{error}</p>}
          {nonImChannels.map(ch => (
            <PickerItem
              key={ch.id}
              icon={ch.isPrivate ? <Lock size={ICON_SIZE.md} /> : <Hash size={ICON_SIZE.md} />}
              label={ch.name}
              disabled={isLinking}
              onClick={() => handleSelect(ch.id)}
            />
          ))}
        </PickerList>
      )}
    </BaseModal>
  );
}
