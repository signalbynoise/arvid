import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AdminAuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      if (existing) {
        setSession(existing);
        setUser(existing.user);
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setStatus(newSession ? 'authenticated' : 'unauthenticated');
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AdminAuthState>(
    () => ({ status, user, session, signOut }),
    [status, user, session, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthState {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
