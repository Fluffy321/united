import { QueryClient } from '@tanstack/react-query';

const MINUTE = 60_000;

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Data stays fresh for 1 minute. Navigating back to a page within that
      // window reuses the cache without firing a network request.
      staleTime: MINUTE,
      // Keep inactive cache entries for 10 minutes so back-navigation renders
      // instantly (stale data shown immediately, background refetch follows).
      gcTime: 10 * MINUTE,
    },
  },
});
