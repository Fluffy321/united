import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomeSectionHeading from './HomeSectionHeading';

describe('HomeSectionHeading', () => {
  it('uses the shared eyebrow, title, action, and mobile tap target', () => {
    const html = renderToStaticMarkup(
      <HomeSectionHeading
        eyebrow="Everything Jewish"
        title="Find something"
        action="All listings"
        onAction={() => {}}
        titleId="find-title"
      />,
    );

    expect(html).toContain('Everything Jewish');
    expect(html).toContain('Find something');
    expect(html).toContain('All listings');
    expect(html).toContain('min-h-11');
    expect(html).toContain('id="find-title"');
  });
});
