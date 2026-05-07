import React, { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../logger';

const log = logger.create('loginForm');

type FormStatus = 'idle' | 'submitting' | 'error' | 'signup_success';

interface LoginFormProps {
  mode: 'signin' | 'signup';
  onSuccess: () => void;
}

export function LoginForm({ mode, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus('submitting');
      setErrorMessage('');

      if (mode === 'signup') {
        log.info('submit', 'Attempting sign up', { email });
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          log.error('submit', 'Sign up failed', { message: error.message });
          setStatus('error');
          setErrorMessage(error.message);
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

  const isSubmitting = status === 'submitting';
  const isSignUp = mode === 'signup';

  if (status === 'signup_success') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-success-green-halo">
          <span className="text-status-success-green text-body-lg">&#10003;</span>
        </div>
        <p className="text-[15px] font-[var(--fw-medium)] text-text-primary">Check your email</p>
        <p className="text-[13px] font-[var(--fw-regular)] text-text-tertiary max-w-[300px]">
          We sent a confirmation link to <span className="text-text-secondary font-[var(--fw-medium)]">{email}</span>. Click it to activate your account.
        </p>
      </div>
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

      <button type="submit" disabled={isSubmitting} className="btn-primary px-4">
        {isSubmitting
          ? (isSignUp ? 'Creating account...' : 'Signing in...')
          : (isSignUp ? 'Create account' : 'Sign in')}
      </button>
    </form>
  );
}
