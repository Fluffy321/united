import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildAutomatedPost,
  selectAutoPublishCandidates,
} from './local-update-policy.js';

const now = new Date('2026-08-25T18:00:00.000Z');

function item(overrides = {}) {
  return {
    id: 'item-1',
    title: 'Central Avenue road work begins tomorrow',
    short_description: 'The village published the updated work schedule.',
    source_name: 'Village of Cedarhurst',
    source_url: 'https://www.cedarhurst.gov/road-work',
    source_published_at: '2026-08-25T15:00:00.000Z',
    category: 'Town Updates',
    raw_payload: { parser: 'rss' },
    ...overrides,
  };
}

describe('Five Towns automatic publication policy', () => {
  it('allows the server-only ingestion client through the official-post database guard', () => {
    const migration = readFileSync(
      new URL('../../migrations/20260826030543_five_towns_live_information.sql', import.meta.url),
      'utf8',
    );

    expect(migration).toContain("auth.jwt() ->> 'role' = 'service_role'");
  });

  it('selects at most four newly inserted items that are no more than seven days old', () => {
    const candidates = selectAutoPublishCandidates([
      item({ id: 'newest', source_published_at: '2026-08-25T17:00:00.000Z' }),
      item({ id: 'second', source_published_at: '2026-08-25T16:00:00.000Z' }),
      item({ id: 'third', source_published_at: '2026-08-25T15:00:00.000Z' }),
      item({ id: 'fourth', source_published_at: '2026-08-25T14:00:00.000Z' }),
      item({ id: 'fifth', source_published_at: '2026-08-25T13:00:00.000Z' }),
      item({ id: 'stale', source_published_at: '2026-08-17T17:59:59.000Z' }),
      item({ id: 'undated', source_published_at: null }),
    ], now);

    expect(candidates.map(({ id }) => id)).toEqual(['newest', 'second', 'third', 'fourth']);
  });

  it('builds a verified, sourced Five Towns post without copying raw payload content', () => {
    const post = buildAutomatedPost(
      item({ raw_payload: { parser: 'rss', private_blob: 'must not be copied' } }),
      { id: 'community-1', name: 'Five Towns News & Updates', logo_url: 'https://example.com/logo.png' },
      now,
    );

    expect(post).toMatchObject({
      community_id: 'community-1',
      title: 'Central Avenue road work begins tomorrow',
      type: 'announcement',
      post_type: 'announcement',
      post_kind: 'local_update',
      post_subtype: 'local_update',
      category: 'local',
      is_official: true,
      verified: true,
      trust_status: 'verified_source',
      source_name: 'Village of Cedarhurst',
      source_url: 'https://www.cedarhurst.gov/road-work',
      migrated_from: 'local-update:item-1',
      location_text: 'Five Towns',
      author_name: 'Five Towns News & Updates',
      author_avatar_url: 'https://example.com/logo.png',
      last_verified_at: now.toISOString(),
    });
    expect(post.body).toContain('Source: Village of Cedarhurst');
    expect(post.body).toContain('Category: Town Updates');
    expect(post.body).not.toContain('must not be copied');
  });

  it('uses emergency treatment only for severe, extreme, or immediate NWS alerts', () => {
    const severe = buildAutomatedPost(item({
      category: 'Weather Alerts',
      raw_payload: { parser: 'nws-alerts', severity: 'Severe', urgency: 'Expected' },
    }), { id: 'community-1', name: 'Five Towns' }, now);
    const ordinary = buildAutomatedPost(item({
      category: 'Weather Alerts',
      raw_payload: { parser: 'nws-alerts', severity: 'Moderate', urgency: 'Future' },
    }), { id: 'community-1', name: 'Five Towns' }, now);

    expect(severe).toMatchObject({ post_subtype: 'alert', category: 'safety', urgency: 'emergency' });
    expect(ordinary).toMatchObject({ post_subtype: 'local_update', category: 'local', urgency: null });
  });

  it('routes calendar and Vaad sources into the existing personalized categories', () => {
    const event = buildAutomatedPost(item({ category: 'Community Events' }), { id: 'community-1', name: 'Five Towns' }, now);
    const kosher = buildAutomatedPost(item({ category: 'Kashrus Updates' }), { id: 'community-1', name: 'Five Towns' }, now);

    expect(event).toMatchObject({ post_subtype: 'local_event', category: 'events' });
    expect(kosher).toMatchObject({ post_subtype: 'local_update', category: 'kosher_food' });
  });
});
