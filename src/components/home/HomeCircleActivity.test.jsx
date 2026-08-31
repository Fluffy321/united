import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomeCircleActivity from './HomeCircleActivity';

describe('HomeCircleActivity', () => {
  it('renders truthful activity from joined circles without invented status', () => {
    const html = renderToStaticMarkup(<HomeCircleActivity activity={{
      active: [{
        community: { id: 'c1', name: 'Five Towns 20s' },
        post: { id: 'p1', author_name: 'Ari', body: 'Game tonight', created_date: new Date().toISOString() },
        href: '/Communities?community=c1',
      }],
      quiet: [],
    }} />);

    expect(html).toContain('From your circles');
    expect(html).toContain('Five Towns 20s');
    expect(html).toContain('Game tonight');
    expect(html).toContain('aria-label="Open Five Towns 20s"');
    expect(html).toContain('aria-label="Browse all circles"');
    expect(html).toContain('min-h-11');
    expect(html).not.toContain('active now');
    expect(html).not.toContain('people talking');
  });

  it('shows real joined circles when they are quiet and Browse communities when none are joined', () => {
    const quiet = renderToStaticMarkup(<HomeCircleActivity activity={{
      active: [],
      quiet: [{ community: { id: 'c1', name: 'Parents' }, href: '/Communities?community=c1' }],
    }} />);
    expect(quiet).toContain('No new post here yet');
    expect(quiet).toContain('Parents');

    const none = renderToStaticMarkup(<HomeCircleActivity activity={{ active: [], quiet: [] }} />);
    expect(none).toContain('Find people and groups that fit you');
    expect(none).toContain('Browse communities');
  });
});
