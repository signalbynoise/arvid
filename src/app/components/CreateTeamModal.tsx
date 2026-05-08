import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

export function CreateTeamModal({ isOpen, onClose, workspaceId, workspaceName }: Props) {
  const createTeam = useStore(s => s.createTeam);

  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || !workspaceId) return;

    setError(null);
    setIsCreating(true);

    const result = await createTeam(trimmed, workspaceId);
    setIsCreating(false);

    if (result) {
      handleClose();
    } else {
      setError('Failed to create team. The name may already be taken.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && name.trim()) {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleClose = () => {
    onClose();
    setName('');
    setError(null);
    setIsCreating(false);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Create new team" size="sm">
      <div className="flex flex-col gap-6">
        <FormField
          label="Team Name"
          error={error}
          hint={<>Team will be added to workspace <span className="text-text-primary">{workspaceName}</span></>}
        >
          <TextInput
            value={name}
            onChange={(v) => { setName(v); setError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Team name"
            inputRef={inputRef}
            hasError={!!error}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <button onClick={handleCreate} disabled={!name.trim() || isCreating} className="btn-primary">
            {isCreating ? 'Creating...' : 'Create new team'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
