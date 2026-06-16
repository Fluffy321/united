// Central config for the local network / towns JUnited currently supports.
// Keep this focused on the Five Towns until the product is ready to expand.

export const FIVE_TOWNS_NEIGHBORHOODS = ['Lawrence', 'Woodmere', 'Cedarhurst', 'Hewlett', 'Inwood'];

const FIVE_TOWNS_CENTERS = {
  Lawrence: { lat: 40.6157, lng: -73.7296 },
  Woodmere: { lat: 40.6321, lng: -73.7126 },
  Cedarhurst: { lat: 40.6229, lng: -73.7243 },
  Hewlett: { lat: 40.6432, lng: -73.6957 },
  Inwood: { lat: 40.6220, lng: -73.7468 },
};

export const LOCAL_NETWORKS = [
  {
    id: 'five_towns',
    label: 'Five Towns, NY',
    shortLabel: 'Five Towns',
    emoji: '🏘️',
    region: 'Five Towns',
    neighborhoods: FIVE_TOWNS_NEIGHBORHOODS,
    center: { lat: 40.6237, lng: -73.7257 },
    cityPreset: 'Five Towns',
  },
  ...FIVE_TOWNS_NEIGHBORHOODS.map((town) => ({
    id: town.toLowerCase(),
    label: `${town}, NY`,
    shortLabel: town,
    emoji: '📍',
    region: 'Five Towns',
    neighborhoods: [town],
    center: FIVE_TOWNS_CENTERS[town],
    cityPreset: town,
  })),
];

export const ALL_CITY_PRESETS = LOCAL_NETWORKS.map(n => n.cityPreset);

export function getNetworkByPreset(cityPreset) {
  return LOCAL_NETWORKS.find(n => n.cityPreset === cityPreset) || LOCAL_NETWORKS[0];
}

export function getNetworkById(id) {
  return LOCAL_NETWORKS.find(n => n.id === id) || LOCAL_NETWORKS[0];
}

// Match a post's city/location_text to a network
export function matchPostNetwork(post) {
  const text = ((post.city || '') + ' ' + (post.location_text || '')).toLowerCase();
  return LOCAL_NETWORKS.find(n =>
    n.cityPreset.toLowerCase().split(' ').some(word => text.includes(word)) ||
    n.neighborhoods.some(nb => text.includes(nb.toLowerCase()))
  );
}
