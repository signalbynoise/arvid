import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Hash, Lock, Loader2, MessageSquare, Check, Sparkles, Search } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore } from '../store';
import { api } from '../api';
import { toast } from 'sonner';

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-surface-frost-12 text-text-primary rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

interface Props {
  onBack: () => void;
  onImport: (text: string) => void;
  onImportMultiple?: (items: Array<{ title: string; description: string }>) => void;
  onWideChange?: (wide: boolean) => void;
}

type SlackStep = 'connect' | 'select-channel' | 'extracting' | 'browse' | 'analyzing' | 'suggest' | 'creating';

interface SlackMessage {
  slack_ts: string;
  thread_ts?: string;
  username: string;
  text: string;
}

interface SuggestedRequirement {
  title: string;
  description: string;
  sourceMessageTs: string[];
  selected: boolean;
}

export function ImportFromSlack({ onBack, onImport, onImportMultiple, onWideChange }: Props) {
  const slackConnection = useStore(s => s.slackConnection);
  const slackChannels = useStore(s => s.slackChannels);
  const loadSlackChannels = useStore(s => s.loadSlackChannels);
  const selectedProjectId = useStore(s => s.selectedProjectId);

  const [step, setStep] = useState<SlackStep>('connect');
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<SlackMessage[]>([]);
  const [selectedMessageTs, setSelectedMessageTs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestedRequirement[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const isConnected = slackConnection.status === 'connected';

  useEffect(() => {
    if (isConnected) {
      setStep('select-channel');
      setIsLoadingChannels(true);
      loadSlackChannels().finally(() => setIsLoadingChannels(false));
    } else {
      setStep('connect');
    }
  }, [isConnected, loadSlackChannels]);

  useEffect(() => {
    onWideChange?.(step === 'browse' || step === 'suggest');
  }, [step, onWideChange]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return allMessages;
    const q = searchQuery.toLowerCase();
    return allMessages.filter(
      m => m.text.toLowerCase().includes(q) || m.username.toLowerCase().includes(q),
    );
  }, [allMessages, searchQuery]);

  const selectedMessages = useMemo(
    () => allMessages.filter(m => selectedMessageTs.has(m.slack_ts)),
    [allMessages, selectedMessageTs],
  );

  const handleConnect = async () => {
    try {
      const { url } = await api.getSlackAuthUrl();
      window.location.href = url;
    } catch {
      toast.error('Failed to initiate Slack connection');
    }
  };

  const handleExtract = async () => {
    if (!selectedChannelId || !selectedProjectId) return;
    setStep('extracting');

    try {
      const result = await api.extractSlackChannelMessages(selectedProjectId, selectedChannelId);
      if (result.messages.length === 0) {
        toast.error('No messages found in that channel');
        setStep('select-channel');
        return;
      }
      setAllMessages(result.messages);
      setSelectedMessageTs(new Set());
      setSearchQuery('');
      setStep('browse');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Extraction failed: ${message}`);
      setStep('select-channel');
    }
  };

  const handleAnalyzeSelected = async () => {
    if (selectedMessageTs.size === 0 || !selectedProjectId) return;
    setStep('analyzing');

    try {
      const result = await api.reanalyzeSlackMessages(selectedProjectId, selectedMessages);
      setSuggestions(result.suggestions.map(s => ({ ...s, selected: true })));
      setStep('suggest');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Analysis failed: ${message}`);
      setStep('browse');
    }
  };

  const toggleMessageSelection = (ts: string) => {
    setSelectedMessageTs(prev => {
      const next = new Set(prev);
      if (next.has(ts)) next.delete(ts);
      else next.add(ts);
      return next;
    });
  };

  const toggleSuggestion = (index: number) => {
    setSuggestions(prev => prev.map((s, i) => i === index ? { ...s, selected: !s.selected } : s));
  };

  const handleCreate = () => {
    const selected = suggestions.filter(s => s.selected);
    if (selected.length === 0) {
      toast.error('Select at least one requirement');
      return;
    }
    setStep('creating');
    if (onImportMultiple) {
      onImportMultiple(selected.map(s => ({ title: s.title, description: s.description })));
    } else {
      onImport(selected.map(s => `${s.title}\n\n${s.description}`).join('\n\n---\n\n'));
    }
  };

  const highlightedTs = activeSuggestionIndex !== null
    ? new Set(suggestions[activeSuggestionIndex]?.sourceMessageTs ?? [])
    : new Set<string>();

  const nonImChannels = slackChannels.filter(ch => !ch.isIm);

  // --- CONNECT ---
  if (step === 'connect') {
    return (
      <div className="space-y-5">
        <div className="bg-surface-frost-02 border border-border-default rounded-card p-5 text-center">
          <MessageSquare size={ICON_SIZE.xl} className="mx-auto text-text-tertiary mb-3" />
          <h3 className="text-[14px] font-[var(--fw-medium)] text-text-primary mb-2">Connect Slack Workspace</h3>
          <p className="text-[13px] text-text-tertiary mb-4">Connect your workspace to extract knowledge from channels.</p>
          <button onClick={handleConnect} className="btn-primary w-full">
            Connect Slack
          </button>
        </div>
        <div className="flex pt-3">
          <button onClick={onBack} className="btn-ghost flex items-center space-x-1.5 -ml-2">
            <ArrowLeft size={ICON_SIZE.sm} />
            <span>Back</span>
          </button>
        </div>
      </div>
    );
  }

  // --- EXTRACTING / ANALYZING ---
  if (step === 'extracting' || step === 'analyzing') {
    return (
      <div className="space-y-5">
        <div className="bg-surface-frost-02 border border-border-default rounded-card p-8 text-center">
          <Loader2 size={ICON_SIZE.xl} className="mx-auto text-text-tertiary mb-3 animate-spin" />
          <h3 className="text-[14px] font-[var(--fw-medium)] text-text-primary mb-2">
            {step === 'extracting' ? 'Loading Messages' : 'Analyzing Messages'}
          </h3>
          <p className="text-[13px] text-text-tertiary">
            {step === 'extracting'
              ? 'Pulling messages and threads from the channel...'
              : 'Identifying requirements from selected messages...'}
          </p>
        </div>
      </div>
    );
  }

  // --- BROWSE & FILTER ---
  if (step === 'browse') {
    return (
      <div className="flex flex-col min-h-[500px]">
        <div className="px-4 pt-4 pb-3 border-b border-border-subtle shrink-0">
          <div className="relative">
            <Search size={ICON_SIZE.sm} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-quaternary" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-surface-frost-02 border border-border-default rounded-comfortable text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-hover"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-text-quaternary">
              {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
            {selectedMessageTs.size > 0 && (
              <p className="text-[11px] font-[var(--fw-medium)] text-status-success">
                {selectedMessageTs.size} selected
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredMessages.map(msg => {
            const isSelected = selectedMessageTs.has(msg.slack_ts);
            const isThread = !!msg.thread_ts;
            return (
              <div
                key={msg.slack_ts}
                onClick={() => toggleMessageSelection(msg.slack_ts)}
                className={`rounded-standard px-3 py-2 transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-surface-frost-06 border-l-2 border-status-success'
                    : 'border-l-2 border-transparent hover:bg-surface-frost-04'
                } ${isThread ? 'ml-4' : ''}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-[var(--fw-medium)] text-text-secondary">
                    {msg.username}
                  </span>
                  {isThread && (
                    <span className="text-[10px] text-text-quaternary">thread reply</span>
                  )}
                  {isSelected && (
                    <Check size={10} className="text-status-success ml-auto" />
                  )}
                </div>
                <p className="text-[12px] text-text-tertiary leading-relaxed whitespace-pre-wrap break-words">
                  <HighlightedText text={msg.text} query={searchQuery} />
                </p>
              </div>
            );
          })}
          {filteredMessages.length === 0 && (
            <div className="text-center py-8 text-[12px] text-text-quaternary">
              No messages match your search.
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-4 py-3 border-t border-border-subtle shrink-0">
          <button
            onClick={() => { setStep('select-channel'); onWideChange?.(false); }}
            className="btn-ghost flex items-center space-x-1.5"
          >
            <ArrowLeft size={ICON_SIZE.sm} />
            <span>Back</span>
          </button>
          <button onClick={handleAnalyzeSelected} disabled={selectedMessageTs.size === 0} className="btn-primary flex items-center space-x-2">
            <Sparkles size={13} />
            <span>Analyze {selectedMessageTs.size || ''} Selected</span>
          </button>
        </div>
      </div>
    );
  }

  // --- SUGGEST (split-pane) ---
  if (step === 'suggest') {
    return (
      <div className="flex flex-col min-h-[500px]">
        <div className="flex flex-1 min-h-0">
          {/* Left: Selected Messages */}
          <div className="w-1/2 border-r border-border-subtle overflow-y-auto p-4">
            <p className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest mb-3">
              Selected Messages ({selectedMessages.length})
            </p>
            <div className="space-y-1">
              {selectedMessages.map(msg => {
                const isHighlighted = highlightedTs.has(msg.slack_ts);
                const isThread = !!msg.thread_ts;
                return (
                  <div
                    key={msg.slack_ts}
                    className={`rounded-standard px-3 py-2 transition-all duration-150 ${
                      isHighlighted
                        ? 'bg-surface-frost-08 border-l-2 border-status-info'
                        : 'border-l-2 border-transparent'
                    } ${isThread ? 'ml-4' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-[var(--fw-medium)] text-text-secondary">
                        {msg.username}
                      </span>
                      {isThread && (
                        <span className="text-[10px] text-text-quaternary">thread reply</span>
                      )}
                    </div>
                    <p className="text-[12px] text-text-tertiary leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Suggestions */}
          <div className="w-1/2 overflow-y-auto p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={13} className="text-text-tertiary" />
              <p className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">
                Suggested Requirements ({suggestions.length})
              </p>
            </div>

            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[13px] text-text-quaternary">No actionable requirements found in the selected messages.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => setActiveSuggestionIndex(i)}
                    onMouseLeave={() => setActiveSuggestionIndex(null)}
                    onClick={() => toggleSuggestion(i)}
                    className={`cursor-pointer p-3 rounded-comfortable border transition-all duration-150 ${
                      s.selected
                        ? 'border-border-hover bg-surface-frost-06'
                        : 'border-border-default bg-surface-frost-02 opacity-60'
                    } ${activeSuggestionIndex === i ? 'ring-1 ring-status-info' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 h-4 w-4 rounded-standard border flex items-center justify-center shrink-0 ${
                        s.selected ? 'border-status-success bg-status-success' : 'border-border-default'
                      }`}>
                        {s.selected && <Check size={10} className="text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-[var(--fw-medium)] text-text-primary">{s.title}</p>
                        <p className="text-[12px] text-text-tertiary mt-1 line-clamp-3">{s.description}</p>
                        <p className="text-[10px] text-text-quaternary mt-2">
                          Based on {s.sourceMessageTs.length} message{s.sourceMessageTs.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-border-subtle shrink-0">
          <button onClick={() => setStep('browse')} className="btn-ghost flex items-center space-x-1.5">
            <ArrowLeft size={ICON_SIZE.sm} />
            <span>Back to messages</span>
          </button>
          <button onClick={handleCreate} disabled={suggestions.filter(s => s.selected).length === 0} className="btn-primary">
            Create {suggestions.filter(s => s.selected).length} Requirement{suggestions.filter(s => s.selected).length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    );
  }

  // --- SELECT CHANNEL ---
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-text-secondary">
        Select a channel to browse messages from. You'll be able to search and select specific messages for analysis.
      </p>

      <div className="max-h-[220px] overflow-y-auto border border-border-default rounded-comfortable">
        {isLoadingChannels ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={ICON_SIZE.md} className="animate-spin text-text-quaternary" />
          </div>
        ) : nonImChannels.length === 0 ? (
          <div className="px-3 py-6 text-center text-[12px] text-text-quaternary">
            No channels found. You may need to reinstall the Slack app to grant channel permissions.
          </div>
        ) : (
          <div className="py-1">
            {nonImChannels.map(ch => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChannelId(ch.id)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-left text-[13px] transition-colors ${
                  selectedChannelId === ch.id
                    ? 'bg-surface-frost-08 text-text-primary'
                    : 'text-text-secondary hover:bg-surface-frost-04'
                }`}
              >
                {ch.isPrivate ? (
                  <Lock size={13} className="shrink-0 text-text-quaternary" />
                ) : (
                  <Hash size={13} className="shrink-0 text-text-quaternary" />
                )}
                <span className="font-[var(--fw-medium)] truncate">{ch.name}</span>
                {selectedChannelId === ch.id && (
                  <Check size={ICON_SIZE.sm} className="text-status-success ml-auto shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-2">
        <button onClick={onBack} className="btn-ghost flex items-center space-x-1.5 -ml-2">
          <ArrowLeft size={ICON_SIZE.sm} />
          <span>Back</span>
        </button>
        <button onClick={handleExtract} disabled={!selectedChannelId} className="btn-primary">
          Load Messages
        </button>
      </div>
    </div>
  );
}
