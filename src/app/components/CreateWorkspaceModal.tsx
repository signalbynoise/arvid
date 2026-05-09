import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { generateSlug } from '../domain/workspaces';
import { buildWorkspacePath } from '../domain/paths';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const createWorkspace = useStore(s => s.createWorkspace);

  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const slug = name.trim() ? generateSlug(name) : '';

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setError(null);
    setIsCreating(true);

    const result = await createWorkspace(trimmed);
    setIsCreating(false);

    if (result) {
      handleClose();
      navigate(buildWorkspacePath(result.slug));
    } else {
      setError('Failed to create workspace. The name may already be taken.');
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

  const hint = slug
    ? <>Slug: <span className="font-mono text-text-tertiary">{slug}</span></>
    : undefined;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Create Workspace" size="sm">
      <div className="flex flex-col gap-6">
        <FormField label="Name" error={error} hint={hint}>
          <TextInput
            value={name}
            onChange={(v) => { setName(v); setError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Acme Corp"
            inputRef={inputRef}
            hasError={!!error}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <button onClick={handleCreate} disabled={!name.trim() || isCreating} className="btn-primary">
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
