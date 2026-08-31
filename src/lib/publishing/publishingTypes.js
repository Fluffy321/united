const HOUR_MS = 60 * 60 * 1000;

const field = (id, label, options = {}) => ({ id, label, ...options });

export const PUBLISHING_GROUPS = [
  { id: 'local', label: 'Local', description: 'News and useful updates around you' },
  { id: 'jewish_life', label: 'Jewish life', description: 'Times, learning, and life-cycle updates' },
  { id: 'plans', label: 'Plans', description: 'Events and things to do together' },
  { id: 'help', label: 'Help', description: 'Ask, offer, ride, return, or volunteer' },
  { id: 'opportunities', label: 'Opportunities', description: 'Jobs, homes, giveaways, and sales' },
  { id: 'businesses_food', label: 'Businesses and food', description: 'Openings, menus, updates, and deals' },
];

const COMMON = [field('headline', 'Headline', { required: true, maxLength: 120 }), field('details', 'Details', { required: true, maxLength: 2000 })];
const EVENT_FIELDS = [
  field('startsAt', 'Starts', { required: true, kind: 'datetime' }),
  field('endsAt', 'Ends', { kind: 'datetime' }),
  field('location', 'Location', { required: true }),
  field('registrationUrl', 'Registration link', { kind: 'url' }),
];

