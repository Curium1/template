import { QueryClient } from '@tanstack/react-query';

/**
 * Global TanStack Query client.
 *
 * Defaults tuned for a Supabase-backed SaaS:
 * - staleTime: 30s — data is "fresh" for 30s before refetching
 * - gcTime: 5min — unused queries garbage-collected after 5min
 * - retry: 1 — single retry on failure (Supabase is generally reliable)
 * - refetchOnWindowFocus: true — re-validate when user returns to tab
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
