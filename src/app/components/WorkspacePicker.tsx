import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Plus, Settings } from 'lucide-react';
import { useStore, selectWorkspaces, selectActiveWorkspaceId } from '../store';
import { IconButton } from './IconButton';

interface WorkspacePickerProps {
  onSettingsClick: () => void;
  onCreateClick: () => void;
}

export function WorkspacePicker({ onSettingsClick, onCreateClick }: WorkspacePickerProps) {
  const workspaces = useStore(selectWorkspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const setActiveWorkspace = useStore(s => s.setActiveWorkspace);

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  const handleSelect = (id: string) => {
    setActiveWorkspace(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-comfortable text-text-primary hover:bg-surface-frost-04 transition-colors min-w-0 flex-1"
        >
          <span className="text-[13px] font-[var(--fw-medium)] truncate">
            {activeWorkspace?.name ?? 'No workspace'}
          </span>
          <ChevronDown size={12} className="text-text-quaternary shrink-0" />
        </button>

        {activeWorkspace && (
          <IconButton onClick={onSettingsClick} title="Workspace settings">
            <Settings size={14} />
          </IconButton>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-surface-elevated border border-border-default rounded-panel shadow-modal z-50 overflow-hidden">
          <div className="p-1.5 max-h-[200px] overflow-y-auto hide-scrollbar">
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => handleSelect(ws.id)}
                className={`w-full flex items-center px-2.5 py-2 rounded-standard text-[13px] font-[var(--fw-medium)] transition-colors text-left ${
                  ws.id === activeWorkspaceId
                    ? 'bg-surface-frost-08 text-text-primary'
                    : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'
                }`}
              >
                <span className="truncate">{ws.name}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-border-subtle p-1.5">
            <button
              onClick={() => { setIsOpen(false); onCreateClick(); }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-standard text-[13px] font-[var(--fw-medium)] text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary transition-colors"
            >
              <Plus size={14} />
              <span>Create workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
