import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomePriorityStack from './HomePriorityStack';

describe('HomePriorityStack', () => {
  it('renders a dominant first item, compact following item, and true reasons', () => {
    const html = renderToStaticMarkup(
      <HomePriorityStack
        networkLabel="Five Towns"
        engagementLevel="active"
        items={[
          {
            id: '1',
            title: 'One driver can finish today’s meal route',
            category_id: 'helping',
            is_dominant: true,
            priority_reasons: [{ id: 'ends_soon', label: 'Ends in 2h' }],
          },
          {
            id: '2',
            title: 'Oak Street closes tomorrow morning',
            category_id: 'local',
            is_dominant: false,
            priority_reasons: [{ id: 'verified', label: 'Verified' }],
          },
        ]}
      />
    );

    expect(html).toContain('What needs your attention');
    expect(html).toContain('Five Towns pulse');
    expect(html).toContain('Ends in 2h');
    expect(html).toContain('Verified');
    expect(html).toContain('data-priority-variant="dominant"');
    expect(html).toContain('data-priority-variant="compact"');
    expect(html).toContain('aria-label="Open Helping priority: One driver can finish today’s meal route. Ends in 2h"');
  });

  it('renders a calm honest state without fabricated rows', () => {
    const html = renderToStaticMarkup(
      <HomePriorityStack items={[]} networkLabel="Five Towns" />
    );

    expect(html).toContain('Nothing needs immediate attention');
    expect(html).toContain('Browse the live categories below');
    expect(html).not.toContain('0 priorities');
    expect(html).not.toContain('data-priority-variant');
  });

  it('does not render reason chips that were not supplied', () => {
    const html = renderToStaticMarkup(
      <HomePriorityStack
        items={[{
          id: 'plain',
          title: 'A useful local update',
          category_id: 'local',
          is_dominant: false,
          priority_reasons: [],
        }]}
      />
    );

    expect(html).not.toContain('data-priority-reason');
  });
});
