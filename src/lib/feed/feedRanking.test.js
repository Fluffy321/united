import { describe, it, expect } from 'vitest';
import {
  feedBody,
  feedText,
  formatPostAge,
  getEventTimeLabel,
  getPostLivePriority,
  matchesText,
  postDate,
} from './feedRanking';
import { authorColor, communityColor } from './feedColors';

const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();
const minutesFromNow = (m) => new Date(Date.now() + m * 60_000).toISOString();

describe('postDate', () => {
  it('prefers updated_date over created_date', () => {
    expect(postDate({ updated_date: 'u', created_date: 'c' })).toBe('u');
    expect(postDate({ created_date: 'c' })).toBe('c');
    expect(postDate(null)).toBeUndefined();
  });
});

describe('formatPostAge', () => {
  it('handles missing or bad dates without crashing', () => {
    expect(formatPostAge(undefined)).toBe('Just now');
    expect(formatPostAge('not-a-date')).toBe('Just now');
  });

  it('formats minutes, hours, and days', () => {
    expect(formatPostAge(minutesAgo(30))).toBe('30m');
    expect(formatPostAge(minutesAgo(120))).toBe('2h');
    expect(formatPostAge(minutesAgo(60 * 48))).toBe('2d');
  });
});

describe('feedText / feedBody', () => {
  it('falls back to a default when the post is empty', () => {
    expect(feedText({})).toBe('Community update');
    expect(feedText({ title: 'Hello' })).toBe('Hello');
  });

  it('hides the body when it duplicates the title', () => {
    expect(feedBody({ title: 'Same Text', body: 'same text' })).toBe('');
    expect(feedBody({ title: 'Title', body: 'Different body' })).toBe('Different body');
  });
});

describe('getPostLivePriority', () => {
  it('scores urgent help posts above plain discussion posts', () => {
    const help = { type: 'help', title: 'Ride needed tonight', created_date: minutesAgo(10) };
    const chat = { type: 'feed', title: 'Nice weather lately', created_date: minutesAgo(10) };
    expect(getPostLivePriority(help)).toBeGreaterThan(getPostLivePriority(chat));
  });

  it('boosts events starting within 12 hours over far-off events', () => {
    const soon = { type: 'event', title: 'Shiur', event_date: minutesFromNow(60), created_date: minutesAgo(500) };
    const later = { type: 'event', title: 'Shiur', event_date: minutesFromNow(60 * 72), created_date: minutesAgo(500) };
    expect(getPostLivePriority(soon)).toBeGreaterThan(getPostLivePriority(later));
  });
});

describe('getEventTimeLabel', () => {
  it('returns null when there is no usable date', () => {
    expect(getEventTimeLabel({})).toBeNull();
    expect(getEventTimeLabel({ event_date: 'garbage' })).toBeNull();
  });

  it('labels events by how soon they start', () => {
    expect(getEventTimeLabel({ event_date: minutesAgo(5) })).toBe('Happening now');
    expect(getEventTimeLabel({ event_date: minutesFromNow(30) })).toBe('Starts in 30 min');
    expect(getEventTimeLabel({ event_date: minutesFromNow(120) })).toMatch(/^Starts at /);
  });
});

describe('matchesText', () => {
  it('matches across title, body, type, and community name', () => {
    expect(matchesText({ body: 'Anyone driving to JFK?' }, /jfk/i)).toBe(true);
    expect(matchesText({ title: 'Lost keys' }, /ride/)).toBe(false);
  });
});

describe('feedColors', () => {
  it('is deterministic — same input always gets the same color', () => {
    expect(authorColor('abc')).toBe(authorColor('abc'));
    expect(communityColor('xyz')).toBe(communityColor('xyz'));
  });

  it('always returns a valid hex color, even for empty input', () => {
    expect(authorColor('')).toMatch(/^#[0-9A-F]{6}$/i);
    expect(communityColor()).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
