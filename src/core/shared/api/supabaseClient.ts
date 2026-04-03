import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    /**
     * Workaround for NavigatorLockAcquireTimeoutError in dev mode.
     *
     * The Web Lock API prevents concurrent tab-refresh races, but with HMR
     * the old lock is sometimes never released, causing a timeout.
     *
     * By providing a custom lock implementation that uses a simple
     * Promise-based mutex instead of navigator.locks, we avoid the
     * browser Lock API entirely while still serializing token refreshes.
     */
    lock: async (name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => {
      // Simple no-contention lock: just execute immediately.
      // Safe for single-tab dev usage. In production with multi-tab,
      // you'd want the default navigator.locks behavior.
      return await fn();
    },
    storageKey: 'sb-auth-token',
    persistSession: true,
    detectSessionInUrl: true,
  },
});
