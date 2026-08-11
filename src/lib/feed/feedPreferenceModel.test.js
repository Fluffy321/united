import { describe, expect, it } from 'vitest';
import { BRIEF_CATEGORY_IDS } from './briefCategories';
import {
  DEFAULT_SETUP_DRAFT,
  applyCatchUpSelection,
  buildPreferencePatch,
  getActiveCatchUpWindow,
  getCategoryPreference,
  getCategoryPreferenceAdjustment,
  matchesInterestGroup,
  normalizePreferenceProfile,
  normalizeSetupDraft,
} from './feedPreferenceModel';

describe('feedPreferenceModel', () => {
  it('starts with local updates and plans without hiding anything else', () => {
    expect(DEFAULT_SETUP_DRAFT.interest_groups).toEqual(['local', 'plans']);

    const patch = buildPreferencePatch(DEFAULT_SETUP_DRAFT, {
      completedAt: '2026-08-11T16:00:00.000Z',
    });

    expect(patch.interests).toEqual(expect.arrayContaining([
      'local', 'events', 'sports_social', 'shabbos_plans',
    ]));
    expect(Object.keys(patch.category_preferences)).toEqual(BRIEF_CATEGORY_IDS);
    expect(Object.values(patch.category_preferences)).not.toContain('hide');
    expect(patch.preference_setup_version).toBe(1);
  });

  it('removes unknown values and keeps an empty interest selection valid', () => {
    expect(normalizeSetupDraft({
      interest_groups: ['unknown'],
      engagement_level: 'invalid',
      catch_up_windows: ['later'],
    })).toMatchObject({
      interest_groups: [],
      engagement_level: 'balanced',
      catch_up_windows: [],
    });
  });

  it('matches People and groups from community-source fields only', () => {
    expect(matchesInterestGroup({ community_id: 'community-1' }, 'people')).toBe(true);
    expect(matchesInterestGroup({ source: { community_id: 'community-1' } }, 'people')).toBe(true);
    expect(matchesInterestGroup({ title: 'A person is mentioned' }, 'people')).toBe(false);
  });

  it('makes important-only mutually exclusive with fixed windows', () => {
    expect(applyCatchUpSelection(['morning', 'evening'], 'important_only')).toEqual(['important_only']);
    expect(applyCatchUpSelection(['important_only'], 'daytime')).toEqual(['daytime']);
  });

  it('identifies the current selected catch-up window', () => {
    expect(getActiveCatchUpWindow(['morning'], new Date('2026-08-11T08:00:00-04:00'))).toBe('morning');
    expect(getActiveCatchUpWindow(['evening'], new Date('2026-08-11T19:00:00-04:00'))).toBe('evening');
    expect(getActiveCatchUpWindow(['morning'], new Date('2026-08-11T23:00:00-04:00'))).toBeNull();
    expect(getActiveCatchUpWindow(['important_only'], new Date('2026-08-11T08:00:00-04:00'))).toBeNull();
  });

  it('uses explicit category choices for ranking and hiding', () => {
    const preferences = normalizePreferenceProfile({
      category_preferences: {
        local: 'less',
        helping: 'hide',
        events: 'more',
        marketplace: 'unknown',
      },
    });

    expect(getCategoryPreference(preferences, 'local')).toBe('less');
    expect(getCategoryPreference(preferences, 'marketplace')).toBe('normal');
    expect(getCategoryPreference(preferences, 'not-real')).toBe('normal');
    expect(getCategoryPreferenceAdjustment('more')).toBe(30);
    expect(getCategoryPreferenceAdjustment('normal')).toBe(0);
    expect(getCategoryPreferenceAdjustment('less')).toBe(-20);
    expect(getCategoryPreferenceAdjustment('hide')).toBe(Number.NEGATIVE_INFINITY);
  });

  it('normalizes stored profiles without mutating their values', () => {
    const stored = {
      user_id: 'user-1',
      interests: ['local', 'unknown'],
      engagement_level: 'active',
      interest_groups: ['food', 'unknown'],
      category_preferences: { local: 'more', helping: 'hide', events: 'invalid' },
      catch_up_windows: ['morning', 'important_only', 'later'],
      preference_setup_version: 1,
      preference_setup_completed_at: '2026-08-11T16:00:00.000Z',
    };

    const normalized = normalizePreferenceProfile(stored);

    expect(normalized).toMatchObject({
      user_id: 'user-1',
      interests: ['local'],
      engagement_level: 'active',
      interest_groups: ['food'],
      catch_up_windows: ['important_only'],
      preference_setup_version: 1,
      preference_setup_completed_at: '2026-08-11T16:00:00.000Z',
    });
    expect(normalized.category_preferences.local).toBe('more');
    expect(normalized.category_preferences.helping).toBe('hide');
    expect(normalized.category_preferences.events).toBe('normal');
    expect(stored.catch_up_windows).toEqual(['morning', 'important_only', 'later']);
  });
});