const TYPES = [
  { id: 'local_news', group: 'local', label: 'Local news', destination: 'post', sourceRequired: true, defaultHours: 168 },
  { id: 'urgent_safety', group: 'local', label: 'Urgent or safety alert', destination: 'post', sourceRequired: true, defaultHours: 24, riskTier: 'high' },
  { id: 'weather', group: 'local', label: 'Weather update', destination: 'post', sourceRequired: true, defaultHours: 24 },
  { id: 'road_traffic', group: 'local', label: 'Road or traffic update', destination: 'post', sourceRequired: true, defaultHours: 24 },
  { id: 'school_update', group: 'local', label: 'School update', destination: 'post', sourceRequired: true, defaultHours: 24 },
  { id: 'community_announcement', group: 'local', label: 'Community announcement', destination: 'post', defaultHours: 168 },

  { id: 'minyan_zmanim', group: 'jewish_life', label: 'Minyan or zmanim change', destination: 'post', sourceRequired: true, defaultHours: 24 },
  { id: 'shiur_learning', group: 'jewish_life', label: 'Shiur or learning', destination: 'post', defaultHours: 168 },
  { id: 'simcha', group: 'jewish_life', label: 'Simcha or mazal tov', destination: 'post', defaultHours: 168 },
  { id: 'funeral_shiva_tehillim', group: 'jewish_life', label: 'Funeral, shiva, or Tehillim notice', destination: 'post', sourceRequired: true, defaultHours: 168, riskTier: 'sensitive' },

  { id: 'event', group: 'plans', label: 'Event', destination: 'event', defaultHours: null, fields: EVENT_FIELDS },
  { id: 'casual_plan', group: 'plans', label: 'Casual meetup or plan', destination: 'post', defaultHours: null, fields: EVENT_FIELDS },
  { id: 'youth_activity', group: 'plans', label: 'Youth activity', destination: 'post', defaultHours: null, fields: EVENT_FIELDS, riskTier: 'sensitive' },

  { id: 'help_need', group: 'help', label: 'Help needed', destination: 'help', defaultHours: 168, allowPublicAuthorHidden: true, fields: [field('helpCategory', 'Kind of help', { required: true }), field('neededBy', 'Needed by', { kind: 'datetime' }), field('mapVisible', 'Show approximate area', { kind: 'boolean' })] },
  { id: 'help_offer', group: 'help', label: 'Help offered', destination: 'help', defaultHours: 168, allowPublicAuthorHidden: true, fields: [field('helpCategory', 'Kind of help', { required: true }), field('availableUntil', 'Available until', { kind: 'datetime' }), field('mapVisible', 'Show approximate area', { kind: 'boolean' })] },
  { id: 'ride_carpool', group: 'help', label: 'Ride or carpool', destination: 'help', defaultHours: 168, allowPublicAuthorHidden: true, fields: [field('direction', 'Need or offering?', { required: true }), field('origin', 'From', { required: true }), field('destination', 'To', { required: true }), field('pickupAt', 'Pickup time', { required: true, kind: 'datetime' }), field('seats', 'Seats', { kind: 'number' })] },
  { id: 'lost_found', group: 'help', label: 'Lost and found', destination: 'marketplace', defaultHours: 720, fields: [field('direction', 'Lost or found?', { required: true }), field('location', 'Last seen', { required: true })] },
  { id: 'volunteer', group: 'help', label: 'Volunteer opportunity', destination: 'post', defaultHours: 168, fields: [field('neededBy', 'Needed by', { kind: 'datetime' }), field('location', 'Location')] },

  { id: 'job', group: 'opportunities', label: 'Job', destination: 'marketplace', defaultHours: 720, fields: [field('price', 'Pay or range'), field('location', 'Location')] },
  { id: 'housing', group: 'opportunities', label: 'Housing', destination: 'marketplace', defaultHours: 720, fields: [field('price', 'Price'), field('location', 'Area', { required: true })] },
  { id: 'giveaway', group: 'opportunities', label: 'Giveaway', destination: 'marketplace', defaultHours: 336, fields: [field('condition', 'Condition'), field('pickupOption', 'Pickup')] },
  { id: 'sale', group: 'opportunities', label: 'Item for sale', destination: 'marketplace', defaultHours: 336, fields: [field('price', 'Price', { required: true }), field('condition', 'Condition'), field('pickupOption', 'Pickup')] },

  { id: 'business_opening', group: 'businesses_food', label: 'New business or restaurant', destination: 'business_submission', defaultHours: 336, fields: [field('businessName', 'Business name', { required: true }), field('location', 'Location', { required: true }), field('businessRelationship', 'How do you know?', { required: true })] },
  { id: 'business_update', group: 'businesses_food', label: 'Business update', destination: 'post', defaultHours: 336, fields: [field('businessName', 'Business name', { required: true }), field('location', 'Location'), field('updateCategory', 'Update type', { required: true }), field('businessRelationship', 'How do you know?', { required: true })] },
  { id: 'kosher_menu_update', group: 'businesses_food', label: 'Kosher or menu update', destination: 'post', sourceRequired: true, defaultHours: 336, fields: [field('businessName', 'Business name', { required: true }), field('updateCategory', 'Update type', { required: true }), field('businessRelationship', 'How do you know?', { required: true })] },
  { id: 'local_deal', group: 'businesses_food', label: 'Local deal', destination: 'post', defaultHours: 336, fields: [field('businessName', 'Business name', { required: true }), field('dealEndsAt', 'Deal ends', { kind: 'datetime' })] },
];

export const PUBLISHING_TYPES = TYPES.map((type) => ({
  riskTier: 'normal',
  sourceRequired: false,
  allowPublicAuthorHidden: false,
  fields: [],
  ...type,
  fields: [...COMMON, ...(type.fields || [])],
  expiration: {
    defaultHours: type.defaultHours,
    minHours: 1,
    maxHours: type.id === 'urgent_safety' ? 48 : Math.max(type.defaultHours || 8760, 24),
  },
}));

const TYPE_BY_ID = new Map(PUBLISHING_TYPES.map((type) => [type.id, type]));

export function getPublishingType(typeId) {
  return TYPE_BY_ID.get(typeId) || null;
}

export function getExpirationOptions(typeId) {
  return getPublishingType(typeId)?.expiration || null;
}

export function defaultExpirationIso(typeId, now = new Date()) {
  const type = getPublishingType(typeId);
  if (!type?.expiration.defaultHours) return null;
  return new Date(now.getTime() + (type.expiration.defaultHours * HOUR_MS)).toISOString();
}
