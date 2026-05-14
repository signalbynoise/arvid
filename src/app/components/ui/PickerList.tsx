import React from 'react';

interface PickerListProps {
  children: React.ReactNode;
}

export function PickerList({ children }: PickerListProps) {
  return (
    <div className="max-h-[320px] overflow-y-auto hide-scrollbar space-y-0.5">
      {children}
    </div>
  );
}

interface PickerSectionProps {
  label: string;
  children: React.ReactNode;
}

export function PickerSection({ label, children }: PickerSectionProps) {
  return (
    <div>
      <p className="text-label-upper text-text-empty px-3 mb-1">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

interface PickerItemProps {
  icon?: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export function PickerItem({ icon, label, right, onClick, disabled }: PickerItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-between w-full px-3 py-2.5 rounded-comfortable text-left transition-colors hover:bg-surface-frost-04 disabled:opacity-50"
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && <span className="shrink-0 text-text-quaternary">{icon}</span>}
        <span className="text-caption-lg text-text-secondary truncate">{label}</span>
      </div>
      {right && <span className="shrink-0 ml-2">{right}</span>}
    </button>
  );
}
