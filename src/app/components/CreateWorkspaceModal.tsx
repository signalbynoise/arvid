import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { generateSlug } from '../domain/workspaces';
import { BaseModal } from './BaseModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: Props) {
  const createWorkspace = useStore(s => s.createWorkspace);

  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
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
    } else {
      setError('Failed to create workspace. The name may already be taken.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Create Workspace" size="sm">
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
            Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Acme Corp"
            className={`w-full bg-surface-frost-02 border rounded-comfortable px-3 py-2.5 text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-focus focus:bg-surface-frost-04 transition-all ${
              error ? 'border-status-error-border-focus' : 'border-border-default'
            }`}
          />
          {slug && (
            <p className="text-[12px] text-text-quaternary">
              Slug: <span className="text-text-tertiary font-mono">{slug}</span>
            </p>
          )}
          {error && (
            <p className="text-[12px] text-status-error">{error}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-border-subtle">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-[13px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors rounded-comfortable"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className={`px-4 py-2 text-[13px] font-[var(--fw-medium)] rounded-comfortable transition-colors ${
              !name.trim() || isCreating
                ? 'bg-surface-frost-05 text-text-quaternary cursor-not-allowed'
                : 'bg-white text-black hover:bg-btn-primary-hover'
            }`}
          >
            {isCreating ? (
              <span className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-surface-frost-08 border-t-black rounded-full animate-spin" />
                <span>Creating...</span>
              </span>
            ) : (
              <span>Create</span>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
