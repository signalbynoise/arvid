import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/admin/articles';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    navigate(from, { replace: true });
  }, [email, password, from, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base px-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-h2 text-text-primary">CMS Admin</h1>

        {error && (
          <p className="text-caption text-status-error">{error}</p>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-label text-text-quaternary" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="rounded-comfortable border border-border-default bg-surface-panel p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-label text-text-quaternary" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="rounded-comfortable border border-border-default bg-surface-panel p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
