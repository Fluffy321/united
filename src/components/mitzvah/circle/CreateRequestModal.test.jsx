import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./CreateRequestModal.jsx', import.meta.url), 'utf8');

describe('CreateRequestModal direction copy', () => {
  it('uses direct need language in need mode', () => {
    expect(source).toContain('New help request');
    expect(source).toContain('What is needed?');
    expect(source).toContain("direction === 'offer' ? 'Post offer' : 'Post need'");
  });

  it('uses friendly public offer language in offer mode', () => {
    expect(source).toContain('Public help offer');
    expect(source).toContain('What can you help with?');
  });
});
