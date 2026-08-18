import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./Layout.jsx', import.meta.url), 'utf8');

describe('global publishing action', () => {
  it('opens the Smart Publisher from one clearly labeled plus action', () => {
    expect(source).toContain('aria-label="Create a post"');
    expect(source).toContain("navigate('/Publish')");
  });
});
