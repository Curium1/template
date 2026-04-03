import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../../shared/api/supabaseClient';
import type { AppUser, AuthState } from '../types';
import type { Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Fetches user display name from user_profiles.
 * Roles are no longer here — they come from CompanyContext.
 */
async function fetchUserProfile(userId: string): Promise<{ displayName: string } | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('display_name')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.warn('[Auth] Could not fetch user profile:', error?.message);
    return null;
  }

  return { displayName: data.display_name ?? '' };
}

async function buildAppUser(session: Session): Promise<AppUser> {
  const supabaseUser = session.user;
  const profile = await fetchUserProfile(supabaseUser.id);

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    displayName: profile?.displayName ?? supabaseUser.email ?? 'Användare',
    supabaseUser,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          setSession(existingSession);
          const appUser = await buildAppUser(existingSession);
          setUser(appUser);
        }
      } catch (err) {
        console.error('[Auth] Failed to initialize:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.info(`[Auth] State change: ${event}`);
        if (newSession) {
          setSession(newSession);
          const appUser = await buildAppUser(newSession);
          setUser(appUser);
        } else {
          setSession(null);
          setUser(null);
        }
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }
      }
    );

    return () => { subscription.unsubscribe(); };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const value: AuthState = {
    user,
    session,
    isAuthenticated: !!user && !!session,
    isLoading,
    login,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
