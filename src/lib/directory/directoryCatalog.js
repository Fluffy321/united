const SUBMITTED_CATEGORY_MAP = [
  { pattern: /restaurant|food|dining|pizza|cafe|bakery|grocery|cater/i, groupId: 'food', categoryId: 'restaurants' },
  { pattern: /shul|synagogue|minyan|congregation/i, groupId: 'jewish-life', categoryId: 'shuls' },
  { pattern: /mikvah/i, groupId: 'jewish-life', categoryId: 'mikvahs' },
  { pattern: /torah|learning|yeshiva|kollel/i, groupId: 'jewish-life', categoryId: 'torah-learning' },
  { pattern: /school|education/i, groupId: 'family', categoryId: 'schools' },
  { pattern: /camp/i, groupId: 'family', categoryId: 'camps' },
  { pattern: /child|baby|daycare/i, groupId: 'family', categoryId: 'childcare' },
  { pattern: /dent/i, groupId: 'health', categoryId: 'dentists' },
  { pattern: /doctor|medical|physician/i, groupId: 'health', categoryId: 'doctors' },
  { pattern: /therap|mental health/i, groupId: 'health', categoryId: 'therapists' },
  { pattern: /pharmacy/i, groupId: 'health', categoryId: 'pharmacies' },
  { pattern: /health|wellness|beauty/i, groupId: 'health', categoryId: 'wellness' },
  { pattern: /judaica/i, groupId: 'shopping', categoryId: 'judaica' },
  { pattern: /gift/i, groupId: 'shopping', categoryId: 'gifts' },
  { pattern: /flor/i, groupId: 'shopping', categoryId: 'florists' },
  { pattern: /cloth|fashion/i, groupId: 'shopping', categoryId: 'clothing' },
  { pattern: /car|auto|transport/i, groupId: 'services', categoryId: 'car-services' },
  { pattern: /real estate|realt/i, groupId: 'services', categoryId: 'real-estate' },
  { pattern: /law|attorney/i, groupId: 'services', categoryId: 'lawyers' },
  { pattern: /account|bookkeep/i, groupId: 'services', categoryId: 'accountants' },
  { pattern: /home|repair|contract|plumb|electric/i, groupId: 'services', categoryId: 'home-services' },
  { pattern: /chesed|chessed|charity|volunteer/i, groupId: 'community', categoryId: 'chesed' },
  { pattern: /attraction|activity|recreation|gym|fitness/i, groupId: 'things-to-do', categoryId: 'activities' },
];

const MAP_TYPE_BY_CATEGORY = {
  shuls: 'shul',
  minyanim: 'minyan',
  mikvahs: 'mikvah',
  restaurants: 'restaurant',
  groceries: 'grocery',
  bakeries: 'bakery',
  catering: 'restaurant',
  schools: 'school',
  chesed: 'chesed',
  judaica: 'judaica',
  wellness: 'wellness',
  doctors: 'wellness',
  dentists: 'wellness',
  therapists: 'wellness',
};

