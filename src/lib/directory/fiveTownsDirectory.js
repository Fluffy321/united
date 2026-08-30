import directoryData from '@/data/fiveTownsDirectory.json';
import {
  FIVE_TOWNS_ADDITIONAL_LISTINGS,
  FIVE_TOWNS_DIRECTORY_ENRICHMENT,
} from '@/data/fiveTownsDirectoryEnrichment';

export const DIRECTORY_GROUPS = [
  {
    id: 'jewish-life',
    label: 'Jewish life',
    description: 'Shuls, minyanim, mikvahs, eruvs, and learning',
    categories: [
      { id: 'shuls', label: 'Shuls' },
      { id: 'minyanim', label: 'Minyanim' },
      { id: 'mikvahs', label: 'Mikvahs' },
      { id: 'eruvs', label: 'Eruvs' },
      { id: 'torah-learning', label: 'Torah learning' },
    ],
  },
  {
    id: 'food',
    label: 'Food',
    description: 'Kosher restaurants, groceries, bakeries, and catering',
    categories: [
      { id: 'restaurants', label: 'Restaurants' },
      { id: 'groceries', label: 'Groceries' },
      { id: 'bakeries', label: 'Bakeries' },
      { id: 'catering', label: 'Catering' },
    ],
  },
  {
    id: 'family',
    label: 'Family',
    description: 'Schools, camps, childcare, and tutors',
    categories: [
      { id: 'schools', label: 'Schools' },
      { id: 'camps', label: 'Camps' },
      { id: 'childcare', label: 'Childcare' },
      { id: 'tutors', label: 'Tutors' },
    ],
  },
  {
    id: 'shopping',
    label: 'Shopping',
    description: 'Judaica, clothing, gifts, and florists',
    categories: [
      { id: 'judaica', label: 'Judaica' },
      { id: 'clothing', label: 'Clothing' },
      { id: 'gifts', label: 'Gifts' },
      { id: 'florists', label: 'Florists' },
    ],
  },
  {
    id: 'health',
    label: 'Health',
    description: 'Doctors, dentists, therapists, and pharmacies',
    categories: [
      { id: 'doctors', label: 'Doctors' },
      { id: 'dentists', label: 'Dentists' },
      { id: 'therapists', label: 'Therapists' },
      { id: 'pharmacies', label: 'Pharmacies' },
      { id: 'wellness', label: 'Wellness' },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    description: 'Professional, home, real estate, and car services',
    categories: [
      { id: 'lawyers', label: 'Lawyers' },
      { id: 'accountants', label: 'Accountants' },
      { id: 'real-estate', label: 'Real estate' },
      { id: 'home-services', label: 'Home services' },
      { id: 'car-services', label: 'Car services' },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    description: 'Chesed, simcha, and essential community resources',
    categories: [
      { id: 'chesed', label: 'Chesed organizations' },
      { id: 'simcha-services', label: 'Simcha services' },
      { id: 'funeral-resources', label: 'Funeral resources' },
      { id: 'community-organizations', label: 'Community organizations' },
    ],
  },
  {
    id: 'things-to-do',
    label: 'Things to do',
    description: 'Attractions, activities, gyms, and recreation',
    categories: [
      { id: 'attractions', label: 'Attractions' },
      { id: 'activities', label: 'Activities' },
      { id: 'gyms', label: 'Gyms' },
      { id: 'recreation', label: 'Recreation' },
    ],
  },
];

export const DIRECTORY_INTENTS = [
  {
    id: 'dinner-tonight',
    label: 'Dinner tonight',
    groupIds: [],
    categoryIds: ['restaurants'],
    tags: ['Dinner', 'Sit-down', 'Date night', 'Dessert'],
    queryTerms: ['dinner', 'restaurant', 'grill'],
  },
  {
    id: 'kids',
    label: 'Kids',
    groupIds: [],
    categoryIds: ['camps', 'childcare', 'attractions', 'activities', 'recreation'],
    tags: ['Kids', 'Family', 'Pool', 'Sports', 'Outside', 'Playground'],
    queryTerms: ['children', 'kids', 'family', 'playground'],
  },
  {
    id: 'coffee',
    label: 'Coffee',
    groupIds: [],
    categoryIds: [],
    tags: ['Coffee', 'Quiet', 'Meet'],
    queryTerms: ['coffee', 'cafe'],
  },
  {
    id: 'shabbat-shopping',
    label: 'Shabbat shopping',
    groupIds: [],
    categoryIds: ['groceries', 'bakeries', 'judaica', 'florists'],
    tags: ['Shabbat', 'Prepared food', 'Gifts'],
    queryTerms: ['shabbat', 'challah', 'judaica', 'flowers'],
  },
];

const LEGACY_TYPE_MAP = {
  shul: ['jewish-life', 'shuls'],
  restaurant: ['food', 'restaurants'],
  grocery: ['food', 'groceries'],
  bakery: ['food', 'bakeries'],
  school: ['family', 'schools'],
  judaica: ['shopping', 'judaica'],
  wellness: ['health', 'wellness'],
  services: ['community', 'community-organizations'],
};

const LISTING_CATEGORY_OVERRIDES = {
  'service-mikvah-sara-laya': ['jewish-life', 'mikvahs'],
  'service-levi-yitzchak-library': ['jewish-life', 'torah-learning'],
  'service-achiezer': ['community', 'chesed'],
};

const TOWNS = ['North Woodmere', 'Cedarhurst', 'Lawrence', 'Woodmere', 'Hewlett', 'Inwood'];

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function inferTown(address = '') {
  return TOWNS.find((town) => address.toLowerCase().includes(town.toLowerCase())) || 'Five Towns';
}

export function normalizeDirectoryListing(record) {
  const [legacyGroupId, legacyCategoryId] = LISTING_CATEGORY_OVERRIDES[record.id]
    || LEGACY_TYPE_MAP[record.type] || [
    'community',
    'community-organizations',
  ];
  const groupId = record.group_id || legacyGroupId;
  const categoryId = record.category_id || legacyCategoryId;
  const certifiedByVaad = /vaadhakashrus\.org/i.test(record.kosher_source_url || record.source_url || '');
  const imageSourceUrl = isHttpUrl(record.image_source_url) ? record.image_source_url : '';
  const imageUrl = imageSourceUrl && isHttpUrl(record.image_url) ? record.image_url : '';
  const tags = Array.from(new Set(
    (Array.isArray(record.tags) ? record.tags : [])
      .map((tag) => String(tag || '').trim())
      .filter(Boolean),
  ));

  return {
    id: String(record.id),
    name: record.title || '',
    description: record.description || '',
    groupId,
    categoryId,
    address: record.location_text || '',
    town: inferTown(record.location_text),
    latitude: Number.isFinite(record.location_lat) ? record.location_lat : null,
    longitude: Number.isFinite(record.location_lng) ? record.location_lng : null,
    phone: record.phone || '',
    website: record.website || record.source_url || '',
    sourceUrl: record.source_url || '',
    sourceLabel: record.verification || 'Public source',
    imageUrl,
    imageSourceUrl,
    imageSourceLabel: imageUrl ? record.image_source_label || 'Official photo source' : '',
    whyGo: String(record.why_go || '').trim(),
    tags,
    featured: Boolean(record.featured),
    kosher: Boolean(record.kosher || certifiedByVaad),
    kosherCertifier: record.kosher_certifier || (certifiedByVaad ? 'Five Towns & Far Rockaway Vaad Hakashrus' : ''),
    kosherSourceUrl: record.kosher_source_url || (certifiedByVaad ? record.source_url : ''),
    lastChecked: record.last_checked || '',
  };
}

const enrichedDirectoryData = directoryData.map((record) => ({
  ...record,
  ...(FIVE_TOWNS_DIRECTORY_ENRICHMENT[record.id] || {}),
}));

export const FIVE_TOWNS_LISTINGS = [
  ...enrichedDirectoryData,
  ...FIVE_TOWNS_ADDITIONAL_LISTINGS,
].map(normalizeDirectoryListing);

export function featuredDirectoryListings(listings, { groupId, limit = 12 } = {}) {
  return listings
    .filter((listing) => listing.featured && listing.sourceUrl)
    .filter((listing) => !groupId || listing.groupId === groupId)
    .slice(0, limit);
}

export function canShowKosherVerification(listing) {
  return Boolean(listing?.kosher && isHttpUrl(listing?.kosherSourceUrl));
}

export function directoryMapLinks(listing) {
  if (!listing?.address) return {};

  const query = encodeURIComponent(listing.address);
  const name = encodeURIComponent(listing.name || listing.address);
  const coordinateQuery = Number.isFinite(listing.latitude) && Number.isFinite(listing.longitude)
    ? `${listing.latitude},${listing.longitude}`
    : listing.address;

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${query}`,
    apple: `https://maps.apple.com/?q=${name}&address=${query}`,
    waze: `https://www.waze.com/ul?q=${encodeURIComponent(coordinateQuery)}&navigate=yes`,
  };
}

export function filterDirectoryListings(listings, filters = {}) {
  const query = String(filters.query || '').trim().toLowerCase();
  const town = String(filters.town || '').trim().toLowerCase();

  return listings.filter((listing) => {
    if (filters.groupId && listing.groupId !== filters.groupId) return false;
    if (filters.categoryId && listing.categoryId !== filters.categoryId) return false;
    if (town && listing.town.toLowerCase() !== town) return false;
    if (!query) return true;

    const haystack = [
      listing.name,
      listing.description,
      listing.address,
      listing.town,
      listing.groupId,
      listing.categoryId,
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });
}

export function filterListingsByIntent(listings, intentId) {
  const intent = DIRECTORY_INTENTS.find((item) => item.id === intentId);
  if (!intent) return listings;

  const groupIds = new Set(intent.groupIds.map((value) => value.toLowerCase()));
  const categoryIds = new Set(intent.categoryIds.map((value) => value.toLowerCase()));
  const tags = new Set(intent.tags.map((value) => value.toLowerCase()));
  const queryTerms = intent.queryTerms.map((value) => value.toLowerCase());

  return listings.filter((listing) => {
    if (groupIds.has(String(listing.groupId || '').toLowerCase())) return true;
    if (categoryIds.has(String(listing.categoryId || '').toLowerCase())) return true;
    if ((listing.tags || []).some((tag) => tags.has(String(tag).toLowerCase()))) return true;

    const searchable = [listing.name, listing.description, listing.whyGo]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return queryTerms.some((term) => searchable.includes(term));
  });
}

export function getDirectoryGroup(groupId) {
  return DIRECTORY_GROUPS.find((group) => group.id === groupId) || null;
}
