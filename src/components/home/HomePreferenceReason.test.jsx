import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomePreferenceReason from './HomePreferenceReason';

describe('HomePreferenceReason', () => {
  it('offers clear permanent controls with a full mobile tap target', () => {
    const html = renderToStaticMarkup(
      <HomePreferenceReason
        reason="You asked for more like this"
        onPreference={() => {}}
      />,
    );

    expect(html).toContain('You asked for more like this');
    expect(html).toContain('More like this');
    expect(html).toContain('Less like this');
    expect(html).toContain('Hide this subject');
    expect(html).toContain('aria-label="Tune this recommendation"');
    expect(html).toContain('min-h-11');
  });

  it('does not invent a recommendation reason', () => {
    const html = renderToStaticMarkup(
      <HomePreferenceReason reason="" onPreference={() => {}} />,
    );

    expect(html).not.toContain('Why you are seeing this');
    expect(html).not.toContain('Because');
  });
});
