import { describe, expect, it } from 'vitest';
import {
  FEED_INTENTIONS,
  getFeedIntention,
  resolveComposerKind,
  resolveComposerSubtype,
} from './feedIntentions';

describe('Feed posting intentions', () => {
  it('keeps the five approved labels and composer mappings in order', () => {
    expect(FEED_INTENTIONS.map(({ id, label, composer }) => ({ id, label, composer }))).toEqual([
      { id: 'ask', label: 'Ask', composer: { type: 'feed', subtype: 'question', initialBody: '' } },
      { id: 'share', label: 'Share', composer: { type: 'feed', subtype: 'local_update', initialBody: '' } },
      { id: 'need', label: 'Need', composer: { type: 'help', subtype: 'need_help', initialBody: '' } },
      { id: 'offer', label: 'Offer', composer: { type: 'feed', subtype: 'offer_help', initialBody: 'I can help with…' } },
      { id: 'plan', label: 'Plan', composer: { type: 'event', subtype: 'plan', initialBody: '' } },
    ]);
  });

  it('looks up only known intentions', () => {
    expect(getFeedIntention('offer')).toEqual(expect.objectContaining({ label: 'Offer' }));
    expect(getFeedIntention('unknown')).toBeNull();
  });

  it('resolves Offer and Plan to the correct composer kind and stored subtype', () => {
    expect(resolveComposerKind('feed', 'offer_help')).toBe('offer');
    expect(resolveComposerSubtype('offer', 'offer_help')).toBe('offer_help');
    expect(resolveComposerKind('event', 'plan')).toBe('event');
    expect(resolveComposerSubtype('event', 'plan')).toBe('plan');
    expect(resolveComposerSubtype('ask', 'question')).toBe('question');
  });
});
