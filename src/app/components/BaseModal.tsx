import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[520px]',
};

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  children: React.ReactNode;
}

export function BaseModal({ isOpen, onClose, title, size = 'lg', children }: BaseModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

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
        className="absolute inset-0 bg-[rgba(0,0,0,0.85)] backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative w-full ${SIZE_CLASSES[size]} bg-[#0f1011] border border-[rgba(255,255,255,0.1)] rounded-[12px] shadow-[0_24px_40px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.05)]">
          <h2 className="text-[14px] font-[510] text-[#f7f8f8]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#62666d] hover:text-[#f7f8f8] transition-colors p-1 rounded-[4px] hover:bg-[rgba(255,255,255,0.05)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
