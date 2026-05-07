import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BaseModal } from './BaseModal';

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
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Change ${integrationName}`} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-status-warning shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-caption-lg text-text-primary">
              This project is currently linked to <span className="text-text-primary font-[var(--fw-semibold)]">{currentValue}</span>.
            </p>
            <p className="text-caption-lg text-text-tertiary">
              Changing the {integrationName.toLowerCase()} will affect how Arvid processes context for this project. This cannot be undone automatically.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
          <button onClick={onClose} className="btn-ghost px-4 py-1.5">
            Cancel
          </button>
          <button onClick={handleConfirm} className="btn-primary px-4 py-1.5">
            Change {integrationName}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
