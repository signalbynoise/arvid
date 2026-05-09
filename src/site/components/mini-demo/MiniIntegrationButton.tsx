import React from 'react';

interface MiniIntegrationButtonProps {
  icon: string;
  label: string;
  enabled?: boolean;
}

export function MiniIntegrationButton({ icon, label, enabled = false }: MiniIntegrationButtonProps) {
  return (
    <button className={`flex-1 py-1 px-1.5 border border-border-default rounded-micro text-[7px] font-[var(--fw-medium)] flex items-center justify-center gap-1 transition-all duration-700 ${
      enabled ? 'bg-surface-frost-08 text-text-primary' : 'bg-surface-elevated text-text-tertiary opacity-50'
    }`}>
      <img src={icon} alt="" className="w-2.5 h-2.5 opacity-60" />
      <span>{label}</span>
    </button>
  );
}

interface MiniIntegrationBarProps {
  children: React.ReactNode;
}

export function MiniIntegrationBar({ children }: MiniIntegrationBarProps) {
  return <div className="flex gap-1 pt-2">{children}</div>;
}
