import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FeaturedPlaceCard from './FeaturedPlaceCard';
import UsefulNearbyCard from './UsefulNearbyCard';

describe('Five Towns photo cards', () => {
  it('shows a traceable official photo and editorial Why go guidance', () => {
    const html = renderToStaticMarkup(
      <FeaturedPlaceCard listing={{
        id: 'grant-park',
        name: 'Grant Park',
        town: 'Hewlett',
        groupId: 'things-to-do',
        imageUrl: 'https://example.gov/photo.jpg',
        imageSourceUrl: 'https://example.gov/park',
        imageSourceLabel: 'County parks',
        whyGo: 'Playgrounds, paths, and a seasonal spray area.',
        tags: ['Kids', 'Free'],
      }} />,
    );

    expect(html).toContain('Grant Park');
    expect(html).toContain('Why go');
    expect(html).toContain('Playgrounds, paths, and a seasonal spray area.');
    expect(html).toContain('Official photo');
    expect(html).toContain('Kids');
  });

  it('uses a stable category fallback when no official photo is available', () => {
    const html = renderToStaticMarkup(
      <FeaturedPlaceCard listing={{
        id: 'local-shul',
        name: 'Local shul',
        town: 'Woodmere',
        groupId: 'jewish-life',
        imageUrl: '',
        whyGo: 'Daily minyanim and learning.',
        tags: ['Minyan'],
      }} />,
    );
    expect(html).toContain('Photo coming from an official source');
  });

  it('renders need-based nearby discovery language', () => {
    const html = renderToStaticMarkup(
      <UsefulNearbyCard
        title="Get the kids out"
        detail="Parks, pools, and active plans"
        count={4}
      />,
    );
    expect(html).toContain('Get the kids out');
    expect(html).toContain('4 nearby options');
  });
});
