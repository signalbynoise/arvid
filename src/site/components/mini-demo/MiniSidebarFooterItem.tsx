import React from 'react';
import { ChevronDown } from 'lucide-react';

interface MiniSidebarFooterItemProps {
  icon: string;
  label: string;
  isConnected: boolean;
  value?: string;
  placeholder?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

export function MiniSidebarFooterItem({ icon, label, isConnected, value, placeholder, loading, children }: MiniSidebarFooterItemProps) {
  return (
    <div className="px-3 space-y-1 pt-1">
      <div className="flex items-center gap-1">
        <img src={icon} alt="" className="w-2 h-2 opacity-40" />
        <span className="text-[6px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-wide">{label}</span>
        {isConnected && (
          <span className="w-1 h-1 rounded-full bg-status-success shrink-0" />
        )}
        {loading && (
          <span className="w-1.5 h-1.5 rounded-full border border-text-quaternary border-t-transparent animate-spin shrink-0 ml-auto" />
        )}
      </div>
      {children ?? (
        <div className="flex items-center justify-between w-full px-1.5 py-1 bg-surface-panel border border-border-default rounded-[1px]">
          <span className={`text-[6px] font-[var(--fw-medium)] truncate ${value ? 'text-text-primary' : 'text-text-tertiary'}`}>
            {value ?? placeholder ?? `Select ${label.toLowerCase()}`}
          </span>
          <ChevronDown size={6} className="text-text-quaternary shrink-0 ml-1" />
        </div>
      )}
    </div>
  );
}
