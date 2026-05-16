import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, Presentation, GitFork, Mail, Copy } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { IconButton } from '../IconButton';
import { DropdownPanel } from '../ui/DropdownPanel';
import { DropdownSection } from '../ui/DropdownSection';
import { DropdownItem } from '../ui/DropdownItem';
import { DropdownDivider } from '../ui/DropdownDivider';

interface SummaryMenuProps {
  onSendToLinear: () => void;
  onSendToCursor: () => void;
  onDashboard: () => void;
  onGraph: () => void;
  onEmailRequirementLink: () => void;
  onCopyRequirementLink: () => void;
  linearDisabled?: boolean;
  cursorDisabled?: boolean;
  linearLabel?: string;
}

export function SummaryMenu({
  onSendToLinear,
  onSendToCursor,
  onDashboard,
  onGraph,
  onEmailRequirementLink,
  onCopyRequirementLink,
  linearDisabled = false,
  cursorDisabled = false,
  linearLabel = 'Send to Linear',
}: SummaryMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Node;
    if (menuRef.current?.contains(target)) return;
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  return (
    <div className="relative" ref={menuRef}>
      <IconButton onClick={() => setIsOpen(prev => !prev)} title="Summary menu">
        <Menu size={ICON_SIZE.sm} />
      </IconButton>

      <DropdownPanel isOpen={isOpen} position="below" align="end">
        <DropdownSection label="ANALYSIS">
          <DropdownItem
            icon={<Presentation size={ICON_SIZE.md} />}
            label="Dashboard"
            onClick={() => { setIsOpen(false); onDashboard(); }}
          />
          <DropdownItem
            icon={<GitFork size={ICON_SIZE.md} className="rotate-90" />}
            label="Graph"
            onClick={() => { setIsOpen(false); onGraph(); }}
          />
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection label="ACTIONS">
          <DropdownItem
            icon={<img src="/linear.svg" alt="" className="w-4 h-4 opacity-60" />}
            label={linearLabel}
            disabled={linearDisabled}
            onClick={() => { setIsOpen(false); onSendToLinear(); }}
          />
          <DropdownItem
            icon={<img src="/cursor.svg" alt="" className="w-4 h-4 opacity-60" />}
            label="Send to Cursor"
            disabled={cursorDisabled}
            onClick={() => { setIsOpen(false); onSendToCursor(); }}
          />
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection label="SHARE">
          <DropdownItem
            icon={<Mail size={ICON_SIZE.md} />}
            label="Email requirement link"
            onClick={() => { setIsOpen(false); onEmailRequirementLink(); }}
          />
          <DropdownItem
            icon={<Copy size={ICON_SIZE.md} />}
            label="Copy requirement link"
            onClick={() => { setIsOpen(false); onCopyRequirementLink(); }}
          />
        </DropdownSection>
      </DropdownPanel>
    </div>
  );
}
