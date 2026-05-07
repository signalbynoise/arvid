import React, { useState, useEffect, useMemo } from 'react';
import { Hash, Lock, MessageSquare, Bell, Loader2, Check } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { useStore, selectSlackChannels, selectSelectedProjectId } from '../store';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SlackChannelPicker({ isOpen, onClose }: Props) {
  const channels = useStore(selectSlackChannels);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const loadSlackChannels = useStore(s => s.loadSlackChannels);
  const linkChannelsToProject = useStore(s => s.linkChannelsToProject);
  const setNotificationChannel = useStore(s => s.setNotificationChannel);
  const projects = useStore(s => s.projects);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notifyChannelId, setNotifyChannelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadSlackChannels().finally(() => setIsLoading(false));
    }
  }, [isOpen, loadSlackChannels]);

  useEffect(() => {
    if (channels.length > 0 && selectedProjectId) {
      const linked = channels.filter(ch => ch.projectId === selectedProjectId);
      setSelectedIds(new Set(linked.map(ch => ch.id)));
    }
    if (selectedProject?.slackNotificationChannelId) {
      setNotifyChannelId(selectedProject.slackNotificationChannelId);
    }
  }, [channels, selectedProjectId, selectedProject]);

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
    if (!selectedProjectId) return;
    setIsSaving(true);

    try {
      await linkChannelsToProject(selectedProjectId, [...selectedIds]);
      await setNotificationChannel(selectedProjectId, notifyChannelId);
      toast.success('Slack channels updated');
      onClose();
    } catch {
      toast.error('Failed to update Slack channels');
    } finally {
      setIsSaving(false);
    }
  };

  const channelIcon = (ch: { isPrivate: boolean; isIm: boolean }) => {
    if (ch.isIm) return <MessageSquare size={14} className="text-text-quaternary shrink-0" />;
    if (ch.isPrivate) return <Lock size={14} className="text-text-quaternary shrink-0" />;
    return <Hash size={14} className="text-text-quaternary shrink-0" />;
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Slack Channels" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-text-quaternary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest mb-2">
              Extract from
            </p>
            <div className="max-h-[200px] overflow-y-auto space-y-0.5 border border-border-default rounded-comfortable p-1">
              {channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => toggleChannel(ch.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-standard text-left text-[13px] transition-colors ${
                    selectedIds.has(ch.id)
                      ? 'bg-surface-frost-08 text-text-primary'
                      : 'text-text-secondary hover:bg-surface-frost-04'
                  }`}
                >
                  {channelIcon(ch)}
                  <span className="truncate flex-1">{ch.name}</span>
                  {selectedIds.has(ch.id) && (
                    <Check size={14} className="text-status-success shrink-0" />
                  )}
                </button>
              ))}
              {channels.length === 0 && (
                <p className="text-[12px] text-text-empty text-center py-4">No channels found</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Bell size={12} />
              Notification channel
            </p>
            <div className="max-h-[120px] overflow-y-auto space-y-0.5 border border-border-default rounded-comfortable p-1">
              <button
                onClick={() => setNotifyChannelId(null)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-standard text-left text-[13px] transition-colors ${
                  notifyChannelId === null
                    ? 'bg-surface-frost-08 text-text-primary'
                    : 'text-text-secondary hover:bg-surface-frost-04'
                }`}
              >
                <span className="text-text-quaternary">None</span>
                {notifyChannelId === null && (
                  <Check size={14} className="text-status-success ml-auto shrink-0" />
                )}
              </button>
              {channels.filter(ch => !ch.isIm).map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setNotifyChannelId(ch.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-standard text-left text-[13px] transition-colors ${
                    notifyChannelId === ch.id
                      ? 'bg-surface-frost-08 text-text-primary'
                      : 'text-text-secondary hover:bg-surface-frost-04'
                  }`}
                >
                  {channelIcon(ch)}
                  <span className="truncate flex-1">{ch.name}</span>
                  {notifyChannelId === ch.id && (
                    <Check size={14} className="text-status-success shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSave} disabled={isSaving} className="btn-primary px-4 py-1.5 flex items-center space-x-2">
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
