import React, { useEffect, useState } from 'react';
import { Hash, Lock, MessageSquare, Loader2, ChevronDown, Check } from 'lucide-react';
import { useStore } from '../store';
import { logger } from '../logger';

const log = logger.create('SlackChannelSelector');

interface SlackChannelSelectorProps {
  projectId: string;
  onLinked?: () => void;
}

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

  const channelIcon = (ch: { isPrivate: boolean; isIm: boolean }) => {
    if (ch.isIm) return <MessageSquare size={12} className="shrink-0 text-text-quaternary" />;
    if (ch.isPrivate) return <Lock size={12} className="shrink-0 text-text-quaternary" />;
    return <Hash size={12} className="shrink-0 text-text-quaternary" />;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLinking}
        className="flex items-center gap-2 w-full px-3 py-2 text-[12px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-secondary bg-surface-frost-02 hover:bg-surface-frost-06 border border-border-default rounded-comfortable transition-colors disabled:opacity-50"
      >
        <Hash size={13} className="shrink-0" />
        <span className="truncate">
          {isLinking ? 'Linking...' : 'Select channels'}
        </span>
        <ChevronDown size={12} className="shrink-0 ml-auto" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 z-50 max-h-[320px] min-w-[240px] w-max overflow-hidden bg-surface-panel border border-border-default rounded-comfortable shadow-lg flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-text-quaternary" />
            </div>
          ) : slackChannels.length === 0 ? (
            <div className="px-3 py-4 text-center text-[12px] text-text-quaternary">
              No channels found.
            </div>
          ) : (
            <>
              <div className="overflow-y-auto flex-1 py-1">
                <div className="px-3 py-1.5 text-[10px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-wider">
                  Select channels to extract from
                </div>
                {slackChannels.filter(ch => !ch.isIm).map(ch => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-[12px] transition-colors ${
                      selectedIds.has(ch.id)
                        ? 'bg-surface-frost-06 text-text-primary'
                        : 'text-text-secondary hover:bg-surface-frost-04'
                    }`}
                  >
                    {channelIcon(ch)}
                    <span className="font-[var(--fw-medium)] truncate flex-1">{ch.name}</span>
                    {selectedIds.has(ch.id) && (
                      <Check size={12} className="text-status-success shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-border-subtle px-3 py-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLinking}
                  className="w-full px-3 py-1.5 text-[11px] font-[var(--fw-medium)] bg-white text-black rounded-comfortable hover:bg-btn-primary-hover transition-colors disabled:opacity-50"
                >
                  {isLinking ? 'Saving...' : `Link ${selectedIds.size} channel${selectedIds.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
