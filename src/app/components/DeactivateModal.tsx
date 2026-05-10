import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useDeleteEntity } from '../machines/mutations/useDeleteEntity';
import type { DeleteEntityType } from '../machines/mutations/deleteEntity.machine';
import { BaseModal } from './BaseModal';

interface DeactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  entityType: DeleteEntityType;
  entityName: string;
  entityId?: string;
}

export function DeactivateModal({ isOpen, onClose, onConfirm, entityType, entityName, entityId = '' }: DeactivateModalProps) {
  const { error, isSubmitting, confirm } = useDeleteEntity({
    entityType,
    entityId,
    entityName,
    deleteEntity: onConfirm,
    onClose,
  });

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Deactivate ${entityType}`} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={ICON_SIZE.lg} className="text-status-warning shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-caption-lg text-text-primary">
              Are you sure you want to deactivate <span className="font-[var(--fw-semibold)]">{entityName}</span>?
            </p>
            <p className="text-caption-lg text-text-tertiary">
              This will archive the {entityType} and all its contents. Nothing is permanently deleted — you can restore it from the archive.
            </p>
            {error && (
              <p className="text-caption-lg text-status-error">{error}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={confirm} disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
