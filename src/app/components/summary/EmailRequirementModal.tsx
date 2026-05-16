import React, { useState, useCallback } from 'react';
import { BaseModal } from '../BaseModal';
import { ModalFooter } from '../ui/ModalFooter';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { SubmitButton } from '../ui/SubmitButton';
import { api } from '../../api';

interface EmailRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirementUrl: string;
  requirementTitle: string;
}

export function EmailRequirementModal({ isOpen, onClose, requirementUrl, requirementTitle }: EmailRequirementModalProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = email.includes('@') && email.includes('.');

  const handleSend = useCallback(async () => {
    if (!isValidEmail) return;
    setIsSending(true);
    setError(null);
    try {
      await api.emailRequirementLink(email, requirementUrl, requirementTitle);
      setEmail('');
      onClose();
    } catch (err) {
      setError('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [email, isValidEmail, requirementUrl, requirementTitle, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidEmail && !isSending) {
      handleSend();
    }
  }, [isValidEmail, isSending, handleSend]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Email requirement link"
      size="sm"
      footer={
        <ModalFooter>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <SubmitButton
            onClick={handleSend}
            disabled={!isValidEmail}
            isLoading={isSending}
            label="Send"
            loadingLabel="Sending..."
          />
        </ModalFooter>
      }
    >
      <FormField label="RECIPIENT EMAIL" error={error}>
        <TextInput
          value={email}
          onChange={setEmail}
          placeholder="colleague@company.com"
          type="email"
          autoFocus
          hasError={!!error}
          onKeyDown={handleKeyDown}
        />
      </FormField>
    </BaseModal>
  );
}
