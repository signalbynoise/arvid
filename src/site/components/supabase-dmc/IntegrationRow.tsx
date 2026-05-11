import React from 'react';
import { ChevronDown } from 'lucide-react';

interface IntegrationRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  cursorTarget?: string;
}

export function IntegrationRow({ icon, label, value, cursorTarget }: IntegrationRowProps) {
  return (
    <div className="flex flex-col gap-2 px-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-label text-text-tertiary">{label}</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-status-success" />
      </div>
      <div
        data-cursor-target={cursorTarget}
        className="flex items-center justify-between p-3 rounded-comfortable border border-border-default bg-surface-panel"
      >
        <span className="text-caption font-[var(--fw-medium)] text-text-primary">{value}</span>
        <ChevronDown size={16} className="text-text-quaternary" />
      </div>
    </div>
  );
}
