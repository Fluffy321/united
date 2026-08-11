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

  it('suppresses an ordinary hidden category but keeps an emergency and the member\'s own post', () => {
    const model = buildHomePriorityModel({
      items: [
        post({ id: 'ordinary-local', type: 'feed', category_id: 'local', title: 'Road update', deadline_at: null }),
        post({ id: 'emergency-local', type: 'feed', category_id: 'local', urgency: 'emergency', deadline_at: null }),
        post({ id: 'my-local', type: 'feed', category_id: 'local', user_id: 'me', deadline_at: null }),
      ],
      preferences: { category_preferences: { local: 'hide' } },
      currentUserId: 'me',
      now: NOW,
    });

    const visibleIds = [
      ...model.priorities.map(({ id }) => id),
      ...model.categoryLeads.flatMap(({ item }) => item?.id || []),
    ];
    expect(visibleIds).toContain('emergency-local');
    expect(visibleIds).toContain('my-local');
    expect(visibleIds).not.toContain('ordinary-local');
  });

  it('lets explicit More beat bounded learned noise', () => {
    const model = buildHomePriorityModel({
      items: [
        post({ id: 'event', type: 'event', title: 'Community dinner', deadline_at: null }),
        post({ id: 'local', type: 'feed', category_id: 'local', title: 'Road update', deadline_at: null }),
      ],
      preferences: { category_preferences: { events: 'more', local: 'less' } },
      events: Array.from({ length: 20 }, () => ({
        event_type: 'category_open',
        metadata: { category_id: 'local' },
      })),
      now: NOW,
    });

    expect(model.categoryLeads[0].category.id).toBe('events');
  });

  it('truthfully identifies an overnight local update during morning catch-up', () => {
    const morning = new Date(2026, 7, 11, 8, 0, 0);
    const model = buildHomePriorityModel({
      items: [post({
        id: 'overnight-local',
        type: 'feed',
        category_id: 'local',
        title: 'Road closes this morning',
        created_at: new Date(2026, 7, 11, 2, 0, 0).toISOString(),
        deadline_at: null,
      })],
      preferences: { catch_up_windows: ['morning'] },
      engagementLevel: 'active',
      now: morning,
    });

    expect(model.priorities[0].priority_reasons).toContainEqual({
      id: 'morning_catch_up',
      label: 'For this morning',
    });
  });

  it('boosts a near-term plan only during a selected evening catch-up', () => {
    const evening = new Date(2026, 7, 11, 19, 0, 0);
    const plan = post({
      id: 'tonight-plan',
      type: 'event',
      title: 'Community event tonight',
      created_at: new Date(2026, 7, 11, 12, 0, 0).toISOString(),
      deadline_at: null,
      start_at: new Date(2026, 7, 11, 21, 0, 0).toISOString(),
    });
    const selected = buildHomePriorityModel({
      items: [plan],
      preferences: { catch_up_windows: ['evening'] },
      engagementLevel: 'active',
      now: evening,
    });
    const notSelected = buildHomePriorityModel({
      items: [plan],
      preferences: { catch_up_windows: ['morning'] },
      engagementLevel: 'active',
      now: evening,
    });

    expect(selected.priorities[0].priority_reasons).toContainEqual({
      id: 'evening_catch_up',
      label: 'For this evening',
    });
    expect(selected.priorities[0].priority_score - notSelected.priorities[0].priority_score).toBe(20);
  });
});
