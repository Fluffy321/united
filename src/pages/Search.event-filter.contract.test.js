import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./Search.jsx', import.meta.url), 'utf8');

describe('Search event deep link', () => {
  it('opens the event filter when Profile sends a member to plans', () => {
    expect(source).toContain('useSearchParams');
    expect(source).toContain("searchParams.get('type')");
    expect(source).toContain("post_type: initialPostType");
    expect(source).toContain('useState(Boolean(initialPostType))');
  });
});
