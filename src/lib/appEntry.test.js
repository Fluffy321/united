import { describe, expect, it } from 'vitest';
import { APP_ENTRY_PATH, LEGACY_WELCOME_REDIRECT_PATH } from './appEntry';

describe('app entry route', () => {
  it('sends root traffic to the protected Feed', () => {
    expect(APP_ENTRY_PATH).toBe('/Feed');
  });

  it('retires the legacy marketing route into the redesigned login welcome', () => {
    expect(LEGACY_WELCOME_REDIRECT_PATH).toBe('/login');
  });
});
