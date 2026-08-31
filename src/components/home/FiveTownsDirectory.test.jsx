import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FiveTownsDirectory from './FiveTownsDirectory';
import DirectoryListingCard from './DirectoryListingCard';

describe('FiveTownsDirectory', () => {
  it('renders all eight groups and useful search language', () => {
    const html = renderToStaticMarkup(<FiveTownsDirectory />);
    expect(html).toContain('Search the Five Towns');
    expect(html).toContain('Dinner tonight');
    expect(html).toContain('Kids');
    expect(html).toContain('Coffee');
    expect(html).toContain('Shabbat shopping');
    expect(html).toContain('Good starting points');
    expect(html).toContain('Jewish life');
    expect(html).toContain('Shuls, minyanim, mikvahs, eruvs, and learning');
    expect(html).toContain('Food');
    expect(html).toContain('Family');
    expect(html).toContain('Shopping');
    expect(html).toContain('Health');
    expect(html).toContain('Services');
    expect(html).toContain('Community');
    expect(html).toContain('Things to do');
    expect(html).toContain('sourced places');
    expect(html).not.toContain('verified options');
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

  it('adds useful sourced discovery to a category without removing filters or actions', () => {
    const html = renderToStaticMarkup(<FiveTownsDirectory initialGroupId="food" />);
    expect(html).toContain('Good for dinner');
    expect(html).toContain('Coffee and a seat');
    expect(html).toContain('Shabbat shopping');
    expect(html).toContain('Restaurants');
    expect(html).toContain('Bakeries');
    expect(html).toContain('Groceries');
    expect(html).toContain('All towns');
    expect(html).toContain('Google');
    expect(html).toContain('Apple');
    expect(html).toContain('Waze');
    expect(html).toContain('Source');
    expect(html).toContain('Report a correction');
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

  it('can open directly to a selected sourced listing', () => {
    const html = renderToStaticMarkup(<FiveTownsDirectory initialListingId="activity-grant-park" />);
    expect(html).toContain('Grant Park');
    expect(html).toContain('Playgrounds, courts, walking paths');
    expect(html).toContain('Checked information');
  });
});
