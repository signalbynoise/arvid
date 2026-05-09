import React, { useState, useMemo } from 'react';
import { Check, Search } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { useStore } from '../store';
import type { CardAssignee } from '../types';

interface AddUserPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'requirement' | 'question' | 'answer';
  entityId: string;
  assignees: CardAssignee[];
  onAssign: (userId: string) => void;
  onUnassign: (assigneeId: string) => void;
}

export function AddUserPopover({
  isOpen,
  onClose,
  entityType,
  entityId,
  assignees,
  onAssign,
  onUnassign,
}: AddUserPopoverProps) {
  const members = useStore(s => s.members);
  const [filter, setFilter] = useState('');

  const assignedUserIds = useMemo(
    () => new Set(assignees.map(a => a.userId)),
    [assignees],
  );

  const filteredMembers = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return members;
    return members.filter(m => m.email?.toLowerCase().includes(q));
  }, [members, filter]);

  const handleToggle = (userId: string) => {
    if (assignedUserIds.has(userId)) {
      const assignee = assignees.find(a => a.userId === userId);
      if (assignee) onUnassign(assignee.id);
    } else {
      onAssign(userId);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Assign users" size="sm">
      <div className="space-y-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-quaternary" />
          <input
            type="text"
            placeholder="Search members..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-caption-lg bg-surface-sunken border border-border-subtle rounded-standard text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-focus"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {filteredMembers.length === 0 && (
            <p className="text-caption-lg text-text-quaternary px-3 py-2">No members found</p>
          )}
          {filteredMembers.map(member => {
            const isAssigned = assignedUserIds.has(member.userId);
            return (
              <button
                key={member.userId}
                type="button"
                onClick={() => handleToggle(member.userId)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-standard text-caption-lg text-text-primary hover:bg-surface-frost-05 transition-all"
              >
                <span className="truncate">{member.email || member.userId}</span>
                {isAssigned && <Check size={14} className="text-status-success shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </BaseModal>
  );
}
