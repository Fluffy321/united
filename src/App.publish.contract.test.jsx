import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');

describe('Smart Publisher route', () => {
  it('lazy loads a protected Publish screen', () => {
    expect(source).toContain("const Publish                 = lazy(() => import('@/pages/Publish'))");
    expect(source).toContain('path="/Publish"');
    expect(source).toContain('<Publish />');
  });
});
