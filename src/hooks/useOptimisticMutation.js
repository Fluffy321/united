import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook for optimistic UI updates
 * Mutates local state immediately, rolls back on error
 */
export function useOptimisticMutation() {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(async ({
    optimisticData,
    optimisticCallback,
    mutationFn,
    onSuccess,
    onError,
    showErrorToast = true,
  }) => {
    setIsPending(true);
    
    // Apply optimistic update
    optimisticCallback?.(optimisticData);

    try {
      const result = await mutationFn();
      onSuccess?.(result);
      setIsPending(false);
      return result;
    } catch (error) {
      // Rollback optimistic update on error
      optimisticCallback?.(null); // Signal rollback
      onError?.(error);
      if (showErrorToast) {
        toast.error(error.message || 'Something went wrong');
      }
      setIsPending(false);
      throw error;
    }
  }, []);

  return { mutate, isPending };
}