function clean(value) {
  return String(value || '').trim();
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function submittedCategory(value) {
  const category = clean(value);
  return SUBMITTED_CATEGORY_MAP.find(({ pattern }) => pattern.test(category))
    || { groupId: 'services', categoryId: 'home-services' };
}

function submittedAddress(record) {
  const street = clean(record.address || record.address_line1);
  const localityAlreadyIncluded = clean(record.city)
    && normalizedKeyPart(street).includes(normalizedKeyPart(record.city));
  const statePostal = [record.state, record.postal_code].map(clean).filter(Boolean).join(' ');
  return [
    street,
    record.address_line2,
    localityAlreadyIncluded ? '' : record.city,
    localityAlreadyIncluded ? '' : statePostal,
  ]
    .map(clean)
    .filter(Boolean)
    .join(', ');
}

function normalizedKeyPart(value) {
  return clean(value)
    .toLowerCase()
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\broad\b/g, 'rd')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bny\b/g, '')
    .replace(/\b\d{5}(?:-\d{4})?\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function listingKey(listing) {
  return `${normalizedKeyPart(listing.name)}|${normalizedKeyPart(listing.address)}`;
}

export function normalizeSubmittedBusiness(record = {}) {
  const { groupId, categoryId } = submittedCategory(record.category);
  const listingType = ['physical', 'online', 'service_area'].includes(record.listing_type)
    ? record.listing_type
    : 'physical';
  const address = submittedAddress(record);
  const imageUrl = clean(record.cover_url || record.logo_url);

  return {
    id: `business:${clean(record.id)}`,
    sourceRecordId: clean(record.id),
    name: clean(record.name),
    description: clean(record.description),
    groupId,
    categoryId,
    address,
    town: clean(record.city || record.neighborhood) || 'Five Towns',
    latitude: finiteNumber(record.location_lat),
    longitude: finiteNumber(record.location_lng),
    phone: clean(record.phone),
    website: clean(record.website || record.instagram_url),
    sourceUrl: clean(record.website || record.instagram_url),
    sourceLabel: record.verification_status === 'verified_owner' || record.is_claimed
      ? 'Verified business profile'
      : 'Community-submitted listing',
    imageUrl,
    imageSourceUrl: imageUrl ? clean(record.website || record.instagram_url) : '',
    imageSourceLabel: imageUrl ? 'Business profile' : '',
    whyGo: clean(record.why_go || record.description),
    tags: [record.category, record.neighborhood, record.city].map(clean).filter(Boolean),
    featured: Boolean(record.featured),
    kosher: Boolean(record.kosher_claim || record.kosher_certifying_agency),
    kosherCertifier: clean(record.kosher_certifying_agency),
    kosherSourceUrl: clean(record.kosher_source_url),
    lastChecked: clean(record.updated_date || record.created_date),
    sourceKind: 'submitted',
    listingType,
    verificationStatus: clean(record.verification_status),
    isClaimed: Boolean(record.is_claimed),
    rawSubmittedRecord: record,
  };
}

export function mergeDirectoryListings(trustedListings = [], submittedBusinesses = []) {
  const merged = trustedListings.map((listing) => ({ ...listing }));
  const indexByKey = new Map(merged.map((listing, index) => [listingKey(listing), index]));

  submittedBusinesses
    .filter((record) => record?.status === 'published')
    .map(normalizeSubmittedBusiness)
    .filter((listing) => listing.name)
    .forEach((submitted) => {
      const key = listingKey(submitted);
      const existingIndex = indexByKey.get(key);
      if (existingIndex === undefined) {
        indexByKey.set(key, merged.length);
        merged.push(submitted);
        return;
      }

      const trusted = merged[existingIndex];
      merged[existingIndex] = {
        ...trusted,
        phone: trusted.phone || submitted.phone,
        website: trusted.website || submitted.website,
        imageUrl: trusted.imageUrl || submitted.imageUrl,
        imageSourceUrl: trusted.imageSourceUrl || submitted.imageSourceUrl,
        imageSourceLabel: trusted.imageSourceLabel || submitted.imageSourceLabel,
        sourceRecordId: submitted.sourceRecordId,
        listingType: trusted.listingType || submitted.listingType,
        verificationStatus: submitted.verificationStatus || trusted.verificationStatus,
        isClaimed: Boolean(trusted.isClaimed || submitted.isClaimed),
        rawSubmittedRecord: submitted.rawSubmittedRecord,
      };
    });

  return merged;
}

export function filterDirectoryCatalog(listings = [], filters = {}) {
  const query = clean(filters.query).toLowerCase();
  return listings.filter((listing) => {
    if (filters.groupId && listing.groupId !== filters.groupId) return false;
    if (filters.categoryId && listing.categoryId !== filters.categoryId) return false;
    if (filters.listingType && filters.listingType !== 'all' && listing.listingType !== filters.listingType) return false;
    if (!query) return true;
    const haystack = [
      listing.name,
      listing.description,
      listing.address,
      listing.town,
      listing.groupId,
      listing.categoryId,
      ...(listing.tags || []),
    ].map(clean).join(' ').toLowerCase();
    return haystack.includes(query);
  });
}

export function directoryListingToMapPoint(listing = {}) {
  if (!Number.isFinite(listing.latitude) || !Number.isFinite(listing.longitude)) return null;
  return {
    id: `directory-${listing.id}`,
    listingId: listing.id,
    title: listing.name || 'Directory listing',
    description: listing.description || '',
    type: MAP_TYPE_BY_CATEGORY[listing.categoryId] || 'business',
    location_text: listing.address || listing.town || 'Five Towns',
    location_lat: listing.latitude,
    location_lng: listing.longitude,
    source_url: listing.sourceUrl || '',
    verification: listing.sourceLabel || 'JUnited directory',
    isDirectoryPoint: true,
  };
}
