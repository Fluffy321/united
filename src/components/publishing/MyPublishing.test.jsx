import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MyPublishing, { publishingStatus } from './MyPublishing';

const item = {
  contentId: 'post-1',
  publishingType: 'local_news',
  headline: 'Road work begins Monday',
  details: 'Central Avenue will have one lane closed.',
  destinationLabel: 'Five Towns Home',
  destinationUrl: '/PostDetail?id=post-1',
  lifecycleStatus: 'active',
  moderationStatus: 'clear',
  expiresAt: '2026-08-24T12:00:00.000Z',
};

describe('MyPublishing', () => {
  it('shows a member what is live and the actions they control', () => {
    const html = renderToStaticMarkup(<MyPublishing items={[item]} onAction={() => {}} />);

    expect(html).toContain('Road work begins Monday');
    expect(html).toContain('Five Towns Home');
    expect(html).toContain('Live');
    expect(html).toContain('Open');
    expect(html).toContain('Edit');
    expect(html).toContain('End');
    expect(html).toContain('Reuse');
    expect(html.match(/min-h-11/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it('explains moderation and lifecycle states in normal words', () => {
    expect(publishingStatus({ moderationStatus: 'temporarily_hidden' })).toEqual({ label: 'Hidden for review', tone: 'red' });
    expect(publishingStatus({ lifecycleStatus: 'expired' })).toEqual({ label: 'Expired', tone: 'slate' });
    expect(publishingStatus({ lifecycleStatus: 'ended' })).toEqual({ label: 'Ended', tone: 'slate' });
    expect(publishingStatus(item)).toEqual({ label: 'Live', tone: 'green' });
  });

  it('shows honest loading, error, and empty states', () => {
    expect(renderToStaticMarkup(<MyPublishing loading items={[]} onAction={() => {}} />)).toContain('Loading your posts');
    expect(renderToStaticMarkup(<MyPublishing error={new Error('offline')} items={[]} onAction={() => {}} />)).toContain('Couldn’t load your posts');
    expect(renderToStaticMarkup(<MyPublishing items={[]} onAction={() => {}} />)).toContain('You haven’t published anything yet');
  });

  it('shows a failed action without hiding the member’s posts', () => {
    const html = renderToStaticMarkup(<MyPublishing items={[item]} actionError="Nothing was changed" onAction={() => {}} />);

    expect(html).toContain('Nothing was changed');
    expect(html).toContain('Road work begins Monday');
  });
});
