import { defaultExpirationIso, getPublishingType } from './publishingTypes';

const HTTPS_URL = /^https:\/\/[^\s]+$/i;

function clean(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function deriveExpiration(draft, type) {
  if (draft.expiresAt) return draft.expiresAt;
  const anchor = draft.endsAt || draft.startsAt || draft.neededBy || draft.pickupAt || draft.dealEndsAt;
  if (!anchor) return null;
  const anchorDate = new Date(anchor);
  if (Number.isNaN(anchorDate.getTime())) return null;
  const extraHours = ['event'].includes(type.id) ? 2 : 24;
  return new Date(anchorDate.getTime() + (extraHours * 60 * 60 * 1000)).toISOString();
}

export function createPublishingDraft(typeId, userContext = {}) {
  const type = getPublishingType(typeId);
  if (!type) throw new Error(`Unsupported publishing type: ${typeId}`);

  const draft = {
    publishingType: type.id,
    headline: '',
    details: '',
    audience: {
      scope: 'area',
      network: clean(userContext.network) || '',
      communityId: null,
    },
    joinedCommunityIds: (userContext.joinedCommunities || []).map((community) => community.id),
    joinedCommunities: (userContext.joinedCommunities || []).map((community) => ({
      id: community.id,
      name: community.name || community.community_name || 'Joined community',
    })),
    sourceName: '',
    sourceUrl: '',
    media: [],
    expiresAt: defaultExpirationIso(type.id),
    publicAuthorHidden: false,
    allowPublicAuthorHidden: type.allowPublicAuthorHidden,
  };

  for (const item of type.fields) {
    if (!(item.id in draft)) draft[item.id] = item.kind === 'boolean' ? false : '';
  }

  return draft;
}

export function validatePublishingDraft(draft) {
  const errors = {};
  const type = getPublishingType(draft?.publishingType);
  if (!type) return { valid: false, errors: { publishingType: 'Choose what you want to publish.' } };

  for (const item of type.fields) {
    const value = clean(draft[item.id]);
    if (item.required && (value === '' || value === null || value === undefined)) {
      errors[item.id] = `${item.label} is required.`;
    }
    if (item.maxLength && typeof value === 'string' && value.length > item.maxLength) {
      errors[item.id] = `${item.label} must be ${item.maxLength} characters or less.`;
    }
    if (item.kind === 'url' && value && !HTTPS_URL.test(value)) {
      errors[item.id] = 'Use a full secure link beginning with https://.';
    }
  }

  if (clean(draft.headline)?.length > 0 && clean(draft.headline).length < 4) {
    errors.headline = 'Make the headline a little clearer.';
  }
  if (clean(draft.details)?.length > 0 && clean(draft.details).length < 4) {
    errors.details = 'Add a little more detail.';
  }
  if (!clean(draft.audience?.network)) errors.network = 'Choose your local area.';
  if (!['area', 'community'].includes(draft.audience?.scope)) errors.audience = 'Choose who should see this.';
  if (draft.audience?.scope === 'community') {
    if (!draft.audience.communityId) errors.communityId = 'Choose a community.';
    else if (!draft.joinedCommunityIds?.includes(draft.audience.communityId)) errors.communityId = 'Choose a community you joined.';
  }
  if (type.sourceRequired && !clean(draft.sourceName) && !clean(draft.sourceUrl)) {
    errors.source = 'Tell people where this update came from.';
  }
  if (clean(draft.sourceUrl) && !HTTPS_URL.test(clean(draft.sourceUrl))) {
    errors.sourceUrl = 'Use a full secure source link beginning with https://.';
  }
  if (draft.publicAuthorHidden && !type.allowPublicAuthorHidden) {
    errors.publicAuthorHidden = 'This kind of post uses your public JUnited identity.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function toPublishCommand(draft, submissionKey) {
  const type = getPublishingType(draft?.publishingType);
  if (!type) throw new Error('Choose a supported publishing type.');
  if (!submissionKey) throw new Error('A submission key is required.');

  const reserved = new Set([
    'publishingType', 'headline', 'details', 'audience', 'joinedCommunityIds', 'joinedCommunities', 'sourceName',
    'sourceUrl', 'media', 'expiresAt', 'publicAuthorHidden', 'allowPublicAuthorHidden',
    'authorId', 'userId', 'createdBy', 'created_by_user_id',
  ]);
  const attributes = {};
  for (const item of type.fields) {
    if (!reserved.has(item.id) && draft[item.id] !== '' && draft[item.id] !== undefined) {
      attributes[item.id] = draft[item.id];
    }
  }

  return {
    submissionKey,
    publishingType: type.id,
    audience: {
      scope: draft.audience.scope,
      network: clean(draft.audience.network),
      communityId: draft.audience.scope === 'community' ? draft.audience.communityId : null,
    },
    content: {
      headline: clean(draft.headline),
      details: clean(draft.details),
      media: Array.isArray(draft.media) ? draft.media : [],
      attributes,
    },
    source: {
      name: clean(draft.sourceName) || null,
      url: clean(draft.sourceUrl) || null,
    },
    privacy: {
      publicAuthorHidden: Boolean(type.allowPublicAuthorHidden && draft.publicAuthorHidden),
    },
    expiresAt: deriveExpiration(draft, type),
  };
}
