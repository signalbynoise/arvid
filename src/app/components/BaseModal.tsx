import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useStore, selectCommandPaletteOpen } from '../store';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[520px]',
  xl: 'max-w-4xl',
};

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  children: React.ReactNode;
}

export function BaseModal({ isOpen, onClose, title, size = 'lg', children }: BaseModalProps) {
  const commandPaletteOpen = useStore(selectCommandPaletteOpen);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !commandPaletteOpen) onClose();
  }, [onClose, commandPaletteOpen]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-overlay-scrim backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative w-full ${SIZE_CLASSES[size]} bg-surface-panel border border-border-subtle rounded-panel shadow-modal overflow-hidden flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h2 className="text-[14px] font-[var(--fw-medium)] text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-quaternary hover:text-text-primary transition-colors p-1 rounded-standard hover:bg-surface-frost-05"
          >
            <X size={16} />
          </button>
        </div>

        <div className={size === 'xl' ? '' : 'p-5'}>
          {children}
        </div>
      </div>
    </div>
  );
}
