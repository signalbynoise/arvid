import { useState, useCallback } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { supabase } from '../../lib/supabase';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { logger } from '../../logger';

const log = logger.create('ChangePassword');

const PROVIDER_LABELS: Record<string, string> = {
  github: 'GitHub',
  google: 'Google',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
  azure: 'Microsoft',
  apple: 'Apple',
  twitter: 'Twitter',
  discord: 'Discord',
  slack: 'Slack',
};

interface ChangePasswordSectionProps {
  email: string;
  authProvider: string;
}

export function ChangePasswordSection({ email, authProvider }: ChangePasswordSectionProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const clearFeedback = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  const handleChangePassword = useCallback(async () => {
    clearFeedback();

    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSaving(true);
    log.info('changePassword', 'Verifying current password');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      log.error('changePassword', 'Current password verification failed', { message: signInError.message });
      setIsSaving(false);
      setError('Current password is incorrect.');
      return;
    }

    log.info('changePassword', 'Updating password');
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setIsSaving(false);

    if (updateError) {
      log.error('changePassword', 'Password update failed', { message: updateError.message });
      setError('Failed to update password. Please try again.');
      return;
    }

    log.info('changePassword', 'Password updated successfully');
    setSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  }, [email, currentPassword, newPassword, confirmNewPassword, clearFeedback]);

  if (authProvider !== 'email') {
    const providerLabel = PROVIDER_LABELS[authProvider] ?? authProvider;
    return (
      <div className="border-t border-border-subtle pt-6">
        <h3 className="text-caption-lg text-text-primary mb-4">Authentication</h3>
        <p className="text-caption text-text-tertiary">
          Signed in with <span className="text-text-secondary">{providerLabel}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border-subtle pt-6">
      <h3 className="text-caption-lg text-text-primary mb-4">Change Password</h3>
      <div className="space-y-3 max-w-[320px]">
        <FormField label="Current password" error={null}>
          <TextInput
            type="password"
            autoComplete="current-password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(v) => { setCurrentPassword(v); clearFeedback(); }}
            disabled={isSaving}
          />
        </FormField>
        <FormField label="New password" error={null}>
          <TextInput
            type="password"
            autoComplete="new-password"
            placeholder="Min 8 characters"
            value={newPassword}
            onChange={(v) => { setNewPassword(v); clearFeedback(); }}
            disabled={isSaving}
          />
        </FormField>
        <FormField label="Confirm new password" error={error}>
          <TextInput
            type="password"
            autoComplete="new-password"
            placeholder="Repeat new password"
            value={confirmNewPassword}
            onChange={(v) => { setConfirmNewPassword(v); clearFeedback(); }}
            disabled={isSaving}
            hasError={!!error}
          />
        </FormField>
        {success && (
          <p className="text-label-sm text-status-success">Password updated.</p>
        )}
        <button
          onClick={handleChangePassword}
          disabled={isSaving || (!currentPassword && !newPassword)}
          className="btn-ghost flex items-center gap-2 mt-1"
        >
          {isSaving ? (
            <Loader2 size={ICON_SIZE.sm} className="animate-spin" />
          ) : (
            <Lock size={ICON_SIZE.sm} />
          )}
          <span>{isSaving ? 'Updating...' : 'Update password'}</span>
        </button>
      </div>
    </div>
  );
}
