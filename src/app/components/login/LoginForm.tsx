import React, { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { API_BASE } from '../../constants';
import { logger } from '../../logger';

const log = logger.create('loginForm');

type FormStatus = 'idle' | 'submitting' | 'error' | 'signup_success' | 'reset_sent';
type FormView = 'credentials' | 'forgot';

interface LoginFormProps {
  mode: 'signin' | 'signup';
  onSuccess: () => void;
  inviteEmail?: string | null;
  onConfirmationView?: (showing: boolean) => void;
}

export function LoginForm({ mode, onSuccess, inviteEmail, onConfirmationView }: LoginFormProps) {
  const [email, setEmail] = useState(inviteEmail ?? '');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [view, setView] = useState<FormView>('credentials');

  const isConfirmationView = status === 'signup_success' || status === 'reset_sent';
  React.useEffect(() => {
    onConfirmationView?.(isConfirmationView);
  }, [isConfirmationView, onConfirmationView]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus('submitting');
      setErrorMessage('');

      if (mode === 'signup') {
        log.info('submit', 'Attempting sign up', { email });
        try {
          const res = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            log.error('submit', 'Sign up failed', { message: data.error });
            setStatus('error');
            setErrorMessage(data.error);
            return;
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Network error';
          log.error('submit', 'Sign up request failed', { message });
          setStatus('error');
          setErrorMessage(message);
          return;
        }
        log.info('submit', 'Sign up succeeded — check email for confirmation');
        setStatus('signup_success');
        return;
      }

      log.info('submit', 'Attempting email/password sign in', { email });
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        log.error('submit', 'Sign in failed', { message: error.message });
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }

      log.info('submit', 'Sign in succeeded');
      setStatus('idle');
      onSuccess();
    },
    [email, password, mode, onSuccess],
  );

  const handleForgotPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus('submitting');
      setErrorMessage('');

      if (!email) {
        setStatus('error');
        setErrorMessage('Please enter your email address.');
        return;
      }

      log.info('forgotPassword', 'Sending password reset email', { email });
      try {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) {
          const data = await res.json();
          log.error('forgotPassword', 'Reset failed', { message: data.error });
          setStatus('error');
          setErrorMessage(data.error);
          return;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        log.error('forgotPassword', 'Reset request failed', { message });
        setStatus('error');
        setErrorMessage(message);
        return;
      }

      log.info('forgotPassword', 'Reset email sent');
      setStatus('reset_sent');
    },
    [email],
  );

  const isSubmitting = status === 'submitting';
  const isSignUp = mode === 'signup';

  if (status === 'signup_success') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <img src="/favicon.svg" alt="Arvid" className="h-10 w-10" />
        <p className="text-[15px] font-[var(--fw-medium)] text-text-primary">Check your email</p>
        <p className="text-[13px] font-[var(--fw-regular)] text-text-tertiary max-w-[300px]">
          We sent a confirmation link to <span className="text-text-secondary font-[var(--fw-medium)]">{email}</span>. Click it to activate your account.
        </p>
      </div>
    );
  }

  if (status === 'reset_sent') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <img src="/favicon.svg" alt="Arvid" className="h-10 w-10" />
        <p className="text-[15px] font-[var(--fw-medium)] text-text-primary">Check your email</p>
        <p className="text-[13px] font-[var(--fw-regular)] text-text-tertiary max-w-[300px]">
          We sent a password reset link to <span className="text-text-secondary font-[var(--fw-medium)]">{email}</span>. Click it to set a new password.
        </p>
        <button
          type="button"
          onClick={() => { setView('credentials'); setStatus('idle'); }}
          className="text-[13px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors mt-2"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (view === 'forgot') {
    return (
      <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reset-email"
            className="text-[13px] font-[var(--fw-medium)] text-text-secondary"
          >
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            required
            autoComplete="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="h-10 rounded-comfortable border border-border-default bg-surface-frost-02 px-3 text-[14px] font-[var(--fw-regular)] text-text-primary placeholder:text-text-quaternary outline-none transition-colors focus:border-border-focus-max disabled:opacity-50"
          />
        </div>

        {status === 'error' && errorMessage && (
          <p className="text-[13px] font-[var(--fw-regular)] text-status-error">{errorMessage}</p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>

        <button
          type="button"
          onClick={() => { setView('credentials'); setStatus('idle'); setErrorMessage(''); }}
          className="text-[13px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors text-center"
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="login-email"
          className="text-[13px] font-[var(--fw-medium)] text-text-secondary"
        >
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          className="h-10 rounded-comfortable border border-border-default bg-surface-frost-02 px-3 text-[14px] font-[var(--fw-regular)] text-text-primary placeholder:text-text-quaternary outline-none transition-colors focus:border-border-focus-max disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="text-[13px] font-[var(--fw-medium)] text-text-secondary"
          >
            Password
          </label>
          {!isSignUp && (
            <button
              type="button"
              onClick={() => { setView('forgot'); setStatus('idle'); setErrorMessage(''); }}
              className="text-[13px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors"
            >
              Forgot password?
            </button>
          )}
        </div>
        <input
          id="login-password"
          type="password"
          required
          minLength={isSignUp ? 8 : undefined}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          placeholder={isSignUp ? 'Choose a password (min 8 characters)' : 'Password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          className="h-10 rounded-comfortable border border-border-default bg-surface-frost-02 px-3 text-[14px] font-[var(--fw-regular)] text-text-primary placeholder:text-text-quaternary outline-none transition-colors focus:border-border-focus-max disabled:opacity-50"
        />
      </div>

      {status === 'error' && errorMessage && (
        <p className="text-[13px] font-[var(--fw-regular)] text-status-error">{errorMessage}</p>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting
          ? (isSignUp ? 'Creating account...' : 'Signing in...')
          : (isSignUp ? 'Create account' : 'Sign in')}
      </button>
    </form>
  );
}
