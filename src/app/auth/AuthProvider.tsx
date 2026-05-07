import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { clearNavigation } from '../lib/navigation';
import { logger } from '../logger';

const log = logger.create('auth');

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    log.debug('init', 'Checking existing session');

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      if (existing) {
        log.info('init', 'Existing session found', { userId: existing.user.id });
        setSession(existing);
        setUser(existing.user);
        setStatus('authenticated');
      } else {
        log.debug('init', 'No existing session');
        setStatus('unauthenticated');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        log.debug('stateChange', `Auth event: ${_event}`, {
          userId: newSession?.user?.id ?? null,
        });

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
    log.info('signOut', 'Signing out');
    clearNavigation();
    const { error } = await supabase.auth.signOut();
    if (error) {
      log.error('signOut', 'Sign out failed', { message: error.message });
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ status, user, session, signOut }),
    [status, user, session, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
