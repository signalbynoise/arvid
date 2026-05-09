import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Pencil, Network, Settings2, Trash2, MoreHorizontal, ToggleRight } from 'lucide-react';
import { IconButton } from './IconButton';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { DropdownDivider } from './ui/DropdownDivider';
import { useStore } from '../store';

interface Props {
  projectId: string;
  onAddUser: () => void;
  onRename: () => void;
  onMove: () => void;
  onCreateSubProject?: () => void;
  onSettings: () => void;
  onDeactivate: () => void;
}

export function ProjectItemMenu({ projectId, onAddUser, onRename, onMove, onCreateSubProject, onSettings, onDeactivate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const canDeactivate = useStore(s => s.deactivationMap.projects[projectId] ?? false);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Node;
    if (menuRef.current?.contains(target)) return;
    if (panelRef.current?.contains(target)) return;
    setIsOpen(false);
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

      <DropdownPanel isOpen={isOpen} position="right" anchorRef={menuRef} panelRef={panelRef}>
        <DropdownSection label="ACTIONS">
          <DropdownItem icon={<Plus size={16} />} label="Add user to project" onClick={() => { setIsOpen(false); onAddUser(); }} />
          <DropdownItem icon={<Pencil size={16} />} label="Rename project" onClick={() => { setIsOpen(false); onRename(); }} />
          <DropdownItem icon={<Network size={16} />} label="Move project" onClick={() => { setIsOpen(false); onMove(); }} />
          {onCreateSubProject && (
            <DropdownItem icon={<Plus size={16} />} label="Create sub-project" onClick={() => { setIsOpen(false); onCreateSubProject(); }} />
          )}
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection label="GENERAL">
          <DropdownItem icon={<Settings2 size={16} />} label="All project settings" onClick={() => { setIsOpen(false); onSettings(); }} />
        </DropdownSection>

        {canDeactivate && (
          <>
            <DropdownDivider />
            <DropdownSection label="AVOID">
              <DropdownItem
                icon={<Trash2 size={16} />}
                label="Deactivate project"
                variant="muted"
                right={<ToggleRight size={16} className="text-status-success" />}
                onClick={() => { setIsOpen(false); onDeactivate(); }}
              />
            </DropdownSection>
          </>
        )}
      </DropdownPanel>
    </div>
  );
}
