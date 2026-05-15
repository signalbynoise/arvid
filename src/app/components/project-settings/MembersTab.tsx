import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { Select } from '../ui/Select';
import { TextInput } from '../ui/TextInput';
import { SubmitButton } from '../ui/SubmitButton';
import type { ProjectMembership } from '../../types';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
];

interface Creator {
  userId: string;
  email: string | undefined;
}

interface MembersTabProps {
  members: ProjectMembership[];
  currentUserId: string | undefined;
  canManage: boolean;
  creator: Creator | undefined;
  onAddMember: (email: string, role: string) => Promise<string | undefined>;
  onRemoveMember: (membershipId: string) => void;
}

export function MembersTab({ members, currentUserId, canManage, creator, onAddMember, onRemoveMember }: MembersTabProps) {
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('member');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = async () => {
    const trimmed = addEmail.trim();
    if (!trimmed) {
      setAddError('Email is required.');
      return;
    }
    setIsAdding(true);
    setAddError(null);
    const error = await onAddMember(trimmed, addRole);
    setIsAdding(false);
    if (error) {
      setAddError(error);
    } else {
      setAddEmail('');
      setAddRole('member');
      setShowAddForm(false);
    }
  };

  const creatorInList = creator ? members.some(m => m.userId === creator.userId) : true;
  const totalCount = members.length + (creator && !creatorInList ? 1 : 0);

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-label-upper text-text-tertiary">
          Members ({totalCount})
        </span>
        {canManage && (
          <button
            onClick={() => setShowAddForm(prev => !prev)}
            className="flex items-center gap-1.5 text-label text-text-tertiary hover:text-text-primary transition-colors"
          >
            <Plus size={ICON_SIZE.sm} />
            <span>Add</span>
          </button>
        )}
      </div>

      {showAddForm && canManage && (
        <div className="space-y-3 p-3 rounded-card border border-border-default bg-surface-frost-02">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <TextInput
                value={addEmail}
                onChange={(v) => { setAddEmail(v); setAddError(null); }}
                placeholder="Email address"
                type="email"
                hasError={!!addError}
              />
            </div>
            <Select
              value={addRole}
              onChange={setAddRole}
              options={ROLE_OPTIONS}
            />
          </div>
          {addError && (
            <p className="text-label-sm text-status-error">{addError}</p>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowAddForm(false); setAddError(null); }} className="btn-ghost">Cancel</button>
            <SubmitButton onClick={handleAdd} label="Add member" isLoading={isAdding} />
          </div>
        </div>
      )}

      <div className="space-y-1">
        {creator && !creatorInList && (
          <div className="flex items-center justify-between p-3 rounded-card bg-surface-frost-02 border border-border-default">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-7 w-7 rounded-full bg-surface-frost-08 flex items-center justify-center shrink-0">
                <span className="text-label text-text-primary">
                  {(creator.email ?? '?')[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-caption-lg text-text-primary truncate">
                  {creator.email ?? 'Unknown'}
                </p>
              </div>
            </div>
            <span className="text-label text-text-tertiary px-2 py-1 bg-surface-frost-04 rounded-pill shrink-0">
              Owner
            </span>
          </div>
        )}

        {members.map(member => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-card bg-surface-frost-02 border border-border-default"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-7 w-7 rounded-full bg-surface-frost-08 flex items-center justify-center shrink-0">
                <span className="text-label text-text-primary">
                  {(member.email ?? '?')[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-caption-lg text-text-primary truncate">
                  {member.email ?? 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-label text-text-tertiary px-2 py-1 bg-surface-frost-04 rounded-pill">
                {member.role === 'admin' ? 'Admin' : 'Member'}
              </span>

              {canManage && member.userId !== currentUserId && (
                <button
                  onClick={() => onRemoveMember(member.id)}
                  className="p-1 text-text-quaternary hover:text-status-error transition-colors rounded-standard"
                  title="Remove member"
                >
                  <Trash2 size={ICON_SIZE.xs} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
