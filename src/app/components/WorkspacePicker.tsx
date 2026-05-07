import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Plus, Settings, Check, LoaderPinwheel } from 'lucide-react';
import { useStore, selectWorkspaces, selectActiveWorkspaceId } from '../store';

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
    <div className="relative flex-1 min-w-0" ref={menuRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="group flex items-center gap-2 w-full transition-colors"
      >
        {activeWorkspace?.logoUrl ? (
          <img
            src={activeWorkspace.logoUrl}
            alt=""
            className="w-3.5 h-3.5 rounded-micro object-cover shrink-0"
          />
        ) : (
          <LoaderPinwheel size={14} className="text-text-primary shrink-0" />
        )}
        <span className="text-caption-lg text-text-primary truncate">
          {activeWorkspace?.name ?? 'No workspace'}
        </span>
        <ChevronDown size={14} className="text-text-quaternary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {isOpen && (
        <div className="absolute left-2 right-2 top-full mt-1 bg-surface-elevated border border-border-default rounded-panel shadow-modal z-50 overflow-hidden">
          <div className="p-1.5 max-h-[200px] overflow-y-auto hide-scrollbar">
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => handleSelect(ws.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-standard text-caption-lg transition-colors text-left ${
                  ws.id === activeWorkspaceId
                    ? 'bg-surface-frost-08 text-text-primary'
                    : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'
                }`}
              >
                <span className="truncate">{ws.name}</span>
                {ws.id === activeWorkspaceId && <Check size={14} className="text-text-primary shrink-0" />}
              </button>
            ))}
          </div>

          <div className="border-t border-border-subtle p-1.5 space-y-0.5">
            <button
              onClick={() => { setIsOpen(false); onSettingsClick(); }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-standard text-caption-lg text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary transition-colors"
            >
              <Settings size={14} />
              <span>Workspace settings</span>
            </button>
            <button
              onClick={() => { setIsOpen(false); onCreateClick(); }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-standard text-caption-lg text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary transition-colors"
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
