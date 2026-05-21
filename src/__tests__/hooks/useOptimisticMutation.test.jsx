import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

import { toast } from 'sonner';

describe('useOptimisticMutation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('initialises with isPending=false and a mutate function', () => {
    const { result } = renderHook(() => useOptimisticMutation());
    expect(result.current.isPending).toBe(false);
    expect(typeof result.current.mutate).toBe('function');
  });

  it('applies the optimistic update synchronously before the mutation resolves', async () => {
    const { result } = renderHook(() => useOptimisticMutation());
    const optimisticCallback = vi.fn();
    const optimisticData = { id: 1, text: 'hello' };
    let resolvePromise;
    const mutationFn = () => new Promise((resolve) => { resolvePromise = resolve; });

    // Start the mutation — do NOT await so we can inspect mid-flight state
    act(() => { result.current.mutate({ optimisticData, optimisticCallback, mutationFn }); });

    expect(optimisticCallback).toHaveBeenCalledWith(optimisticData);

    await act(async () => { resolvePromise('ok'); });
  });

  it('sets isPending=true while the mutation is in flight', async () => {
    const { result } = renderHook(() => useOptimisticMutation());
    let resolvePromise;
    const mutationFn = () => new Promise((resolve) => { resolvePromise = resolve; });

    act(() => { result.current.mutate({ mutationFn }); });
    expect(result.current.isPending).toBe(true);

    await act(async () => { resolvePromise('ok'); });
    expect(result.current.isPending).toBe(false);
  });

  it('calls onSuccess with the mutation result', async () => {
    const { result } = renderHook(() => useOptimisticMutation());
    const onSuccess = vi.fn();
    const mutationResult = { id: 42 };
    const mutationFn = vi.fn().mockResolvedValue(mutationResult);

    await act(async () => { await result.current.mutate({ mutationFn, onSuccess }); });

    expect(onSuccess).toHaveBeenCalledWith(mutationResult);
  });

  it('returns the mutation result to the caller', async () => {
    const { result } = renderHook(() => useOptimisticMutation());
    const mutationFn = vi.fn().mockResolvedValue({ id: 99 });

    let returned;
    await act(async () => {
      returned = await result.current.mutate({ mutationFn });
    });
    expect(returned).toEqual({ id: 99 });
  });

  it('rolls back (calls optimisticCallback(null)) on error', async () => {
    const { result } = renderHook(() => useOptimisticMutation());
    const optimisticCallback = vi.fn();
    const mutationFn = vi.fn().mockRejectedValue(new Error('Server error'));

    await act(async () => {
      try { await result.current.mutate({ optimisticData: { id: 1 }, optimisticCallback, mutationFn, showErrorToast: false }); }
      catch {}
    });

    expect(optimisticCallback).toHaveBeenNthCalledWith(2, null);
  });

  it('calls onError with the thrown error', async () => {
    const { result } = renderHook(() => useOptimisticMutation());
    const onError = vi.fn();
    const error = new Error('Boom');
    const mutationFn = vi.fn().mockRejectedValue(error);

    await act(async () => {
      try { await result.current.mutate({ mutationFn, onError, showErrorToast: false }); }
      catch {}
    });
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('shows an error toast by default on failure', async () => {
    const { result } = renderHook(() => useOptimisticMutation());
    const mutationFn = vi.fn().mockRejectedValue(new Error('Toast me'));

    await act(async () => {
      try { await result.current.mutate({ mutationFn }); }
      catch {}
    });
    expect(toast.error).toHaveBeenCalledWith('Toast me');
  });

  it('suppresses the toast when showErrorToast=false', async () => {
    const { result } = renderHook(() => useOptimisticMutation());
    const mutationFn = vi.fn().mockRejectedValue(new Error('Silent'));

    await act(async () => {
      try { await result.current.mutate({ mutationFn, showErrorToast: false }); }
      catch {}
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('re-throws the error after rollback so the caller can handle it', async () => {
    const { result } = renderHook(() => useOptimisticMutation());
    const mutationFn = vi.fn().mockRejectedValue(new Error('Rethrown'));

    await act(async () => {
      await expect(
        result.current.mutate({ mutationFn, showErrorToast: false })
      ).rejects.toThrow('Rethrown');
    });
  });

  it('resets isPending to false after an error', async () => {
    const { result } = renderHook(() => useOptimisticMutation());
    const mutationFn = vi.fn().mockRejectedValue(new Error('fail'));

    await act(async () => {
      try { await result.current.mutate({ mutationFn, showErrorToast: false }); }
      catch {}
    });
    expect(result.current.isPending).toBe(false);
  });

  it('works without optimisticCallback (no crash when omitted)', async () => {
    const { result } = renderHook(() => useOptimisticMutation());
    const mutationFn = vi.fn().mockResolvedValue('ok');
    await act(async () => { await result.current.mutate({ mutationFn }); });
    // No throw = pass
  });
});
