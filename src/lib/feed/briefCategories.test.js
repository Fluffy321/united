import { describe, expect, it } from 'vitest';
import {
  BRIEF_CATEGORIES,
  BRIEF_CATEGORY_IDS,
  DEFAULT_BRIEF_CATEGORY_IDS,
  getBriefCategory,
} from './briefCategories';

const EXPECTED_IDS = [
  'local',
  'helping',
  'jewish_times',
  'events',
  'kosher_food',
  'minyanim',
  'parents_schools',
  'torah_learning',
  'marketplace',
  'jobs_business',
  'sports_social',
  'shabbos_plans',
];

const CARD_TONES = ['blue', 'emerald', 'amber', 'orange', 'lime', 'indigo', 'sky', 'violet', 'teal', 'slate', 'rose', 'fuchsia'];

describe('Daily Brief category contract', () => {
  it('keeps the complete category registry in the approved order', () => {
    expect(BRIEF_CATEGORY_IDS).toEqual(EXPECTED_IDS);
    expect(BRIEF_CATEGORIES.map(({ id }) => id)).toEqual(EXPECTED_IDS);
  });

  it('gives every category complete launchpad metadata', () => {
    for (const category of BRIEF_CATEGORIES) {
      expect(category.label).toBeTruthy();
      expect(category.description).toBeTruthy();
      expect(category.icon).toBeTruthy();
      expect(category.accent).toBeTruthy();
      expect(category.tabs).toEqual(['updates', 'discuss', 'directory']);
      expect(category.actions).toHaveLength(2);
      expect(category.actions.every(({ id, label }) => id && label)).toBe(true);
      expect(category.card.shortLabel).toBeTruthy();
      expect(CARD_TONES).toContain(category.card.tone);
      expect(category.card.emptyLabel).toBeTruthy();
    }
  });

  it('uses the locked defaults and returns null for unknown categories', () => {
    expect(DEFAULT_BRIEF_CATEGORY_IDS).toEqual(['local', 'helping', 'events', 'jewish_times']);
    expect(getBriefCategory('minyanim')).toEqual(
      expect.objectContaining({ id: 'minyanim', label: 'Minyanim' })
    );
    expect(getBriefCategory('unknown')).toBeNull();
  });
});
