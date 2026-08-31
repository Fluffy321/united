import { describe, expect, it } from 'vitest';
import { buildCircleActivity, buildHomeEventWindow, communityRoute } from './homeActivity';

describe('buildCircleActivity', () => {
  it('shows the newest real post from each joined circle and excludes every unjoined circle', () => {
    const communities = [
      { id: 'joined-1', name: 'Young adults' },
      { id: 'joined-2', name: 'Local parents' },
    ];
    const posts = [
      { id: 'old', community_id: 'joined-1', body: 'Earlier', created_date: '2026-08-30T12:00:00Z' },
      { id: 'second', community_id: 'joined-2', body: 'Second', created_date: '2026-08-31T11:00:00Z' },
      { id: 'new', community_id: 'joined-1', body: 'Newest', created_date: '2026-08-31T12:00:00Z' },
      { id: 'leak', community_id: 'not-joined', body: 'Do not show', created_date: '2026-08-31T13:00:00Z' },
    ];

    expect(buildCircleActivity({ communities, posts }).active.map((item) => item.post.id)).toEqual(['new', 'second']);
  });

  it('returns real joined circles as quiet choices when none has a post', () => {
    const communities = [{ id: 'c1', name: 'Circle one' }];
    expect(buildCircleActivity({ communities, posts: [] })).toEqual({
      active: [],
      quiet: [{ community: communities[0], href: '/Communities?community=c1' }],
    });
  });

  it('uses the registered Communities route and safely encodes its id', () => {
    expect(communityRoute('joined 1')).toBe('/Communities?community=joined%201');
  });
});

describe('buildHomeEventWindow', () => {
  const now = new Date('2026-08-31T22:00:00Z'); // 6 PM in Five Towns

  it('shows tonight first and falls back to the next seven local calendar days', () => {
    const tonight = buildHomeEventWindow({
      now,
      events: [{ id: 'tonight', type: 'event', event_date: '2026-08-31', event_time: '8:00 PM' }],
    });
    expect(tonight).toMatchObject({ mode: 'tonight' });
    expect(tonight.items.map((event) => event.id)).toEqual(['tonight']);

    const upcoming = buildHomeEventWindow({
      now,
      events: [{ id: 'later', type: 'event', event_date: '2026-09-02', event_time: '7:30 PM' }],
    });
    expect(upcoming).toMatchObject({ mode: 'upcoming' });
    expect(upcoming.items.map((event) => event.id)).toEqual(['later']);
  });

  it('excludes an event only when a known end time has passed', () => {
    const result = buildHomeEventWindow({
      now,
      events: [
        { id: 'ended', type: 'event', event_date: '2026-08-31', event_time: '4:00 PM', event_end_time: '5:00 PM' },
        { id: 'unknown-end', type: 'event', event_date: '2026-08-31', event_time: '4:00 PM' },
      ],
    });
    expect(result.items.map((event) => event.id)).toEqual(['unknown-end']);
  });

  it('keeps date-only values on their stated calendar date, sorts by time, and enforces the limit', () => {
    const result = buildHomeEventWindow({
      now,
      limit: 2,
      events: [
        { id: 'late', type: 'event', event_date: '2026-08-31', event_time: '9:00 PM' },
        { id: 'early', type: 'event', event_date: '2026-08-31', event_time: '7:00 PM' },
        { id: 'middle', type: 'event', event_date: '2026-08-31', event_time: '8:00 PM' },
      ],
    });
    expect(result.items.map((event) => event.id)).toEqual(['early', 'middle']);
  });

  it('ignores non-events, past dates, and dates beyond seven days', () => {
    const result = buildHomeEventWindow({
      now,
      events: [
        { id: 'post', type: 'post', event_date: '2026-08-31' },
        { id: 'past', type: 'event', event_date: '2026-08-30' },
        { id: 'far', type: 'event', event_date: '2026-09-08' },
      ],
    });
    expect(result).toEqual({ mode: 'empty', items: [] });
  });
});
