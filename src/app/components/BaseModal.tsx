import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, selectCommandPaletteOpen } from '../store';
import { ModalHeader } from './ui/ModalHeader';

type ModalSize = 'sm' | 'md' | 'lg' | 'wide' | 'xl';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-modal-sm max-h-[85vh]',
  md: 'max-w-modal-md max-h-[85vh]',
  lg: 'max-w-modal-lg max-h-[85vh]',
  wide: 'max-w-modal-wide max-h-[85vh]',
  xl: 'w-[70vw] h-[70vh]',
};

const BACKDROP_TRANSITION = { duration: 0.2, ease: 'easeInOut' };
const PANEL_TRANSITION = { type: 'spring', stiffness: 150, damping: 25 };

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  sidebar?: React.ReactNode;
  aside?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function BaseModal({ isOpen, onClose, title, size = 'lg', sidebar, aside, footer, children }: BaseModalProps) {
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

  const isXl = size === 'xl';

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
            className={`relative ${isXl ? '' : 'w-full'} ${SIZE_CLASSES[size]} bg-surface-panel border border-border-strong rounded-panel shadow-modal overflow-hidden flex flex-col`}
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            transition={PANEL_TRANSITION}
          >
            <ModalHeader title={title} onClose={onClose} />

            {sidebar ? (
              <div className="flex-1 min-h-0 flex overflow-hidden">
                {sidebar}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
                  {footer}
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-h-0 flex overflow-hidden">
                  {aside ? (
                    <div className={`flex gap-10 flex-1 min-h-0 ${isXl ? '' : 'p-6'}`}>
                      <div className="flex-1 min-w-0">{children}</div>
                      <div className="flex-1 min-w-0 overflow-y-auto">{aside}</div>
                    </div>
                  ) : (
                    <div className={`flex-1 min-h-0 flex flex-col overflow-y-auto ${isXl ? '' : footer ? 'px-6 pt-6' : 'p-6'}`}>
                      {children}
                    </div>
                  )}
                </div>
                {footer}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
