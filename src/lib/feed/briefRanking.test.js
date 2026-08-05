import { describe, expect, it } from 'vitest';
import {
  aggregateCategorySignals,
  classifyBriefCategory,
  rankBriefItems,
  scoreBriefItem,
} from './briefRanking';

const NOW = new Date('2026-08-05T16:00:00.000Z');

const item = (overrides = {}) => ({
  id: 'post-1',
  title: 'A useful local update',
  body: 'Road work begins tomorrow in Woodmere.',
  type: 'feed',
  post_subtype: 'local_update',
  category_id: 'local',
  created_at: '2026-08-05T12:00:00.000Z',
  ...overrides,
});

describe('Daily Brief ranking', () => {
  it('adds 60 points for an explicitly selected category', () => {
    const selected = scoreBriefItem(item(), {
      selectedCategoryIds: ['local'],
      now: NOW,
    });
    const unselected = scoreBriefItem(item(), {
      selectedCategoryIds: [],
      now: NOW,
    });

    expect(selected - unselected).toBe(60);
  });

  it('adds at most 25 points from allowed useful behavior', () => {
    const events = Array.from({ length: 8 }, (_, index) => ({
      id: `event-${index}`,
      event_type: index % 2 ? 'save' : 'category_open',
      metadata: { category_id: 'local' },
    }));
    const signals = aggregateCategorySignals(events);

    expect(signals).toEqual({ local: 8 });
    expect(scoreBriefItem(item(), { categorySignals: signals, now: NOW })).toBe(28);
  });

  it('adds the locked trust, urgency, freshness, and locality weights', () => {
    const score = scoreBriefItem(item({ verified: true, urgency: 'urgent', city: 'Woodmere' }), {
      primaryNetwork: { cityPreset: 'Five Towns', neighborhoods: ['Woodmere'] },
      now: NOW,
    });

    expect(score).toBe(15);
  });

  it('always ranks emergency and safety content above normal content', () => {
    const emergency = scoreBriefItem(item({ id: 'alert', post_subtype: 'alert' }), {
      selectedCategoryIds: [],
      now: NOW,
    });
    const highlyPreferred = scoreBriefItem(item({ id: 'normal' }), {
      selectedCategoryIds: ['local'],
      categorySignals: { local: 100 },
      now: NOW,
    });

    expect(emergency).toBeGreaterThan(highlyPreferred);
  });

  it('returns no more than three distinct ranked items', () => {
    const ranked = rankBriefItems({
      items: [
        item({ id: 'one' }),
        item({ id: 'one', title: 'Duplicate row' }),
        item({ id: 'two', category_id: 'events', type: 'event' }),
        item({ id: 'three', category_id: 'helping', type: 'help' }),
        item({ id: 'four', category_id: 'minyanim', body: 'Minyan tonight' }),
      ],
      selectedCategoryIds: ['local'],
      now: NOW,
    });

    expect(ranked).toHaveLength(3);
    expect(new Set(ranked.map(({ id }) => id)).size).toBe(3);
  });

  it('uses show_less as the only negative category event', () => {
    const signals = aggregateCategorySignals([
      { event_type: 'category_open', metadata: { category_id: 'events' } },
      { event_type: 'reply', metadata: { category_id: 'events' } },
      { event_type: 'show_less', metadata: { category_id: 'events' } },
      { event_type: 'dislike', metadata: { category_id: 'events' } },
    ]);

    expect(signals).toEqual({ events: 1 });
  });

  it('ignores unknown category IDs and private metadata fields', () => {
    const signals = aggregateCategorySignals([
      { event_type: 'save', metadata: { category_id: 'unknown' } },
      {
        event_type: 'category_open',
        metadata: {
          message_body: 'minyan and kosher restaurant',
          private_help_category: 'helping',
        },
      },
    ]);

    expect(signals).toEqual({});
  });

  it('classifies public post types and text into canonical categories', () => {
    expect(classifyBriefCategory(item({ category_id: null, type: 'help' }))).toBe('helping');
    expect(classifyBriefCategory(item({ category_id: null, type: 'event' }))).toBe('events');
    expect(classifyBriefCategory(item({ category_id: 'minyanim' }))).toBe('minyanim');
    expect(classifyBriefCategory(item({ category_id: null, body: 'Pickup basketball tonight' }))).toBe('sports_social');
  });
});
