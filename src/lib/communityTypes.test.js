import { describe, it, expect } from 'vitest';
import { getSupportedCommunityTabs, getCommunityTypeKey, COMMUNITY_TYPE_CONFIG } from './communityTypes';

describe('getCommunityTypeKey', () => {
  it('falls back to general for unknown or empty communities', () => {
    expect(COMMUNITY_TYPE_CONFIG[getCommunityTypeKey({})]).toBeTruthy();
    expect(COMMUNITY_TYPE_CONFIG[getCommunityTypeKey({ type: 'not-a-real-type' })]).toBeTruthy();
  });
});

describe('getSupportedCommunityTabs', () => {
  it('never returns an empty tab list', () => {
    expect(getSupportedCommunityTabs({}, {}).length).toBeGreaterThan(0);
  });

  it('hides capability-gated tabs when the capability is off', () => {
    const tabs = getSupportedCommunityTabs({}, { events: false, resources: false, chat: false, listings: false });
    expect(tabs).not.toContain('events');
    expect(tabs).not.toContain('resources');
    expect(tabs).not.toContain('chat');
    expect(tabs).not.toContain('listings');
  });

  it('injects admin-enabled modules even when the type does not include them', () => {
    const tabs = getSupportedCommunityTabs({}, { resources: true, chat: true, listings: true, events: true });
    expect(tabs).toContain('resources');
    expect(tabs).toContain('chat');
    expect(tabs).toContain('listings');
    expect(tabs).toContain('events');
  });

  it('places injected modules before the members tab when present', () => {
    const tabs = getSupportedCommunityTabs({}, { chat: true });
    if (tabs.includes('members')) {
      expect(tabs.indexOf('chat')).toBeLessThan(tabs.indexOf('members'));
    }
  });

  it('does not duplicate tabs already in the base list', () => {
    const tabs = getSupportedCommunityTabs({}, { events: true, resources: true, chat: true, listings: true, groups: true, forms: true });
    expect(new Set(tabs).size).toBe(tabs.length);
  });
});
