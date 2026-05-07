import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users } from 'lucide-react';
import { useStore, selectActiveWorkspaceId, selectTeams } from '../store';
import { api } from '../api';
import { BaseModal } from './BaseModal';

interface UserSuggestion {
  id: string;
  email: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteMemberModal({ isOpen, onClose }: Props) {
  const sendInvitation = useStore(s => s.sendInvitation);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const teams = useStore(selectTeams);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchAbortRef = useRef<AbortController | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (teams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teams[0].id);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, teams, selectedTeamId]);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    try {
      const results = await api.searchUsers(query, controller.signal);
      if (!controller.signal.aborted) {
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setActiveSuggestionIndex(-1);
      }
    } catch {
      if (!controller.signal.aborted) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(email), 200);
    return () => clearTimeout(timer);
  }, [email, searchUsers]);

  useEffect(() => {
    return () => searchAbortRef.current?.abort();
  }, []);

  const selectSuggestion = (suggestion: UserSuggestion) => {
    setEmail(suggestion.email);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed || !activeWorkspaceId) return;

    setError(null);
    setIsSending(true);

    const result = await sendInvitation(activeWorkspaceId, selectedTeamId, trimmed, role);
    setIsSending(false);

    if (result) {
      handleClose();
    } else {
      setError('Failed to send invitation. The email may already be invited.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeSuggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter' && email.trim() && !showSuggestions) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    onClose();
    setEmail('');
    setRole('member');
    setSelectedTeamId(teams.length > 0 ? teams[0].id : undefined);
    setError(null);
    setIsSending(false);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Invite Member" size="sm">
      <div className="space-y-5">
        <div className="space-y-2 relative">
          <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
            Email
          </label>
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="colleague@company.com"
            autoComplete="off"
            className={`w-full bg-surface-frost-02 border rounded-comfortable px-3 py-2.5 text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-focus focus:bg-surface-frost-04 transition-all ${
              error ? 'border-status-error-border-focus' : 'border-border-default'
            }`}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface-elevated border border-border-default rounded-card shadow-modal overflow-hidden"
            >
              {suggestions.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => selectSuggestion(s)}
                  className={`w-full px-3 py-2 text-left text-[13px] transition-colors ${
                    index === activeSuggestionIndex
                      ? 'bg-surface-frost-08 text-text-primary'
                      : 'text-text-secondary hover:bg-surface-frost-04'
                  }`}
                >
                  {s.email}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="text-[12px] text-status-error">{error}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
            Role
          </label>
          <div className="flex gap-2">
            {(['member', 'admin'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 px-3 py-2 rounded-comfortable text-[13px] font-[var(--fw-medium)] border transition-colors ${
                  role === r
                    ? 'bg-surface-frost-08 border-border-focus text-text-primary'
                    : 'bg-surface-frost-02 border-border-default text-text-tertiary hover:bg-surface-frost-04'
                }`}
              >
                {r === 'member' ? 'Member' : 'Admin'}
              </button>
            ))}
          </div>
        </div>

        {teams.length > 0 && (
          <div className="space-y-2">
            <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
              Team
            </label>
            <div className="bg-surface-frost-02 border border-border-default rounded-card p-1.5 max-h-[120px] overflow-y-auto hide-scrollbar space-y-0.5">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-standard text-[13px] font-[var(--fw-medium)] transition-colors text-left ${
                    selectedTeamId === team.id
                      ? 'bg-surface-frost-08 text-text-primary'
                      : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'
                  }`}
                >
                  <Users size={14} />
                  <span className="truncate">{team.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-3 border-t border-border-subtle">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-[13px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors rounded-comfortable"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!email.trim() || isSending}
            className={`px-4 py-2 text-[13px] font-[var(--fw-medium)] rounded-comfortable transition-colors ${
              !email.trim() || isSending
                ? 'bg-surface-frost-05 text-text-quaternary cursor-not-allowed'
                : 'bg-white text-black hover:bg-btn-primary-hover'
            }`}
          >
            {isSending ? (
              <span className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-surface-frost-08 border-t-black rounded-full animate-spin" />
                <span>Sending...</span>
              </span>
            ) : (
              <span>Send Invitation</span>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
