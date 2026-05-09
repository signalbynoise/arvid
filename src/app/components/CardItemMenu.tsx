import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Pencil, Settings2, Trash2, ToggleRight, MoreHorizontal } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { IconButton } from './IconButton';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { DropdownDivider } from './ui/DropdownDivider';

interface CardItemMenuProps {
  onAddUser: () => void;
  onEdit: () => void;
  onViewDetails: () => void;
  onDeactivate: () => void;
}

export function CardItemMenu({ onAddUser, onEdit, onViewDetails, onDeactivate }: CardItemMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
        <MoreHorizontal size={ICON_SIZE.sm} />
      </IconButton>

      <DropdownPanel isOpen={isOpen} position="right" anchorRef={menuRef} panelRef={panelRef}>
        <DropdownSection label="ACTIONS">
          <DropdownItem icon={<Plus size={ICON_SIZE.md} />} label="Add user" onClick={() => { setIsOpen(false); onAddUser(); }} />
          <DropdownItem icon={<Pencil size={ICON_SIZE.md} />} label="Edit content" onClick={() => { setIsOpen(false); onEdit(); }} />
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection label="GENERAL">
          <DropdownItem icon={<Settings2 size={ICON_SIZE.md} />} label="View details" onClick={() => { setIsOpen(false); onViewDetails(); }} />
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection label="AVOID">
          <DropdownItem
            icon={<Trash2 size={ICON_SIZE.md} />}
            label="Deactivate"
            variant="muted"
            right={<ToggleRight size={ICON_SIZE.md} className="text-status-success" />}
            onClick={() => { setIsOpen(false); onDeactivate(); }}
          />
        </DropdownSection>
      </DropdownPanel>
    </div>
  );
}
