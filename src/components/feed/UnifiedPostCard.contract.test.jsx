import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./UnifiedPostCard.jsx', import.meta.url), 'utf8');
const compactSource = source.slice(
  source.indexOf('function CompactPostCard'),
  source.indexOf('function UnifiedPostCardInner')
);

describe('Compact community post contract', () => {
  it('keeps content compact and every action mobile-accessible', () => {
    expect(compactSource).toContain('line-clamp-3');
    expect(compactSource).toContain('truncate');
    expect(compactSource.match(/min-h-11/g)?.length).toBeGreaterThanOrEqual(4);
    expect(compactSource).toContain('aria-label={`Mark ${title} as helpful`}');
    expect(compactSource).toContain('aria-label={`Reply to ${title}`}');
    expect(compactSource).toContain('aria-label={`Open ${title}`}');
  });

  it('offers a private Show less action without public gamification', () => {
    expect(compactSource).toContain('onShowLess');
    expect(compactSource).toContain('Show less like this');
    expect(compactSource).not.toMatch(/mitzvah points|leaderboard|public score|rank/i);
  });
});
