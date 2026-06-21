import { lazy } from 'react';
import { isChunkLoadError, recoverFromChunkError } from './chunkErrorRecovery';

// Wraps React.lazy so a stale chunk URL from before the latest deploy
// triggers one automatic reload instead of surfacing a blank/error screen.
export default function lazyWithRetry(factory) {
  return lazy(() =>
    factory().catch((error) => {
      if (isChunkLoadError(error) && recoverFromChunkError()) {
        return new Promise(() => {});
      }
      throw error;
    })
  );
}
