import { describe, expect, it } from 'vitest';
import {
  createPublishingDraft,
  toPublishCommand,
  validatePublishingDraft,
} from './publishingDraft';

const userContext = {
  network: 'Five Towns',
  joinedCommunities: [{ id: 'community-1', name: 'Young Israel' }],
};

describe('publishing drafts', () => {
  it('defaults every draft to the user local area without accepting an author id', () => {
    const draft = createPublishingDraft('casual_plan', userContext);

    expect(draft.audience).toEqual({
      scope: 'area',
      network: 'Five Towns',
      communityId: null,
    });
    expect(draft).not.toHaveProperty('authorId');
  });

  it('requires source context for a high-trust local news claim', () => {
    const draft = {
      ...createPublishingDraft('local_news', userContext),
      headline: 'School will close early tomorrow',
      details: 'Dismissal is moving to noon.',
    };

    expect(validatePublishingDraft(draft)).toMatchObject({
      valid: false,
      errors: { source: expect.any(String) },
    });
  });

  it('accepts either a source label or secure source URL for a high-trust claim', () => {
    const draft = {
      ...createPublishingDraft('local_news', userContext),
      headline: 'School will close early tomorrow',
      details: 'Dismissal is moving to noon.',
      sourceName: 'School office email',
    };

    expect(validatePublishingDraft(draft)).toEqual({ valid: true, errors: {} });
  });

  it('requires type-specific event fields', () => {
    const draft = {
      ...createPublishingDraft('event', userContext),
      headline: 'Community barbecue',
      details: 'Families are welcome.',
    };

    expect(validatePublishingDraft(draft).errors).toMatchObject({
      startsAt: expect.any(String),
      location: expect.any(String),
    });
  });

  it('only permits hidden public identity for sensitive Help types', () => {
    const help = createPublishingDraft('help_need', userContext);
    const news = createPublishingDraft('local_news', userContext);

    expect(help.publicAuthorHidden).toBe(false);
    expect(help.allowPublicAuthorHidden).toBe(true);
    expect(news.allowPublicAuthorHidden).toBe(false);
  });

  it('serializes the server command without identity authority', () => {
    const draft = {
      ...createPublishingDraft('help_need', userContext),
      headline: 'Need a ride to an appointment',
      details: 'Thursday afternoon from Woodmere.',
      helpCategory: 'ride',
      publicAuthorHidden: true,
    };

    const command = toPublishCommand(draft, '123e4567-e89b-12d3-a456-426614174000');

    expect(command).toMatchObject({
      submissionKey: '123e4567-e89b-12d3-a456-426614174000',
      publishingType: 'help_need',
      audience: { scope: 'area', network: 'Five Towns', communityId: null },
      privacy: { publicAuthorHidden: true },
    });
    expect(command).not.toHaveProperty('authorId');
    expect(command).not.toHaveProperty('userId');
  });

  it('rejects a community audience that is not in the joined-community list', () => {
    const draft = {
      ...createPublishingDraft('casual_plan', userContext),
      headline: 'Pickup basketball',
      details: 'Tonight at eight.',
      startsAt: '2026-08-19T20:00:00.000Z',
      location: 'Grant Park',
      audience: { scope: 'community', network: 'Five Towns', communityId: 'not-joined' },
    };

    expect(validatePublishingDraft(draft).errors.communityId).toBeTruthy();
  });
});
