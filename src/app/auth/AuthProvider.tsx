import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logger } from '../logger';

const log = logger.create('auth');

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  updateProfile: (data: { fullName?: string }) => Promise<{ error: string | null }>;
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

        if (_event === 'PASSWORD_RECOVERY' && newSession) {
          log.info('stateChange', 'Password recovery session, redirecting to reset page');
          setSession(newSession);
          setUser(newSession.user);
          setStatus('authenticated');
          window.location.replace('/reset-password');
          return;
        }

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
    const { error } = await supabase.auth.signOut();
    if (error) {
      log.error('signOut', 'Sign out failed', { message: error.message });
    }
  }, []);

  const updateProfile = useCallback(async (data: { fullName?: string }): Promise<{ error: string | null }> => {
    log.info('updateProfile', 'Updating user profile', { hasName: !!data.fullName });
    const { error } = await supabase.auth.updateUser({
      data: { full_name: data.fullName },
    });
    if (error) {
      log.error('updateProfile', 'Profile update failed', { message: error.message });
      return { error: error.message };
    }
    const { data: refreshed } = await supabase.auth.getUser();
    if (refreshed.user) setUser(refreshed.user);
    return { error: null };
  }, []);

  const value = useMemo<AuthState>(
    () => ({ status, user, session, signOut, updateProfile }),
    [status, user, session, signOut, updateProfile],
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
