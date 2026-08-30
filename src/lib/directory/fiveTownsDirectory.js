import directoryData from '@/data/fiveTownsDirectory.json';

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

const TOWNS = ['Cedarhurst', 'Lawrence', 'Woodmere', 'Hewlett', 'Inwood', 'North Woodmere'];

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

export const FIVE_TOWNS_LISTINGS = directoryData.map(normalizeDirectoryListing);

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

export function getDirectoryGroup(groupId) {
  return DIRECTORY_GROUPS.find((group) => group.id === groupId) || null;
}
