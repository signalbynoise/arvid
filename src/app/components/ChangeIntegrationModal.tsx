import React, { useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { BaseModal } from './BaseModal';
import { ModalFooter } from './ui/ModalFooter';
import { SubmitButton } from './ui/SubmitButton';

interface ChangeIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  integrationName: string;
  currentValue: string;
}

export function ChangeIntegrationModal({
  isOpen,
  onClose,
  onConfirm,
  integrationName,
  currentValue,
}: ChangeIntegrationModalProps) {
  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  }, [handleConfirm]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const modalFooter = (
    <ModalFooter>
      <button onClick={onClose} className="btn-ghost">Cancel</button>
      <SubmitButton onClick={handleConfirm} label="Confirm" />
    </ModalFooter>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Change ${integrationName}`} size="sm" footer={modalFooter}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={ICON_SIZE.lg} className="text-status-warning shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-caption-lg text-text-primary">
            This project is currently linked to <span className="text-caption-lg">{currentValue}</span>.
          </p>
          <p className="text-caption-lg text-text-tertiary">
            Changing the {integrationName.toLowerCase()} will affect how Arvid processes context for this project. This cannot be undone automatically.
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
