import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore, selectCommandPaletteOpen } from '../store';

type ModalSize = 'sm' | 'md' | 'lg' | 'wide' | 'xl';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-modal-sm',
  md: 'max-w-modal-md',
  lg: 'max-w-modal-lg',
  wide: 'max-w-modal-wide',
  xl: 'max-w-modal-xl',
};

const BACKDROP_TRANSITION = { duration: 0.2, ease: 'easeInOut' };
const PANEL_TRANSITION = { type: 'spring', stiffness: 150, damping: 25 };

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  aside?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function BaseModal({ isOpen, onClose, title, size = 'lg', aside, footer, children }: BaseModalProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-overlay-scrim backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={BACKDROP_TRANSITION}
            onClick={onClose}
          />

          <motion.div
            className={`relative w-full ${SIZE_CLASSES[size]} max-h-[85vh] bg-surface-panel border border-border-subtle rounded-panel shadow-modal overflow-hidden flex flex-col`}
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            transition={PANEL_TRANSITION}
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-border-subtle shrink-0">
              <h2 className="text-caption-lg text-text-primary">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-text-quaternary hover:text-text-primary transition-colors p-1 rounded-standard hover:bg-surface-frost-05"
              >
                <X size={ICON_SIZE.md} />
              </button>
            </div>

            <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${size === 'xl' ? '' : 'p-6'}`}>
              {aside ? (
                <div className="flex gap-10 flex-1 min-h-0">
                  <div className="flex-1 min-w-0">{children}</div>
                  <div className="flex-1 min-w-0 overflow-y-auto">{aside}</div>
                </div>
              ) : (
                children
              )}
            </div>

            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 pb-6 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
