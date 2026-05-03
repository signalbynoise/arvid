import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { BrandPanel } from '../components/login/BrandPanel';
import { LoginForm } from '../components/login/LoginForm';
import { OAuthButtons } from '../components/login/OAuthButtons';

type AuthMode = 'signin' | 'signup';

export function LoginPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('signin');

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  useEffect(() => {
    if (status === 'authenticated') {
      navigate(from, { replace: true });
    }
  }, [status, navigate, from]);

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  const isSignUp = mode === 'signup';

  return (
    <div
      className="flex h-screen w-full bg-surface-base text-text-primary antialiased"
    >
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[400px] flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-[32px] font-[var(--fw-medium)] leading-[1.13] tracking-[-0.704px] text-text-primary">
              {isSignUp ? 'Create account' : 'Sign in'}
            </h1>
            <p className="text-[15px] font-[var(--fw-regular)] leading-[1.6] tracking-[-0.165px] text-text-tertiary">
              {isSignUp
                ? 'Enter your details to get started.'
                : 'Welcome back! Enter your details below.'}
            </p>
          </div>

          <LoginForm mode={mode} onSuccess={handleLoginSuccess} />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-frost-08" />
            <span className="text-[12px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-surface-frost-08" />
          </div>

          <OAuthButtons />

          <p className="text-center text-[13px] font-[var(--fw-regular)] text-text-tertiary">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-[13px] font-[var(--fw-medium)] text-text-primary hover:text-white transition-colors"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[13px] font-[var(--fw-medium)] text-text-primary hover:text-white transition-colors"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
