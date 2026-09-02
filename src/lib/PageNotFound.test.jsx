import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PageNotFoundView } from './PageNotFound';

describe('PageNotFoundView', () => {
  it('shows a calm user-facing recovery screen with no internal AI note', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PageNotFoundView pageName="missing-page" />
      </MemoryRouter>,
    );

    expect(html).toContain('We couldn’t find that page');
    expect(html).toContain('Back to Home');
    expect(html).toContain('href="/Feed"');
    expect(html).not.toContain('AI');
    expect(html).not.toContain('Admin Note');
    expect(html).not.toContain('missing-page');
  });
});
