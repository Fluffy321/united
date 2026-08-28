import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./Feed.jsx', import.meta.url), 'utf8');

describe('Mobile headquarters Feed contract', () => {
  it('uses the complete Five Towns dashboard and removes repeated Home prompt surfaces', () => {
    expect(source).toContain("import FiveTownsHomeDashboard from '@/components/home/FiveTownsHomeDashboard'");
    expect(source).not.toContain("import HomeContributionEntry from '@/components/feed/HomeContributionEntry'");
    expect(source).not.toContain("import HomeStartHere from '@/components/feed/HomeStartHere'");
    expect(source).not.toContain("import LiveCategoryDeck from '@/components/feed/LiveCategoryDeck'");
    expect(source).toContain("import BriefCategoryLaunchpad from '@/components/feed/BriefCategoryLaunchpad'");
    expect(source).toContain("import BriefCategorySection from '@/components/feed/BriefCategorySection'");
    expect(source).toContain('readBriefRouteState');
    expect(source).toContain('<FiveTownsHomeDashboard');
    expect(source).not.toContain('<HomeContributionEntry');
    expect(source).not.toContain('<HomeStartHere');
    expect(source).not.toContain('<LiveCategoryDeck');
    expect(source).toContain('<BriefCategoryLaunchpad');
    expect(source).toContain('<BriefCategorySection');
    expect(source).not.toContain('From your community');
    expect(source).not.toContain('<FeedIntentionRail');
    expect(source).not.toContain('<FiveTownsBrief');
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

  it('shows the approved setup once and wires the full profile into Home', () => {
    expect(source).toContain("import FeedPreferenceSetup from '@/components/feed/FeedPreferenceSetup'");
    expect(source).toContain('preference_setup_completed_at');
    expect(source).toContain('feedRetentionService.savePreferences');
    expect(source).toContain('preferences: briefPreferences');
    expect(source).toContain('briefPreferencesFetched');
    expect(source).toContain('<FeedPreferenceSetup');
  });

  it('keeps unwanted posts and hidden categories out of the personalized dashboard', () => {
    expect(source).toContain("briefPreferences?.category_preferences?.[categoryId] === 'hide'");
    expect(source).toContain('posts={rankedBriefItems}');
  });

  it('opens verified automated updates at their original source before normal post actions', () => {
    expect(source).toContain('if (post.source_url)');
    expect(source).toContain("window.open(post.source_url, '_blank', 'noopener,noreferrer')");
    expect(source.indexOf('if (post.source_url)')).toBeLessThan(source.indexOf("if (post.type === 'help')"));
  });

  it('uses only real backend posts on Home', () => {
    expect(source).not.toContain("import { DEMO_POSTS }");
    expect(source).not.toContain('Preview content');
    expect(source).not.toContain('Showing sample Five Towns posts');
    expect(source).not.toContain('feedSourcePosts');
    expect(source).toContain('const visiblePosts = posts.filter');
  });
});
