import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FiveTownsBrief, { buildBriefingItems, findUrgentNeed } from './FiveTownsBrief';

describe('Daily Brief data contract', () => {
  it('gives editor-published updates precedence without inventing more items', () => {
    const items = buildBriefingItems({
      brief: {
        topLocalUpdates: [
          { id: 'curated-1', title: 'The eruv inspection is complete', source_label: 'Community desk' },
        ],
      },
      posts: [
        { id: 'post-1', type: 'news', title: 'A feed update', community_name: 'Lawrence' },
      ],
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: 'curated-1',
        title: 'The eruv inspection is complete',
        label: 'Community desk',
        provenance: 'editor',
      }),
    ]);
  });

  it('uses only useful real feed posts when no editor brief exists', () => {
    const items = buildBriefingItems({
      brief: null,
      posts: [
        { id: 'question-1', type: 'question', title: 'Who repairs a stroller?', community_name: 'Woodmere' },
        { id: 'event-1', type: 'event', title: 'Community blood drive', community_name: 'Hewlett' },
        { id: 'noise-1', type: 'daily_greeting', title: 'Good morning' },
      ],
    });

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual(expect.objectContaining({ id: 'question-1', label: 'Woodmere', provenance: 'feed' }));
    expect(items[1]).toEqual(expect.objectContaining({ id: 'event-1', label: 'Hewlett', provenance: 'feed' }));
    expect(buildBriefingItems({ brief: null, posts: [] })).toEqual([]);
  });

  it('selects only a real need with a future deadline inside two hours', () => {
    const now = new Date('2026-07-31T14:00:00.000Z');
    const urgent = { id: 'need-now', type: 'help', title: 'Ride needed', expires_at: '2026-07-31T15:15:00.000Z' };
    const later = { id: 'need-later', type: 'help', title: 'Meal train', expires_at: '2026-08-01T14:00:00.000Z' };

    expect(findUrgentNeed([later, urgent], now)).toBe(urgent);
    expect(findUrgentNeed([later], now)).toBeNull();
    expect(findUrgentNeed([], now)).toBeNull();
  });
});

describe('Daily Brief summary', () => {
  it('keeps the briefing visible and progressively discloses mitzvah and exploration', () => {
    const html = renderToStaticMarkup(
      <FiveTownsBrief
        networkLabel="Woodmere"
        brief={{ topLocalUpdates: [] }}
        posts={[]}
        currentUser={null}
        onOpenMap={() => {}}
        onCreate={() => {}}
      />
    );

    expect(html).toContain('What matters today');
    expect(html).toContain('Woodmere');
    expect(html).toContain('Today’s mitzvah');
    expect(html).toContain('Explore today');
    expect(html).toContain('Nothing has been pinned yet');
    expect(html).toContain('aria-expanded="false"');
  });

  it('does not render legacy carousel controls or fabricated activity', () => {
    const html = renderToStaticMarkup(
      <FiveTownsBrief brief={null} posts={[]} currentUser={null} onCreate={() => {}} />
    );

    expect(html).not.toContain('Previous slide');
    expect(html).not.toContain('Community progress');
    expect(html).not.toContain('Schwartz family');
    expect(html).not.toContain('Mrs. Cohen');
    expect(html).not.toContain('Hatzalah fundraiser');
    expect(html).not.toContain('meal requests open');
  });
});
