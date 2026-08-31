import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./sheet.jsx', import.meta.url), 'utf8');

describe('Sheet close control', () => {
  it('stays above sticky sheet headers and keeps an iPhone-size touch target', () => {
    expect(source).toContain('z-20');
    expect(source).toContain('h-11 w-11');
  });
});
