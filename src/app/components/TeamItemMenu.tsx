import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Pencil, Network, Settings2, Trash2, MoreHorizontal, ToggleRight } from 'lucide-react';
import { IconButton } from './IconButton';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { DropdownDivider } from './ui/DropdownDivider';
import { useStore } from '../store';

interface Props {
  teamId: string;
  onAddUser: () => void;
  onRename: () => void;
  onMove: () => void;
  onCreateProject: () => void;
  onSettings: () => void;
  onDeactivate: () => void;
}

export function TeamItemMenu({ teamId, onAddUser, onRename, onMove, onCreateProject, onSettings, onDeactivate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canDeactivate = useStore(s => s.deactivationMap.teams[teamId] ?? false);

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

  return (
    <div className="relative" ref={menuRef} data-menu-open={isOpen || undefined}>
      <IconButton onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }}>
        <MoreHorizontal size={14} />
      </IconButton>

      {isOpen && (
        <DropdownPanel position="right" anchorRef={menuRef}>
          <DropdownSection label="ACTIONS">
            <DropdownItem icon={<Plus size={16} />} label="Add user to team" onClick={() => { setIsOpen(false); onAddUser(); }} />
            <DropdownItem icon={<Pencil size={16} />} label="Rename team" onClick={() => { setIsOpen(false); onRename(); }} />
            <DropdownItem icon={<Network size={16} />} label="Move team" onClick={() => { setIsOpen(false); onMove(); }} />
            <DropdownItem icon={<Plus size={16} />} label="Create project" onClick={() => { setIsOpen(false); onCreateProject(); }} />
          </DropdownSection>

          <DropdownDivider />

          <DropdownSection label="GENERAL">
            <DropdownItem icon={<Settings2 size={16} />} label="All team settings" onClick={() => { setIsOpen(false); onSettings(); }} />
          </DropdownSection>

          {canDeactivate && (
            <>
              <DropdownDivider />
              <DropdownSection label="AVOID">
                <DropdownItem
                  icon={<Trash2 size={16} />}
                  label="Deactivate team"
                  variant="muted"
                  right={<ToggleRight size={16} className="text-status-success" />}
                  onClick={() => { setIsOpen(false); onDeactivate(); }}
                />
              </DropdownSection>
            </>
          )}
        </DropdownPanel>
      )}
    </div>
  );
}
