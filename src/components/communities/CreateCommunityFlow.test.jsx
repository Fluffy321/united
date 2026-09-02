import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('CreateCommunityFlow accessibility', () => {
  it('gives its icon-only close control an accessible name', () => {
    const source = readFileSync(fileURLToPath(new URL('./CreateCommunityFlow.jsx', import.meta.url)), 'utf8');
    expect(source).toContain('aria-label="Close create community"');
  });
});
