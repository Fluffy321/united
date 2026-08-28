import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FiveTownsHomeDashboard from './FiveTownsHomeDashboard';

describe('FiveTownsHomeDashboard', () => {
  it('renders the approved complete dashboard hierarchy', () => {
    const html = renderToStaticMarkup(
      <FiveTownsHomeDashboard
        currentUser={{ first_name: 'Aryeh' }}
        posts={[]}
        communityGroups={[]}
      />,
    );

    expect(html).toContain('Everything local, without the noise.');
    expect(html).toContain('Find food, shuls, schools, shops, anything');
    expect(html).toContain('Jewish directory');
    expect(html).toContain('Picked for Aryeh');
    expect(html).toContain('Places worth knowing');
    expect(html).toContain('Your city today');
    expect(html).toContain('People and groups');
    expect(html).toContain('Jewish life');
    expect(html).toContain('Opportunities');
    expect(html).toContain('Help nearby');
    expect(html).toContain('Complete Jewish directory');
  });

  it('does not invent activity when there are no real posts or groups', () => {
    const html = renderToStaticMarkup(
      <FiveTownsHomeDashboard posts={[]} communityGroups={[]} />,
    );

    expect(html).toContain('No new local updates right now');
    expect(html).toContain('Browse communities');
    expect(html).not.toContain('people interested');
    expect(html).not.toContain('HAPPENING TONIGHT');
    expect(html).not.toContain('random ride');
  });
});
