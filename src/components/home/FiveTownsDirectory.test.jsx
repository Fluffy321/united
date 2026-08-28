import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FiveTownsDirectory from './FiveTownsDirectory';

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
});
