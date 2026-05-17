import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BrandPanel } from '../components/login/BrandPanel';
import { FormField } from '../components/ui/FormField';
import { TextInput } from '../components/ui/TextInput';
import { logger } from '../logger';

const log = logger.create('resetPassword');

type PageStatus = 'ready' | 'submitting' | 'error' | 'success';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<PageStatus>('ready');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        log.info('recovery', 'Password recovery session detected');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage('');

      if (password.length < 8) {
        setStatus('error');
        setErrorMessage('Password must be at least 8 characters.');
        return;
      }

      if (password !== confirmPassword) {
        setStatus('error');
        setErrorMessage('Passwords do not match.');
        return;
      }

      setStatus('submitting');

      log.info('submit', 'Updating password');
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        log.error('submit', 'Password update failed', { message: error.message });
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }

      log.info('submit', 'Password updated successfully');
      setStatus('success');
    },
    [password, confirmPassword],
  );

  const isSubmitting = status === 'submitting';

  return (
    <div className="flex h-screen w-full bg-surface-base text-text-primary antialiased">
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[400px] flex flex-col gap-8">
          {status === 'success' ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-success-green-halo">
                <span className="text-status-success-green text-body-lg">&#10003;</span>
              </div>
              <p className="text-sm-md text-text-primary">Password updated</p>
              <p className="text-caption text-text-tertiary max-w-[300px]">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/', { replace: true })}
                className="btn-primary mt-2"
              >
                Continue to Arvid
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="text-h1 text-text-primary">Set new password</h1>
                <p className="text-sm text-text-tertiary">
                  Choose a new password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <FormField label="New password">
                  <TextInput
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={setPassword}
                    disabled={isSubmitting}
                  />
                </FormField>

                <FormField label="Confirm password" error={status === 'error' ? errorMessage : null}>
                  <TextInput
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    disabled={isSubmitting}
                    hasError={status === 'error'}
                  />
                </FormField>

                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
