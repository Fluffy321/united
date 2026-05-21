import { describe, it, expect } from 'vitest';
import {
  getCommunityTypeKey,
  getCommunityTypeConfig,
  getSupportedCommunityTabs,
  getCommunityTabLabel,
  getCommunityNavConfig,
} from '@/lib/communityTypes';

describe('getCommunityTypeKey', () => {
  it('returns "general" for an empty community', () => {
    expect(getCommunityTypeKey({})).toBe('general');
  });
  it('reads template_type before community_type', () => {
    expect(getCommunityTypeKey({ template_type: 'shul', community_type: 'general' })).toBe('shul');
  });
  it('recognizes direct type keys', () => {
    expect(getCommunityTypeKey({ community_type: 'shul' })).toBe('shul');
    expect(getCommunityTypeKey({ community_type: 'chesed' })).toBe('chesed');
    expect(getCommunityTypeKey({ community_type: 'neighborhood' })).toBe('neighborhood');
    expect(getCommunityTypeKey({ community_type: 'learning' })).toBe('learning');
  });
  it('resolves known aliases', () => {
    expect(getCommunityTypeKey({ community_type: 'synagogue' })).toBe('shul');
    expect(getCommunityTypeKey({ community_type: 'minyan' })).toBe('shul');
  });
  it('detects type from name substring — torah → learning', () => {
    expect(getCommunityTypeKey({ name: 'Torah Study Circle' })).toBe('learning');
  });
  it('detects type from name substring — parent → parents', () => {
    expect(getCommunityTypeKey({ name: 'Five Towns Parent Group' })).toBe('parents');
  });
  it('detects type from name substring — buy/sell → marketplace', () => {
    expect(getCommunityTypeKey({ name: 'Local Buy Sell Swap' })).toBe('marketplace');
  });
  it('detects type from name substring — neighborhood → neighborhood', () => {
    expect(getCommunityTypeKey({ name: 'Lawrence Neighborhood Watch' })).toBe('neighborhood');
  });
  it('falls back to "general" for unknown values', () => {
    expect(getCommunityTypeKey({ community_type: 'unknown_xyz_abc' })).toBe('general');
  });
});

describe('getCommunityTypeConfig', () => {
  it('returns a config with the expected shape', () => {
    const config = getCommunityTypeConfig({ template_type: 'shul' });
    expect(config).toHaveProperty('key');
    expect(config).toHaveProperty('label');
    expect(config).toHaveProperty('tabs');
    expect(config).toHaveProperty('primaryTabs');
    expect(Array.isArray(config.tabs)).toBe(true);
  });
  it('returns the general config for an unknown community', () => {
    const config = getCommunityTypeConfig({});
    expect(config.key).toBe('general');
  });
  it('returns different configs for different types', () => {
    const shul = getCommunityTypeConfig({ template_type: 'shul' });
    const gen = getCommunityTypeConfig({ template_type: 'general' });
    expect(shul.key).not.toBe(gen.key);
  });
});

describe('getSupportedCommunityTabs', () => {
  it('always includes home and members for a general community', () => {
    const tabs = getSupportedCommunityTabs({ template_type: 'general' }, {});
    expect(tabs).toContain('home');
    expect(tabs).toContain('members');
  });
  it('excludes chat when the chat capability is off', () => {
    const tabs = getSupportedCommunityTabs({ template_type: 'general' }, { chat: false });
    expect(tabs).not.toContain('chat');
  });
  it('includes chat when the chat capability is on', () => {
    const tabs = getSupportedCommunityTabs({ template_type: 'general' }, { chat: true });
    expect(tabs).toContain('chat');
  });
  it('excludes events when the events capability is off', () => {
    const tabs = getSupportedCommunityTabs({}, { events: false });
    expect(tabs).not.toContain('events');
  });
  it('includes events when the events capability is on', () => {
    const tabs = getSupportedCommunityTabs({}, { events: true });
    expect(tabs).toContain('events');
  });
  it('injects events before members when capability enables it on a type that lacks it natively', () => {
    // general type does not include events in its base tabs
    const tabs = getSupportedCommunityTabs({ template_type: 'general' }, { events: true });
    const eventsIdx = tabs.indexOf('events');
    const membersIdx = tabs.indexOf('members');
    expect(eventsIdx).toBeGreaterThanOrEqual(0);
    expect(eventsIdx).toBeLessThan(membersIdx);
  });
  it('includes resources when the resources capability is on', () => {
    const tabs = getSupportedCommunityTabs({}, { resources: true });
    expect(tabs).toContain('resources');
  });
  it('never returns an empty array', () => {
    const tabs = getSupportedCommunityTabs({}, {});
    expect(tabs.length).toBeGreaterThan(0);
  });
  it('does not duplicate any tab', () => {
    const tabs = getSupportedCommunityTabs(
      { template_type: 'general' },
      { chat: true, events: true, resources: true, listings: true }
    );
    const counts = {};
    for (const t of tabs) counts[t] = (counts[t] || 0) + 1;
    for (const [tab, count] of Object.entries(counts)) {
      expect(count, `tab "${tab}" appears ${count} times`).toBe(1);
    }
  });
});

describe('getCommunityTabLabel', () => {
  it.each([
    ['home', 'Home'],
    ['members', 'Members'],
    ['about', 'About'],
    ['posts', 'Posts'],
    ['feed', 'Posts'],
    ['chat', 'Chat'],
    ['events', 'Events'],
    ['resources', 'Resources'],
    ['listings', 'Listings'],
    ['groups', 'Groups'],
    ['announcements', 'Announcements'],
  ])('tab "%s" → "%s"', (tab, expected) => {
    expect(getCommunityTabLabel(tab)).toBe(expected);
  });
  it('returns the key itself for unrecognized tabs', () => {
    expect(getCommunityTabLabel('unknownTab')).toBe('unknownTab');
    expect(getCommunityTabLabel('customSection')).toBe('customSection');
  });
});

describe('getCommunityNavConfig', () => {
  it('returns primary and more arrays', () => {
    const result = getCommunityNavConfig({}, {});
    expect(Array.isArray(result.primary)).toBe(true);
    expect(Array.isArray(result.more)).toBe(true);
  });
  it('primary and more are disjoint', () => {
    const result = getCommunityNavConfig({}, { chat: true, events: true });
    const primarySet = new Set(result.primary);
    for (const tab of result.more) {
      expect(primarySet.has(tab)).toBe(false);
    }
  });
  it('union of primary and more equals all supported tabs', () => {
    const caps = { chat: true, events: true };
    const community = { template_type: 'general' };
    const { primary, more } = getCommunityNavConfig(community, caps);
    const allSupported = getSupportedCommunityTabs(community, caps).sort();
    const union = [...primary, ...more].sort();
    expect(union).toEqual(allSupported);
  });
  it('respects savedLayout.primaryTabs from community.settings', () => {
    const community = {
      template_type: 'general',
      settings: { layout: { primaryTabs: ['home', 'about'] } },
    };
    const { primary } = getCommunityNavConfig(community, {});
    // Only tabs that are actually supported will appear in primary
    expect(primary).toContain('home');
    expect(primary).toContain('about');
  });
  it('primary tabs are a subset of supported tabs', () => {
    const caps = { chat: true };
    const community = { template_type: 'general' };
    const { primary } = getCommunityNavConfig(community, caps);
    const supported = getSupportedCommunityTabs(community, caps);
    for (const tab of primary) {
      expect(supported).toContain(tab);
    }
  });
});
