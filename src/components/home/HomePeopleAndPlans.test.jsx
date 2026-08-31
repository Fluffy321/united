import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomePeopleAndPlans from './HomePeopleAndPlans';

describe('HomePeopleAndPlans', () => {
  it('keeps real group activity and real plans under one clear heading', () => {
    const html = renderToStaticMarkup(
      <HomePeopleAndPlans
        activity={{
          active: [{
            community: { id: 'c1', name: 'Five Towns 20s' },
            post: { id: 'p1', body: 'Pickup game tonight' },
            href: '/Communities?community=c1',
          }],
          quiet: [],
        }}
        eventWindow={{
          mode: 'tonight',
          items: [{ id: 'e1', title: 'Community shiur', event_time: '8:00 PM' }],
        }}
      />,
    );

    expect(html).toContain('Your community');
    expect(html).toContain('People and plans');
    expect(html).toContain('Five Towns 20s');
    expect(html).toContain('Pickup game tonight');
    expect(html).toContain('Community shiur');
    expect(html.match(/People and plans/g)).toHaveLength(1);
    expect(html).not.toContain('From your circles');
    expect(html).not.toContain('Happening tonight');
  });

  it('uses one compact honest empty state with both next actions', () => {
    const html = renderToStaticMarkup(
      <HomePeopleAndPlans
        activity={{ active: [], quiet: [] }}
        eventWindow={{ mode: 'empty', items: [] }}
      />,
    );

    expect(html).toContain('Nothing new here yet');
    expect(html).toContain('Browse communities');
    expect(html).toContain('Add an event');
    expect(html).not.toContain('No events posted yet');
    expect(html).not.toContain('Find people and groups that fit you');
  });
});
