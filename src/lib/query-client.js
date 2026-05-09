import { QueryClient, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';

const MINUTE = 60_000;

export const queryClientInstance = new QueryClient({
  // Surface mutation failures that don't define their own onError handler.
  // Without this, a useMutation with only onSuccess silently drops errors.
  mutationCache: new MutationCache({
    onError(error, _vars, _ctx, mutation) {
      if (mutation.options.onError) return;
      const msg = String(error?.message || '');
      toast.error(msg && msg.length <= 100 ? msg : 'Action failed. Please try again.');
    },
  }),
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
