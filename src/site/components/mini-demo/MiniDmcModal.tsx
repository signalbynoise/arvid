import React from 'react';
import { X } from 'lucide-react';

interface MiniDmcModalProps {
  visible: boolean;
  title: string;
  titleIcon?: React.ReactNode;
  subtitle?: string;
  cursorTarget?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function MiniDmcModal({ visible, title, titleIcon, subtitle, cursorTarget, footer, children }: MiniDmcModalProps) {
  return (
    <div
      data-cursor-target={cursorTarget}
      className={`w-full rounded-panel border border-border-subtle bg-surface-elevated overflow-hidden transition-all duration-500 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          {titleIcon}
          <span className="text-caption-lg text-text-primary">{title}</span>
        </div>
        <X size={16} className="text-text-quaternary" />
      </div>

      <div className="h-px bg-border-subtle" />

      {subtitle && (
        <div className="px-6 pt-4">
          <span className="text-caption text-text-tertiary">{subtitle}</span>
        </div>
      )}

      <div className="px-6 py-5 space-y-6">
        {children}
      </div>

      {footer && (
        <div className="flex items-center justify-end gap-3 px-6 pt-5 pb-5">
          {footer}
        </div>
      )}
    </div>
  );
}
