import React, { useEffect, useState, useMemo } from 'react';
import { Hash, Lock, Loader2 } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { FooterDropdownTrigger } from './FooterDropdownTrigger';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { useStore } from '../store';
import { logger } from '../logger';

const log = logger.create('SlackNotifySelector');

interface Props {
  projectId: string;
}

export function SlackNotifySelector({ projectId }: Props) {
  const slackChannels = useStore(s => s.slackChannels);
  const loadSlackChannels = useStore(s => s.loadSlackChannels);
  const setNotificationChannel = useStore(s => s.setNotificationChannel);
  const projects = useStore(s => s.projects);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const project = useMemo(
    () => projects.find(p => p.id === projectId),
    [projects, projectId],
  );

  const currentChannel = useMemo(
    () => slackChannels.find(ch => ch.id === project?.slackNotificationChannelId),
    [slackChannels, project],
  );

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadSlackChannels().finally(() => setIsLoading(false));
    }
  }, [isOpen, loadSlackChannels]);

  const handleSelect = async (channelId: string | null) => {
    setIsSaving(true);
    log.info('select', 'Setting notification channel', { projectId, channelId });

    try {
      await setNotificationChannel(projectId, channelId);
      setIsOpen(false);
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
    <div className="relative">
      <FooterDropdownTrigger onClick={() => setIsOpen(!isOpen)} disabled={isSaving} isOpen={isOpen}>
        <span className={currentChannel ? 'text-text-primary' : 'text-text-tertiary'}>
          {isSaving ? 'Saving...' : currentChannel ? `#${currentChannel.name}` : 'Select channel'}
        </span>
      </FooterDropdownTrigger>

      <DropdownPanel isOpen={isOpen} variant="attached" position="above">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={ICON_SIZE.md} className="animate-spin text-text-quaternary" />
          </div>
        ) : nonImChannels.length === 0 ? (
          <div className="px-3 py-4 text-center text-text-quaternary">
            No channels found. Reinstall the Slack app to grant channel permissions.
          </div>
        ) : (
          <DropdownSection label="NOTIFY ON EVENTS">
            <DropdownItem
              label="None (disabled)"
              variant="muted"
              onClick={() => handleSelect(null)}
            />
            {nonImChannels.map(ch => (
              <DropdownItem
                key={ch.id}
                icon={ch.isPrivate ? <Lock size={ICON_SIZE.md} /> : <Hash size={ICON_SIZE.md} />}
                label={ch.name}
                onClick={() => handleSelect(ch.id)}
              />
            ))}
          </DropdownSection>
        )}
      </DropdownPanel>
    </div>
  );
}
