import React from 'react';

interface MiniModalProps {
  visible: boolean;
  title: string;
  children: React.ReactNode;
}

export function MiniModal({ visible, title, children }: MiniModalProps) {
  return (
    <div className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-overlay-scrim" />
      <div className="relative bg-surface-panel border border-border-default rounded-card shadow-modal p-3 w-[260px] max-h-[220px] overflow-hidden">
        <div className="text-[9px] font-[var(--fw-medium)] text-text-primary mb-2">{title}</div>
        {children}
      </div>
    </div>
  );
}
