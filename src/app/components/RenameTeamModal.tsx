import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  currentName: string;
}

export function RenameTeamModal({ isOpen, onClose, teamId, currentName }: Props) {
  const updateTeam = useStore(s => s.updateTeam);

  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentName]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Team name is required');
      return;
    }
    if (trimmed === currentName) {
      onClose();
      return;
    }

    setError(null);
    setIsSaving(true);
    await updateTeam(teamId, trimmed);
    setIsSaving(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Rename Team" size="sm">
      <div className="flex flex-col gap-6">
        <FormField label="Team Name" error={error}>
          <TextInput
            value={name}
            onChange={(v) => { setName(v); setError(null); }}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
            hasError={!!error}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || isSaving} className="btn-primary">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
