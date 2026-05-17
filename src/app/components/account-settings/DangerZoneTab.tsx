import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { api } from '../../api';
import { logger } from '../../logger';
import { DeleteAccountModal } from './DeleteAccountModal';

const log = logger.create('DangerZone');

interface DangerZoneTabProps {
  email: string;
  onDeleted: () => void;
}

export function DangerZoneTab({ email, onDeleted }: DangerZoneTabProps) {
  const [blockers, setBlockers] = useState<string[]>([]);
  const [canDelete, setCanDelete] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<{ deleteAfter: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadBlockers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getDeletionBlockers();
      setBlockers(data.blockers);
      setCanDelete(data.canDelete);
      setPendingDeletion(data.pendingDeletion);
      log.debug('loadBlockers', 'Loaded deletion blockers', { blockers: data.blockers.length, canDelete: data.canDelete });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('loadBlockers', 'Failed to load blockers', { error: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlockers();
  }, [loadBlockers]);

  const handleCancelDeletion = useCallback(async () => {
    setCancelling(true);
    try {
      await api.cancelAccountDeletion();
      setPendingDeletion(null);
      log.info('cancelDeletion', 'Account deletion cancelled');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('cancelDeletion', 'Failed to cancel deletion', { error: message });
    } finally {
      setCancelling(false);
    }
  }, []);

  const handleDeleteConfirmed = useCallback(() => {
    setShowConfirm(false);
    onDeleted();
  }, [onDeleted]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-tertiary">
        <Loader2 size={ICON_SIZE.sm} className="animate-spin" />
        <span className="text-caption">Loading...</span>
      </div>
    );
  }

  const FORMAT_DATE = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-caption-lg text-text-primary mb-1">Delete Account</h3>
        <p className="text-caption text-text-tertiary">
          Permanently delete your Arvid account and all personal data. Content
          you created in workspaces (requirements, questions, answers) will be
          retained anonymously for other members.
        </p>
      </div>

      {pendingDeletion && (
        <div className="rounded-comfortable border border-status-error/30 bg-status-error/5 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={ICON_SIZE.sm} className="text-status-error shrink-0" />
            <p className="text-caption text-status-error font-[var(--fw-medium)]">
              Account scheduled for deletion
            </p>
          </div>
          <p className="text-caption text-text-tertiary">
            Your account and personal data will be permanently deleted on{' '}
            <span className="text-text-secondary">{FORMAT_DATE(pendingDeletion.deleteAfter)}</span>.
            Sign in again before that date to cancel.
          </p>
          <button
            onClick={handleCancelDeletion}
            disabled={cancelling}
            className="btn-ghost flex items-center gap-2 mt-1"
          >
            {cancelling && <Loader2 size={ICON_SIZE.sm} className="animate-spin" />}
            <span>{cancelling ? 'Cancelling...' : 'Cancel deletion'}</span>
          </button>
        </div>
      )}

      {!pendingDeletion && blockers.length > 0 && (
        <div className="rounded-comfortable border border-border-subtle bg-surface-frost-04 px-4 py-3 space-y-2">
          <p className="text-caption text-text-secondary font-[var(--fw-medium)]">
            Before you can delete your account:
          </p>
          <ul className="space-y-1">
            {blockers.map((b, i) => (
              <li key={i} className="text-caption text-text-tertiary flex items-start gap-2">
                <span className="text-text-quaternary mt-px">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!pendingDeletion && (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!canDelete}
          className="flex items-center gap-2 px-4 py-2 rounded-comfortable text-caption font-[var(--fw-medium)] transition-colors border border-status-error/30 text-status-error hover:bg-status-error/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <AlertTriangle size={ICON_SIZE.sm} />
          <span>Delete my account</span>
        </button>
      )}

      <DeleteAccountModal
        isOpen={showConfirm}
        email={email}
        onClose={() => setShowConfirm(false)}
        onDeleted={handleDeleteConfirmed}
      />
    </div>
  );
}
