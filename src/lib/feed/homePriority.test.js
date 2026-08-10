import { describe, expect, it } from 'vitest';
import { buildHomePriorityModel } from './homePriority';

const NOW = new Date('2026-08-10T18:00:00.000Z');

const post = (overrides = {}) => ({
  id: 'post-1',
  type: 'help',
  title: 'One driver needed before 4 PM',
  city: 'Cedarhurst',
  created_at: '2026-08-10T16:00:00.000Z',
  deadline_at: '2026-08-10T20:00:00.000Z',
  status: 'open',
  ...overrides,
});

describe('buildHomePriorityModel', () => {
  it('makes a nearby unfilled deadline need dominant and explains why', () => {
    const model = buildHomePriorityModel({
      items: [post()],
      primaryNetwork: { cityPreset: 'Cedarhurst', shortLabel: 'Five Towns' },
      engagementLevel: 'active',
      now: NOW,
    });

    expect(model.priorities[0]).toMatchObject({
      id: 'post-1',
      category_id: 'helping',
      is_dominant: true,
    });
    expect(model.priorities[0].priority_reasons.map(({ id }) => id)).toEqual(
      expect.arrayContaining(['ends_soon', 'nearby'])
    );
  });

  it('suppresses expired, filled, unavailable, blocked, reported, and duplicate items', () => {
    const model = buildHomePriorityModel({
      items: [
        post({ id: 'expired', expires_at: '2026-08-10T17:00:00.000Z' }),
        post({ id: 'filled', status: 'filled' }),
        post({ id: 'sold', type: 'marketplace', listing_status: 'sold' }),
        post({ id: 'blocked', user_id: 'blocked-user' }),
        post({ id: 'reported', reported: true }),
        post({ id: 'valid' }),
        post({ id: 'valid' }),
      ],
      blockedUserIds: ['blocked-user'],
      now: NOW,
    });

    expect(model.priorities.map(({ id }) => id)).toEqual(['valid']);
  });

  it('keeps quiet mode calm when an item is fresh but not essential or personal', () => {
    const model = buildHomePriorityModel({
      items: [post({
        id: 'ordinary-post',
        type: 'feed',
        title: 'A general neighborhood thought',
        status: null,
        deadline_at: null,
      })],
      engagementLevel: 'quiet',
      now: NOW,
    });

    expect(model.priorities).toEqual([]);
    expect(model.categoryLeads.find(({ category }) => category.id === 'local').item?.id).toBe('ordinary-post');
  });

  it('keeps an ordinary item in its category instead of presenting it as an unexplained priority', () => {
    const model = buildHomePriorityModel({
      items: [post({
        id: 'ordinary-balanced-post',
        type: 'feed',
        title: 'A general neighborhood thought',
        status: null,
        deadline_at: null,
      })],
      engagementLevel: 'balanced',
      now: NOW,
    });

    expect(model.priorities).toEqual([]);
    expect(model.categoryLeads.find(({ category }) => category.id === 'local').item?.id).toBe('ordinary-balanced-post');
  });

  it('uses stable tie breaking and does not repeat a priority as its category lead', () => {
    const model = buildHomePriorityModel({
      items: [
        post({ id: 'b', deadline_at: null }),
        post({ id: 'a', deadline_at: null }),
        post({ id: 'urgent' }),
      ],
      engagementLevel: 'quiet',
      now: NOW,
    });

    expect(model.priorities.map(({ id }) => id)).toEqual(['urgent']);
    expect(model.categoryLeads.find(({ category }) => category.id === 'helping').item?.id).toBe('a');
  });

  it('prioritizes emergency alerts and personal unread replies with true reasons', () => {
    const model = buildHomePriorityModel({
      items: [
        post({ id: 'mine', type: 'feed', user_id: 'me', deadline_at: null, unread_reply_count: 4 }),
        post({ id: 'alert', type: 'feed', post_subtype: 'alert', deadline_at: null, verified: true }),
      ],
      currentUserId: 'me',
      engagementLevel: 'active',
      now: NOW,
    });

    expect(model.priorities[0].id).toBe('alert');
    expect(model.priorities[0].priority_reasons.map(({ id }) => id)).toContain('emergency');
    expect(model.priorities[1].priority_reasons.map(({ id }) => id)).toEqual(['yours', 'new_replies']);
  });
});
