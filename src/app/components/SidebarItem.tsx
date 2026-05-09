import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Chevron } from './Chevron';
import { IconButton } from './IconButton';

interface SidebarItemProps {
  itemId?: string;
  label: string;
  icon: React.ReactNode;
  isSelected?: boolean;
  hoverable?: boolean;
  indent?: number;
  chevron?: { open: boolean; onToggle: (e: React.MouseEvent) => void };
  actions?: React.ReactNode;
  onClick?: () => void;
}

export function SidebarItem({
  itemId: _itemId,
  label,
  icon,
  isSelected = false,
  hoverable = true,
  indent = 0,
  chevron,
  actions,
  onClick,
}: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center justify-between py-1 px-4 cursor-pointer text-caption-lg ${
        isSelected
          ? 'text-text-primary'
          : 'text-text-tertiary hover:text-text-secondary'
      }`}
      style={{ paddingLeft: `${16 + indent}px` }}
    >
      <AnimatePresence>
        {isSelected && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-2 inset-y-0 rounded-standard bg-surface-frost-05"
          />
        )}
      </AnimatePresence>

      {hoverable && (
        <span className="absolute inset-x-2 inset-y-0 rounded-standard bg-surface-frost-05 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      )}

      <div className="relative flex items-center gap-1 overflow-hidden">
        {icon}
        <span className="truncate">{label}</span>
        {chevron && (
          <IconButton
            onClick={chevron.onToggle}
            className="opacity-0 group-hover:opacity-100"
          >
            <Chevron open={chevron.open} size={14} />
          </IconButton>
        )}
      </div>

      {actions && (
        <div className="relative flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 has-[[data-menu-open]]:opacity-100 transition-opacity">
          {actions}
        </div>
      )}
    </div>
  );
}
