import React, { useEffect, useState, useMemo } from 'react';
import { Hash, Lock, Loader2, ChevronDown } from 'lucide-react';
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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSaving}
        className="flex items-center gap-2 w-full px-3 py-2 text-[12px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-secondary bg-surface-frost-02 hover:bg-surface-frost-06 border border-border-default rounded-comfortable transition-colors disabled:opacity-50"
      >
        <span className="truncate">
          {isSaving ? 'Saving...' : currentChannel ? `#${currentChannel.name}` : 'Select channel'}
        </span>
        <ChevronDown size={12} className="shrink-0 ml-auto" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 z-50 max-h-[280px] min-w-[220px] w-max overflow-y-auto bg-surface-panel border border-border-default rounded-comfortable shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-text-quaternary" />
            </div>
          ) : nonImChannels.length === 0 ? (
            <div className="px-3 py-4 text-center text-[12px] text-text-quaternary">
              No channels found. Reinstall the Slack app to grant channel permissions.
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[10px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-wider">
                Notify on events
              </div>
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-left text-[12px] transition-colors ${
                  !currentChannel ? 'bg-surface-frost-06 text-text-primary' : 'text-text-secondary hover:bg-surface-frost-04'
                }`}
              >
                <span>None (disabled)</span>
              </button>
              {nonImChannels.map(ch => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSelect(ch.id)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-left text-[12px] transition-colors ${
                    currentChannel?.id === ch.id ? 'bg-surface-frost-06 text-text-primary' : 'text-text-secondary hover:bg-surface-frost-04'
                  }`}
                >
                  {ch.isPrivate ? (
                    <Lock size={12} className="shrink-0 text-text-quaternary" />
                  ) : (
                    <Hash size={12} className="shrink-0 text-text-quaternary" />
                  )}
                  <span className="font-[var(--fw-medium)] truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
