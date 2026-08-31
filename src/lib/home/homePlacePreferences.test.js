import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  homePlaceReason,
  loadHomePlacePreferences,
  rankHomeListings,
  saveHomePlacePreferences,
  updateHomePlacePreference,
} from './homePlacePreferences';

describe('homePlacePreferences', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps more, less, and hide choices reversible', () => {
    let value = { boosts: {}, hidden: [] };

    value = updateHomePlacePreference(value, 'food', 'more');
    expect(value).toEqual({ boosts: { food: 1 }, hidden: [] });

    value = updateHomePlacePreference(value, 'food', 'less');
    expect(value).toEqual({ boosts: {}, hidden: [] });

    value = updateHomePlacePreference(value, 'food', 'hide');
    expect(value.hidden).toEqual(['food']);

    value = updateHomePlacePreference(value, 'food', 'more');
    expect(value).toEqual({ boosts: { food: 1 }, hidden: [] });
  });

  it('ranks requested subjects first and hides them from Home only', () => {
    const listings = [
      { id: 'school', groupId: 'family' },
      { id: 'pizza', groupId: 'food' },
      { id: 'park', groupId: 'things-to-do' },
    ];
    const preferences = { boosts: { food: 2, family: -1 }, hidden: ['things-to-do'] };

    expect(rankHomeListings(listings, preferences).map((item) => item.id)).toEqual(['pizza', 'school']);
    expect(listings).toHaveLength(3);
  });

  it('only gives a reason after the user makes an explicit choice', () => {
    expect(homePlaceReason({ boosts: {}, hidden: [] }, 'food')).toBe('');
    expect(homePlaceReason({ boosts: { food: 1 }, hidden: [] }, 'food')).toBe('You asked for more like this');
    expect(homePlaceReason({ boosts: { food: -1 }, hidden: [] }, 'food')).toBe('You asked for fewer like this');
  });

  it('saves preferences under the current user without mixing accounts', () => {
    const values = new Map();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key) => values.get(key) || null,
        setItem: (key, value) => values.set(key, value),
      },
    });

    saveHomePlacePreferences('user-1', { boosts: { food: 1 }, hidden: [] });

    expect(loadHomePlacePreferences('user-1')).toEqual({ boosts: { food: 1 }, hidden: [] });
    expect(loadHomePlacePreferences('user-2')).toEqual({ boosts: {}, hidden: [] });
  });
});
