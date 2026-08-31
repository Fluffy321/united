import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const feedSource = readFileSync(new URL('./Feed.jsx', import.meta.url), 'utf8');
const communitiesSource = readFileSync(new URL('./Communities.jsx', import.meta.url), 'utf8');
const helpSource = readFileSync(new URL('./MitzvahCircle.jsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../Layout.jsx', import.meta.url), 'utf8');

describe('iPhone app shell contract', () => {
  it('clears the fixed navigation on both content-heavy primary pages', () => {
    expect(feedSource).toContain('mobile-safe-bottom');
    expect(communitiesSource).toContain('mobile-safe-bottom');
  });

  it('keeps global navigation and floating actions on the shared shell', () => {
    expect(layoutSource).toContain('app-bottom-nav');
    expect(layoutSource).toContain('app-fixed-layer');
    expect(layoutSource).toContain('app-floating-stack');
    expect(layoutSource).toContain("currentPageName !== 'Feed'");
  });

  it('keeps Communities errors inside the same actionable recovery path', () => {
    expect(communitiesSource).toContain('communitiesError && catalogCommunities.length === 0');
    expect(communitiesSource).toContain('onRetry={retryCommunities}');
    expect(communitiesSource).toContain("onGoHome={() => navigate('/Feed')}");
  });

  it('does not call a still-loading Communities query empty', () => {
    expect(communitiesSource).toContain('!isLoading && !showCommunitiesRecovery && catalogCommunities.length === 0');
    expect(communitiesSource).not.toContain('seed communities');
  });

  it('keeps the real help request flow available after removing the duplicate Home action', () => {
    expect(feedSource).toContain('<FiveTownsHomeDashboard');
    expect(feedSource).toContain("navigate('/MitzvahCircle')");
    expect(feedSource).not.toContain('<HomeStartHere');
    expect(helpSource).toContain("searchParams.get('action') !== 'request'");
    expect(helpSource).toContain("next.delete('action')");
  });
});
