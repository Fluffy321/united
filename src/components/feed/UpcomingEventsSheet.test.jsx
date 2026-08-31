import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./UpcomingEventsSheet.jsx', import.meta.url), 'utf8');

describe('UpcomingEventsSheet accessibility', () => {
  it('describes the event browser to assistive technology', () => {
    expect(source).toContain('SheetDescription');
    expect(source).toContain('Browse real events shared across JUnited');
  });
});
