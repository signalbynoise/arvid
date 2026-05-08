import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';
import { DropdownPanel } from './ui/DropdownPanel';

interface UserSuggestion {
  id: string;
  email: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  scope: 'workspace' | 'team' | 'project';
  scopeId: string;
  scopeName: string;
}

const SCOPE_TITLES: Record<Props['scope'], string> = {
  workspace: 'Add user to workspace',
  team: 'Add user to team',
  project: 'Add user to project',
};

export function InviteMemberModal({ isOpen, onClose, workspaceId, scope, scopeId, scopeName }: Props) {
  const sendInvitation = useStore(s => s.sendInvitation);

  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchAbortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    try {
      const results = await api.searchUsers(query, controller.signal);
      if (!controller.signal.aborted) { setSuggestions(results); setShowSuggestions(results.length > 0); setActiveSuggestionIndex(-1); }
    } catch { if (!controller.signal.aborted) { setSuggestions([]); setShowSuggestions(false); } }
  }, []);

  useEffect(() => { const t = setTimeout(() => searchUsers(email), 200); return () => clearTimeout(t); }, [email, searchUsers]);
  useEffect(() => () => searchAbortRef.current?.abort(), []);

  const selectSuggestion = (s: UserSuggestion) => { setEmail(s.email); setShowSuggestions(false); setSuggestions([]); };

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed || !workspaceId) return;
    setError(null);
    setIsSending(true);

    const payload: { email: string; role: 'member'; scope: typeof scope; teamId?: string; projectId?: string } = {
      email: trimmed,
      role: 'member',
      scope,
    };

    if (scope === 'team') payload.teamId = scopeId;
    if (scope === 'project') payload.projectId = scopeId;

    const result = await sendInvitation(workspaceId, payload);
    setIsSending(false);
    if (result) { handleClose(); } else { setError('Failed to send invitation. The email may already be invited.'); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSuggestionIndex(prev => Math.max(prev - 1, 0)); return; }
      if (e.key === 'Enter' && activeSuggestionIndex >= 0) { e.preventDefault(); selectSuggestion(suggestions[activeSuggestionIndex]); return; }
      if (e.key === 'Escape') { setShowSuggestions(false); return; }
    }
    if (e.key === 'Enter' && email.trim() && !showSuggestions) { e.preventDefault(); handleSend(); }
  };

  const handleClose = () => {
    onClose();
    setEmail(''); setError(null); setIsSending(false);
    setSuggestions([]); setShowSuggestions(false);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={SCOPE_TITLES[scope]} size="sm">
      <div className="flex flex-col gap-6">
        <div className="relative">
          <FormField
            label="Name or Email"
            error={error}
            hint="Add multiple users on separate rows"
          >
            <TextInput
              value={email}
              onChange={(v) => { setEmail(v); setError(null); }}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="name@mail.com"
              type="email"
              autoComplete="off"
              hasError={!!error}
              inputRef={inputRef}
            />
          </FormField>
          {showSuggestions && suggestions.length > 0 && (
            <DropdownPanel position="below">
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => selectSuggestion(s)}
                  className={`w-full px-3 py-2 text-left text-caption-lg transition-colors ${i === activeSuggestionIndex ? 'bg-surface-frost-08 text-text-primary' : 'text-text-tertiary hover:text-text-primary'}`}
                >{s.email}</button>
              ))}
            </DropdownPanel>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSend} disabled={!email.trim() || isSending} className="btn-primary">
            {isSending ? 'Adding...' : 'Add new user'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
