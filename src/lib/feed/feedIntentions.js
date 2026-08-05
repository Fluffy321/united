export const FEED_INTENTIONS = [
  {
    id: 'ask',
    label: 'Ask',
    icon: 'CircleHelp',
    ariaLabel: 'Ask your community',
    composer: { type: 'feed', subtype: 'question', initialBody: '' },
  },
  {
    id: 'share',
    label: 'Share',
    icon: 'Send',
    ariaLabel: 'Share with your community',
    composer: { type: 'feed', subtype: 'local_update', initialBody: '' },
  },
  {
    id: 'need',
    label: 'Need',
    icon: 'HandHeart',
    ariaLabel: 'Ask your community for help',
    composer: { type: 'help', subtype: 'need_help', initialBody: '' },
  },
  {
    id: 'offer',
    label: 'Offer',
    icon: 'HeartHandshake',
    ariaLabel: 'Offer help to your community',
    composer: { type: 'feed', subtype: 'offer_help', initialBody: 'I can help with…' },
  },
  {
    id: 'plan',
    label: 'Plan',
    icon: 'CalendarPlus',
    ariaLabel: 'Plan something with your community',
    composer: { type: 'event', subtype: 'plan', initialBody: '' },
  },
];

export function getFeedIntention(intentionId) {
  return FEED_INTENTIONS.find(({ id }) => id === intentionId) || null;
}

export function resolveComposerKind(postType, initialSubtype) {
  if (initialSubtype === 'offer_help') return 'offer';
  if (postType === 'help') return 'help';
  if (postType === 'event' || initialSubtype === 'event') return 'event';
  if (postType === 'job' || postType === 'housing' || postType === 'food' || initialSubtype === 'marketplace') return 'marketplace';
  if (initialSubtype === 'question') return 'ask';
  if (initialSubtype === 'alert') return 'alert';
  if (initialSubtype === 'poll') return 'poll';
  return 'post';
}

export function resolveComposerSubtype(postKind, initialSubtype) {
  if (postKind === 'offer') return 'offer_help';
  if (postKind === 'ask') return 'question';
  if (initialSubtype && resolveComposerKind(
    postKind === 'event' ? 'event' : postKind === 'help' ? 'help' : 'feed',
    initialSubtype
  ) === postKind) return initialSubtype;
  return postKind;
}
