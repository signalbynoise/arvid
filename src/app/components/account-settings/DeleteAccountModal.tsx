import { useState, useCallback } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { BaseModal } from '../BaseModal';
import { ModalFooter } from '../ui/ModalFooter';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { api } from '../../api';
import { logger } from '../../logger';

const log = logger.create('DeleteAccount');

interface DeleteAccountModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteAccountModal({ isOpen, email, onClose, onDeleted }: DeleteAccountModalProps) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isMatch = confirmEmail.toLowerCase() === email.toLowerCase();

  const handleDelete = useCallback(async () => {
    if (!isMatch) {
      setError('Email does not match.');
      return;
    }

    setIsDeleting(true);
    setError(null);
    log.info('deleteAccount', 'Submitting account deletion');

    try {
      await api.deleteAccount(confirmEmail);
      log.info('deleteAccount', 'Account deletion scheduled');
      onDeleted();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      log.error('deleteAccount', 'Deletion failed', { error: message });
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }, [confirmEmail, isMatch, onDeleted]);

  const handleClose = () => {
    setConfirmEmail('');
    setError(null);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Account"
      size="sm"
      footer={
        <ModalFooter>
          <button type="button" className="btn-ghost" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isMatch || isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-comfortable text-caption font-[var(--fw-medium)] transition-colors bg-status-error text-white hover:bg-status-error/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <Loader2 size={ICON_SIZE.sm} className="animate-spin" />
            ) : (
              <AlertTriangle size={ICON_SIZE.sm} />
            )}
            <span>{isDeleting ? 'Deleting...' : 'Delete permanently'}</span>
          </button>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        <div className="rounded-comfortable border border-status-error/30 bg-status-error/5 px-4 py-3">
          <p className="text-caption text-text-secondary">
            This action is irreversible after the 7-day grace period. Your
            personal data, memberships, and integrations will be permanently
            removed. Content you created in workspaces will be retained
            anonymously.
          </p>
        </div>

        <FormField label={`Type ${email} to confirm`} error={error}>
          <TextInput
            type="email"
            autoComplete="off"
            placeholder={email}
            value={confirmEmail}
            onChange={(v) => { setConfirmEmail(v); setError(null); }}
            disabled={isDeleting}
            hasError={!!error}
          />
        </FormField>
      </div>
    </BaseModal>
  );
}
