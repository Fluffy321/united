import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createPublishingDraft } from '@/lib/publishing/publishingDraft';
import { PublishView } from './Publish';

const context = {
  network: 'Five Towns',
  joinedCommunities: [{ id: 'community-1', name: 'Young Israel' }],
};

const renderView = (props = {}) => renderToStaticMarkup(
  <PublishView
    step="choose"
    draft={null}
    expandedGroup="local"
    status="idle"
    errors={{}}
    onAction={() => {}}
    {...props}
  />
);

describe('PublishView', () => {
  it('opens with six simple publishing groups and no search chore', () => {
    const html = renderView();

    expect(html.match(/data-publishing-group=/g)).toHaveLength(6);
    expect(html).toContain('What are you sharing?');
    expect(html).not.toContain('Search publishing types');
  });

  it('shows every local choice inside the expanded Local group', () => {
    const html = renderView();

    for (const label of ['Local news', 'Urgent or safety alert', 'Weather update', 'Road or traffic update', 'School update', 'Community announcement']) {
      expect(html).toContain(label);
    }
  });

  it('uses the local area by default and presents joined communities as optional', () => {
    const draft = createPublishingDraft('casual_plan', context);
    const html = renderView({ step: 'details', draft });

    expect(html).toContain('Five Towns');
    expect(html).toContain('Local area');
    expect(html).toContain('Optional community');
    expect(html).toContain('Young Israel');
  });

  it('shows focused fields instead of every possible field', () => {
    const draft = createPublishingDraft('help_need', context);
    const html = renderView({ step: 'details', draft });

    expect(html).toContain('Kind of help');
    expect(html).toContain('Needed by');
    expect(html).toContain('Hide my name from the public');
    expect(html).not.toContain('Registration link');
    expect(html).not.toContain('Business name');
  });

  it('makes immediate publication explicit on preview', () => {
    const draft = {
      ...createPublishingDraft('community_announcement', context),
      headline: 'Eruv inspection is complete',
      details: 'The regular route was checked this afternoon.',
    };
    const html = renderView({ step: 'preview', draft });

    expect(html).toContain('Preview');
    expect(html).toContain('Publishes now');
    expect(html).toContain('Publish now');
  });

  it('shows useful next actions after success', () => {
    const html = renderView({
      step: 'done',
      result: { destinationUrl: '/PostDetail?id=post-1' },
    });

    expect(html).toContain('Published');
    expect(html).toContain('View post');
    expect(html).toContain('Post another');
  });

  it('keeps the draft visible when publishing fails', () => {
    const draft = {
      ...createPublishingDraft('community_announcement', context),
      headline: 'Eruv inspection is complete',
      details: 'The regular route was checked this afternoon.',
    };
    const html = renderView({ step: 'preview', draft, status: 'error' });

    expect(html).toContain('We couldn’t publish that. Your draft is still here.');
    expect(html).toContain('Eruv inspection is complete');
  });
});
