import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./Feed.jsx', import.meta.url), 'utf8');

describe('Mobile headquarters Feed contract', () => {
  it('uses the new Brief, intentions, and community stream composition', () => {
    expect(source).toContain("import FeedIntentionRail from '@/components/feed/FeedIntentionRail'");
    expect(source).toContain("import BriefCategoryLaunchpad from '@/components/feed/BriefCategoryLaunchpad'");
    expect(source).toContain("import BriefCategorySection from '@/components/feed/BriefCategorySection'");
    expect(source).toContain('readBriefRouteState');
    expect(source).toContain('<FeedIntentionRail');
    expect(source).toContain('<BriefCategoryLaunchpad');
    expect(source).toContain('<BriefCategorySection');
    expect(source).toContain('From your community');
    expect(source).not.toContain('PostingPrompts');
    expect(source).not.toContain('FiveTownsConversationHub');
    expect(source).not.toContain('useFloatingActions');
  });

  it('queries explicit preferences and safe signals for Brief ranking', () => {
    expect(source).toContain('feedPreferenceKeys.user(currentUser?.id)');
    expect(source).toContain('feedPreferenceKeys.signals(currentUser?.id)');
    expect(source).toContain('rankBriefItems');
    expect(source).toContain("eventType: 'category_open'");
    expect(source).toContain("eventType: 'reply'");
    expect(source).not.toContain("eventType: 'engaged'");
  });

  it('lets members privately reduce unwanted categories', () => {
    expect(source).toContain('handleShowLess');
    expect(source).toContain("eventType: 'show_less'");
    expect(source).toContain('onShowLess={handleShowLess}');
    expect(source).toContain('hiddenPostIds');
  });
});
