import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Folder } from 'lucide-react';
import { useStore, selectActiveWorkspaceId, selectTeams, selectProjects } from '../store';
import { api } from '../api';
import { getScopeLabel } from '../domain/access';
import { BaseModal } from './BaseModal';
import { DropdownPanel } from './ui/DropdownPanel';
import type { AccessScope } from '../domain/access';

interface UserSuggestion {
  id: string;
  email: string;
}

const SCOPES: AccessScope[] = ['workspace', 'team', 'project'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteMemberModal({ isOpen, onClose }: Props) {
  const sendInvitation = useStore(s => s.sendInvitation);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const teams = useStore(selectTeams);
  const projects = useStore(selectProjects);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [scope, setScope] = useState<AccessScope>('workspace');
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchAbortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (teams.length > 0 && !selectedTeamId) setSelectedTeamId(teams[0].id);
      if (projects.length > 0 && !selectedProjectId) setSelectedProjectId(projects[0].id);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, teams, projects, selectedTeamId, selectedProjectId]);

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
    if (!trimmed || !activeWorkspaceId) return;
    setError(null);
    setIsSending(true);

    const result = await sendInvitation(activeWorkspaceId, {
      email: trimmed,
      role,
      scope,
      teamId: (scope === 'team' || scope === 'workspace') ? selectedTeamId : undefined,
      projectId: scope === 'project' ? selectedProjectId : undefined,
    });

    setIsSending(false);
    if (result) { handleClose(); } else { setError('Failed to send invitation. The email may already be invited.'); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    setEmail(''); setRole('member'); setScope('workspace');
    setSelectedTeamId(teams.length > 0 ? teams[0].id : undefined);
    setSelectedProjectId(projects.length > 0 ? projects[0].id : undefined);
    setError(null); setIsSending(false); setSuggestions([]); setShowSuggestions(false);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Invite Member" size="sm">
      <div className="space-y-5">
        <div className="space-y-2 relative">
          <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Email</label>
          <input
            ref={inputRef} type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="colleague@company.com" autoComplete="off"
            className={`w-full bg-surface-frost-02 border rounded-comfortable px-3 py-2.5 text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-focus focus:bg-surface-frost-04 transition-all ${error ? 'border-status-error-border-focus' : 'border-border-default'}`}
          />
          {showSuggestions && suggestions.length > 0 && (
            <DropdownPanel position="below">
              {suggestions.map((s, i) => (
                <button key={s.id} onClick={() => selectSuggestion(s)}
                  className={`w-full px-3 py-2 text-left text-caption-lg transition-colors ${i === activeSuggestionIndex ? 'bg-surface-frost-08 text-text-primary' : 'text-text-tertiary hover:text-text-primary'}`}
                >{s.email}</button>
              ))}
            </DropdownPanel>
          )}
          {error && <p className="text-[12px] text-status-error">{error}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Access Level</label>
          <div className="flex gap-2">
            {SCOPES.map(s => (
              <button key={s} onClick={() => setScope(s)}
                className={`flex-1 px-3 py-2 rounded-comfortable text-[13px] font-[var(--fw-medium)] border transition-colors ${scope === s ? 'bg-surface-frost-08 border-border-focus text-text-primary' : 'bg-surface-frost-02 border-border-default text-text-tertiary hover:bg-surface-frost-04'}`}
              >{getScopeLabel(s)}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Role</label>
          <div className="flex gap-2">
            {(['member', 'admin'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 px-3 py-2 rounded-comfortable text-[13px] font-[var(--fw-medium)] border transition-colors ${role === r ? 'bg-surface-frost-08 border-border-focus text-text-primary' : 'bg-surface-frost-02 border-border-default text-text-tertiary hover:bg-surface-frost-04'}`}
              >{r === 'member' ? 'Member' : 'Admin'}</button>
            ))}
          </div>
        </div>

        {(scope === 'team' || scope === 'workspace') && teams.length > 0 && (
          <div className="space-y-2">
            <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Team</label>
            <div className="bg-surface-frost-02 border border-border-default rounded-card p-1.5 max-h-[120px] overflow-y-auto hide-scrollbar space-y-0.5">
              {teams.map(team => (
                <button key={team.id} onClick={() => setSelectedTeamId(team.id)}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-standard text-[13px] font-[var(--fw-medium)] transition-colors text-left ${selectedTeamId === team.id ? 'bg-surface-frost-08 text-text-primary' : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'}`}
                ><Users size={14} /><span className="truncate">{team.name}</span></button>
              ))}
            </div>
          </div>
        )}

        {scope === 'project' && projects.length > 0 && (
          <div className="space-y-2">
            <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Project</label>
            <div className="bg-surface-frost-02 border border-border-default rounded-card p-1.5 max-h-[120px] overflow-y-auto hide-scrollbar space-y-0.5">
              {projects.map(p => (
                <button key={p.id} onClick={() => setSelectedProjectId(p.id)}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-standard text-[13px] font-[var(--fw-medium)] transition-colors text-left ${selectedProjectId === p.id ? 'bg-surface-frost-08 text-text-primary' : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'}`}
                ><Folder size={14} /><span className="truncate">{p.name}</span></button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-3 border-t border-border-subtle">
          <button onClick={handleClose} className="btn-ghost px-4 py-1.5">Cancel</button>
          <button onClick={handleSend} disabled={!email.trim() || isSending} className="btn-primary px-4 py-1.5">
            {isSending ? (
              <span className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-surface-frost-08 border-t-black rounded-full animate-spin" />
                <span>Sending...</span>
              </span>
            ) : <span>Send Invitation</span>}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
