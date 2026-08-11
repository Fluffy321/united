import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./UnifiedPostModal.jsx', import.meta.url), 'utf8');

describe('Unified composer intention contract', () => {
  it('uses the shared kind/subtype resolvers and presents Offer accurately', () => {
    expect(source).toContain('resolveComposerKind');
    expect(source).toContain('resolveComposerSubtype');
    expect(source).toContain("if (postKind === 'offer') return 'Share Offer'");
    expect(source).toContain("post_subtype: resolveComposerSubtype(postKind, initialSubtype)");
  });
});
