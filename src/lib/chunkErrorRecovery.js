const CHUNK_ERROR_PATTERN = /dynamically imported module|chunkloaderror|importing a module script failed|failed to fetch dynamically imported module/i;
const RELOAD_FLAG = 'junited-chunk-reload';

export function isChunkLoadError(error) {
  if (!error) return false;
  return CHUNK_ERROR_PATTERN.test(`${error.name || ''} ${error.message || ''}`);
}

// Reloads the page once per session to recover from a stale chunk URL left
// over from before the latest deploy. Returns false if already attempted,
// so callers can fall through to a normal error state instead of looping.
export function recoverFromChunkError() {
  if (typeof window === 'undefined') return false;
  if (window.sessionStorage?.getItem(RELOAD_FLAG) === '1') return false;
  window.sessionStorage?.setItem(RELOAD_FLAG, '1');
  window.location.reload();
  return true;
}
