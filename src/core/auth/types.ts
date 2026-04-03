import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

/**
 * Application user profile.
 * Roles are now per-company via CompanyContext — not stored on AppUser.
 */
export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  /** The raw Supabase user object */
  supabaseUser: SupabaseUser;
}

/**
 * Auth state provided via context.
 */
export interface AuthState {
  user: AppUser | null;
  session: SupabaseSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}
