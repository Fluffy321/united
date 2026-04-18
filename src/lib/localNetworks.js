// Central config for all supported local networks / cities
// Used across Feed, UserSettings, onboarding, etc.

export const LOCAL_NETWORKS = [
  {
    id: 'five_towns',
    label: 'Five Towns, NY',
    shortLabel: 'Five Towns',
    emoji: '🏘️',
    region: 'New York',
    neighborhoods: ['Lawrence', 'Woodmere', 'Cedarhurst', 'Hewlett', 'Inwood'],
    center: { lat: 40.6237, lng: -73.7257 },
    cityPreset: 'Five Towns',
  },
  {
    id: 'brooklyn',
    label: 'Brooklyn, NY',
    shortLabel: 'Brooklyn',
    emoji: '🌉',
    region: 'New York',
    neighborhoods: ['Borough Park', 'Flatbush', 'Crown Heights', 'Williamsburg'],
    center: { lat: 40.6501, lng: -73.9496 },
    cityPreset: 'Brooklyn',
  },
  {
    id: 'lakewood',
    label: 'Lakewood, NJ',
    shortLabel: 'Lakewood',
    emoji: '🌲',
    region: 'New Jersey',
    neighborhoods: ['Lakewood'],
    center: { lat: 40.0979, lng: -74.2179 },
    cityPreset: 'Lakewood',
  },
  {
    id: 'miami',
    label: 'Miami / South Florida',
    shortLabel: 'Miami',
    emoji: '🌴',
    region: 'Florida',
    neighborhoods: ['Miami Beach', 'Aventura', 'Sunny Isles', 'Bal Harbour', 'Surfside'],
    center: { lat: 25.7617, lng: -80.1918 },
    cityPreset: 'Miami',
  },
  {
    id: 'boca_raton',
    label: 'Boca Raton, FL',
    shortLabel: 'Boca Raton',
    emoji: '☀️',
    region: 'Florida',
    neighborhoods: ['Boca Raton', 'Delray Beach', 'Boynton Beach'],
    center: { lat: 26.3683, lng: -80.1289 },
    cityPreset: 'Boca Raton',
  },
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