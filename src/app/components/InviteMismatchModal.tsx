import React from 'react';
import { BaseModal } from './BaseModal';
import { ModalFooter } from './ui/ModalFooter';

interface InviteMismatchModalProps {
  isOpen: boolean;
  inviteEmail: string;
  currentEmail: string;
  onSignOut: () => void;
  onDismiss: () => void;
}

export function InviteMismatchModal({
  isOpen,
  inviteEmail,
  currentEmail,
  onSignOut,
  onDismiss,
}: InviteMismatchModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onDismiss}
      title="Invitation email mismatch"
      size="sm"
      footer={
        <ModalFooter>
          <button type="button" className="btn-ghost" onClick={onDismiss}>
            Continue anyway
          </button>
          <button type="button" className="btn-primary" onClick={onSignOut}>
            Sign out &amp; switch
          </button>
        </ModalFooter>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-body text-text-secondary">
          The invitation was sent to{' '}
          <span className="text-text-primary font-[var(--fw-medium)]">{inviteEmail}</span>
          , but you signed in as{' '}
          <span className="text-text-primary font-[var(--fw-medium)]">{currentEmail}</span>.
        </p>
        <p className="text-body text-text-tertiary">
          To accept the invitation, sign out and sign in with the invited email.
          Alternatively, ask the person who invited you to resend the
          invitation to <span className="text-text-secondary">{currentEmail}</span>.
        </p>
      </div>
    </BaseModal>
  );
}
