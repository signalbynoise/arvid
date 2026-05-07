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
      <div className="flex items-center gap-2 overflow-hidden">
        {chevron ? (
          <button
            onClick={chevron.onToggle}
            className="p-0.5 rounded-standard hover:bg-surface-frost-10 transition-colors"
          >
            <Chevron open={chevron.open} size={12} />
          </button>
        ) : (
          <span className="w-[16px] shrink-0" />
        )}
        {icon}
        <span className="truncate">{label}</span>
      </div>

      {actions && (
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {actions}
        </div>
      )}
    </div>
  );
}
