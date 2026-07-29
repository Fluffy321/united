import { describe, expect, it } from 'vitest';
import { APP_ENTRY_PATH } from './appEntry';

describe('app entry route', () => {
  it('sends root traffic to the protected Feed', () => {
    expect(APP_ENTRY_PATH).toBe('/Feed');
  });
});
