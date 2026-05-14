import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';

interface Assignee {
  id: string;
  userId: string;
}

interface Member {
  userId: string;
  email?: string | null;
}

interface UsersTabProps {
  authorName: string | undefined;
  authorUserId: string | undefined;
  assignees: Assignee[];
  members: Member[];
  onToggleAssign: (userId: string) => void;
  onUnassign: (assigneeId: string) => void;
}

interface UserEntry {
  userId: string;
  label: string;
  role: 'author' | 'assigned';
  assigneeId?: string;
}

export function UsersTab({
  authorName,
  authorUserId,
  assignees,
  members,
  onToggleAssign,
  onUnassign,
}: UsersTabProps) {
  const [search, setSearch] = useState('');

  const assignedUserIds = useMemo(
    () => new Set(assignees.map(a => a.userId)),
    [assignees],
  );

  const users = useMemo<UserEntry[]>(() => {
    const entries: UserEntry[] = [];
    const seen = new Set<string>();

    if (authorUserId) {
      const member = members.find(m => m.userId === authorUserId);
      entries.push({
        userId: authorUserId,
        label: authorName || member?.email || 'Unknown',
        role: 'author',
      });
      seen.add(authorUserId);
    }

    for (const a of assignees) {
      if (seen.has(a.userId)) continue;
      seen.add(a.userId);
      const member = members.find(m => m.userId === a.userId);
      entries.push({
        userId: a.userId,
        label: member?.email || a.userId,
        role: 'assigned',
        assigneeId: a.id,
      });
    }

    return entries;
  }, [authorUserId, authorName, assignees, members]);

  const searchResults = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return [];

    const involvedIds = new Set(users.map(u => u.userId));
    return members.filter(
      m =>
        !involvedIds.has(m.userId) &&
        (m.email?.toLowerCase().includes(trimmed)),
    );
  }, [search, members, users]);

  const handleAdd = (userId: string) => {
    onToggleAssign(userId);
    setSearch('');
  };

  return (
    <div className="p-5 space-y-6">
      <FormField label="Add Users">
        <div className="relative">
          <TextInput
            value={search}
            onChange={setSearch}
            placeholder="Search username or email"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 rounded-card border border-border-default bg-surface-panel shadow-lg overflow-hidden">
              {searchResults.map(m => (
                <button
                  key={m.userId}
                  type="button"
                  onClick={() => handleAdd(m.userId)}
                  className="w-full text-left px-3 py-2 text-caption-lg text-text-primary hover:bg-surface-frost-04 transition-colors"
                >
                  {m.email ?? 'Unknown'}
                </button>
              ))}
            </div>
          )}
          {search.trim() && searchResults.length === 0 && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 rounded-card border border-border-default bg-surface-panel shadow-lg px-3 py-2">
              <p className="text-caption-lg text-text-empty">No members found.</p>
            </div>
          )}
        </div>
      </FormField>

      <div className="space-y-2">
        {users.map(u => (
          <div
            key={u.userId}
            className="flex items-center justify-between h-10 px-3 rounded-standard bg-surface-frost-02"
          >
            <span className="text-caption-lg text-text-primary truncate">
              {u.label}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-label text-text-quaternary">
                {u.role === 'author' ? 'Author' : 'Assigned'}
              </span>
              {u.role === 'assigned' && u.assigneeId && (
                <button
                  onClick={() => onUnassign(u.assigneeId!)}
                  className="p-1 text-text-quaternary hover:text-status-error transition-colors rounded-standard"
                  title="Remove"
                >
                  <X size={ICON_SIZE.xs} />
                </button>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-caption-lg text-text-empty text-center py-6">
            No users involved yet.
          </p>
        )}
      </div>
    </div>
  );
}
