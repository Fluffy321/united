import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FiveTownsDirectory from './FiveTownsDirectory';
import DirectoryListingCard from './DirectoryListingCard';

describe('FiveTownsDirectory', () => {
  it('renders all eight groups and useful search language', () => {
    const html = renderToStaticMarkup(<FiveTownsDirectory />);
    expect(html).toContain('Search the Five Towns');
    expect(html).toContain('Jewish life');
    expect(html).toContain('Food');
    expect(html).toContain('Family');
    expect(html).toContain('Shopping');
    expect(html).toContain('Health');
    expect(html).toContain('Services');
    expect(html).toContain('Community');
    expect(html).toContain('Things to do');
  });

  it('shows honest sourcing and correction controls', () => {
    const html = renderToStaticMarkup(<FiveTownsDirectory initialGroupId="food" />);
    expect(html).toContain('Source');
    expect(html).toContain('Report a correction');
    expect(html).toContain('Google');
    expect(html).toContain('Apple');
    expect(html).toContain('Waze');
    expect(html).toContain('Verified kosher');
    expect(html).not.toContain('data-kosher-unverified="true"');
  });

  it('shows official-photo and Why go details when a listing has them', () => {
    const html = renderToStaticMarkup(<DirectoryListingCard listing={{
      id: 'grant-park',
      name: 'Grant Park',
      address: '1625 Broadway, Hewlett, NY 11557',
      town: 'Hewlett',
      sourceUrl: 'https://example.gov/park',
      sourceLabel: 'County parks',
      imageUrl: 'https://example.gov/park.jpg',
      imageSourceUrl: 'https://example.gov/park',
      imageSourceLabel: 'County parks',
      whyGo: 'Playgrounds and paths close to home.',
      tags: ['Kids', 'Free'],
    }} />);

    expect(html).toContain('Playgrounds and paths close to home.');
    expect(html).toContain('Why go');
    expect(html).toContain('Official photo');
  });
});
