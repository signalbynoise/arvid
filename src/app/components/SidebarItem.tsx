import React from 'react';
import { Chevron } from './Chevron';

interface SidebarItemProps {
  label: string;
  icon: React.ReactNode;
  isSelected?: boolean;
  indent?: number;
  chevron?: { open: boolean; onToggle: (e: React.MouseEvent) => void };
  actions?: React.ReactNode;
  onClick?: () => void;
}

export function SidebarItem({
  label,
  icon,
  isSelected = false,
  indent = 0,
  chevron,
  actions,
  onClick,
}: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center justify-between py-1 px-4 cursor-pointer text-caption-lg transition-colors ${
        isSelected
          ? 'text-text-primary'
          : 'text-text-tertiary hover:text-text-secondary'
      }`}
      style={{ paddingLeft: `${16 + indent}px` }}
    >
      <div className="flex items-center gap-1 overflow-hidden">
        {icon}
        <span className="truncate">{label}</span>
        {chevron && (
          <button
            onClick={chevron.onToggle}
            className="shrink-0 p-0.5 rounded-standard hover:bg-surface-frost-10 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Chevron open={chevron.open} size={14} />
          </button>
        )}
      </div>

      {actions && (
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 has-[[data-menu-open]]:opacity-100 transition-opacity">
          {actions}
        </div>
      )}
    </div>
  );
}
