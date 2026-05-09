import React, { useEffect, useState } from 'react';
import { Hash, Lock, MessageSquare, Loader2, Check } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { FooterDropdownTrigger } from './FooterDropdownTrigger';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { useStore } from '../store';
import { logger } from '../logger';

const log = logger.create('SlackChannelSelector');

interface SlackChannelSelectorProps {
  projectId: string;
  onLinked?: () => void;
}

const channelIcon = (ch: { isPrivate: boolean; isIm: boolean }) => {
  if (ch.isIm) return <MessageSquare size={ICON_SIZE.md} />;
  if (ch.isPrivate) return <Lock size={ICON_SIZE.md} />;
  return <Hash size={ICON_SIZE.md} />;
};

export function SlackChannelSelector({ projectId, onLinked }: SlackChannelSelectorProps) {
  const slackChannels = useStore(s => s.slackChannels);
  const loadSlackChannels = useStore(s => s.loadSlackChannels);
  const linkChannelsToProject = useStore(s => s.linkChannelsToProject);

  const [isOpen, setIsOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && slackChannels.length === 0) {
      setIsLoading(true);
      loadSlackChannels().finally(() => setIsLoading(false));
    }
  }, [isOpen, slackChannels.length, loadSlackChannels]);

  useEffect(() => {
    const linked = slackChannels.filter(ch => ch.projectId === projectId);
    setSelectedIds(new Set(linked.map(ch => ch.id)));
  }, [slackChannels, projectId]);

  const toggleChannel = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsLinking(true);
    log.info('save', 'Linking Slack channels', { projectId, count: selectedIds.size });

    try {
      await linkChannelsToProject(projectId, [...selectedIds]);
      setIsOpen(false);
      onLinked?.();
    } catch (err) {
      log.error('save', 'Failed to link channels', {
        error: err instanceof Error ? err.message : 'Unknown',
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="relative">
      <FooterDropdownTrigger onClick={() => setIsOpen(!isOpen)} disabled={isLinking} isOpen={isOpen}>
        <span className="text-text-tertiary">
          {isLinking ? 'Linking...' : 'Select channels'}
        </span>
      </FooterDropdownTrigger>

      <DropdownPanel isOpen={isOpen} variant="attached" position="above">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={ICON_SIZE.md} className="animate-spin text-text-quaternary" />
          </div>
        ) : slackChannels.length === 0 ? (
          <div className="px-3 py-4 text-center text-text-quaternary">
            No channels found.
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1">
              <DropdownSection label="SELECT CHANNELS">
                {slackChannels.filter(ch => !ch.isIm).map(ch => (
                  <DropdownItem
                    key={ch.id}
                    icon={channelIcon(ch)}
                    label={ch.name}
                    right={selectedIds.has(ch.id) ? <Check size={ICON_SIZE.sm} className="text-status-success" /> : undefined}
                    onClick={() => toggleChannel(ch.id)}
                  />
                ))}
              </DropdownSection>
            </div>
            <div className="border-t border-border-subtle px-3 py-2 shrink-0">
              <button type="button" onClick={handleSave} disabled={isLinking} className="btn-primary w-full">
                {isLinking ? 'Saving...' : `Link ${selectedIds.size} channel${selectedIds.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </DropdownPanel>
    </div>
  );
}
