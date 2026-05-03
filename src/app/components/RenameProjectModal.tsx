import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ProjectNameSchema } from '../../../shared/schemas';
import { BaseModal } from './BaseModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentName: string;
}

export function RenameProjectModal({ isOpen, onClose, projectId, currentName }: Props) {
  const updateProject = useStore(s => s.updateProject);

  const [name, setName] = useState(currentName);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setValidationError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentName]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed === currentName) {
      onClose();
      return;
    }

    const result = ProjectNameSchema.safeParse({ name: trimmed });
    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }

    setValidationError(null);
    setIsSaving(true);
    await updateProject(projectId, result.data.name);
    setIsSaving(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Rename Project" size="sm">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[12px] font-[510] text-[#8a8f98] uppercase tracking-widest">
            Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setValidationError(null); }}
            onKeyDown={handleKeyDown}
            className={`w-full bg-[rgba(255,255,255,0.02)] border rounded-[6px] px-3 py-2.5 text-[14px] text-[#f7f8f8] placeholder:text-[#62666d] focus:outline-none focus:border-[rgba(255,255,255,0.2)] focus:bg-[rgba(255,255,255,0.04)] transition-all ${
              validationError ? 'border-[rgba(239,68,68,0.5)]' : 'border-[rgba(255,255,255,0.08)]'
            }`}
          />
          {validationError && (
            <p className="text-[12px] text-[#ef4444]">{validationError}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-[510] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors rounded-[6px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className={`px-4 py-2 text-[13px] font-[510] rounded-[6px] transition-colors ${
              !name.trim() || isSaving
                ? 'bg-[rgba(255,255,255,0.05)] text-[#62666d] cursor-not-allowed'
                : 'bg-white text-black hover:bg-[#e0e0e0]'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
