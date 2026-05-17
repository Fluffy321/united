import { storageService } from '@/services/storageService';

const STORAGE_KEY = 'junited_candle_location';

// { type: 'gps' | 'manual' | 'default' | 'declined', lat, lng, label, tzid }

export const DEFAULT_LOCATION = {
  type: 'default',
  lat: 40.6157,
  lng: -73.7296,
  label: 'Five Towns, NY',
  tzid: 'America/New_York',
};

export const PRESET_LOCATIONS = [
  { label: 'Five Towns, NY',    lat: 40.6157, lng: -73.7296, tzid: 'America/New_York' },
  { label: 'Brooklyn, NY',      lat: 40.6501, lng: -73.9496, tzid: 'America/New_York' },
  { label: 'Monsey, NY',        lat: 41.1112, lng: -74.0687, tzid: 'America/New_York' },
  { label: 'Teaneck, NJ',       lat: 40.8918, lng: -74.0143, tzid: 'America/New_York' },
  { label: 'Lakewood, NJ',      lat: 40.0979, lng: -74.2179, tzid: 'America/New_York' },
  { label: 'Baltimore, MD',     lat: 39.3521, lng: -76.6122, tzid: 'America/New_York' },
  { label: 'Boca Raton, FL',    lat: 26.3683, lng: -80.1289, tzid: 'America/New_York' },
  { label: 'Chicago, IL',       lat: 41.9742, lng: -87.6680, tzid: 'America/Chicago' },
  { label: 'Los Angeles, CA',   lat: 34.0195, lng: -118.4912, tzid: 'America/Los_Angeles' },
];

export function getBrowserTzid() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
}

export function getStoredCandleLocation() {
  return storageService.getJson(STORAGE_KEY, null);
}

export function setCandleLocation(pref) {
  storageService.setJson(STORAGE_KEY, pref);
}

export function clearCandleLocation() {
  storageService.removeItem(STORAGE_KEY);
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'JUnited App (junited.us)' } }
    );
    if (!res.ok) return 'your location';
    const data = await res.json();
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || '';
    const state = addr.state || '';
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    return 'your location';
  } catch {
    return 'your location';
  }
}

export async function forwardGeocode(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'JUnited App (junited.us)' } }
    );
    if (!res.ok) return [];
    const results = await res.json();
    return results.map((r) => {
      const addr = r.address || {};
      const city = addr.city || addr.town || addr.village || '';
      const state = addr.state || '';
      const label = city && state ? `${city}, ${state}` : city || r.display_name;
      return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), label };
    });
  } catch {
    return [];
  }
}

export function requestGPSLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      const err = new Error('Geolocation not supported');
      err.code = 0;
      reject(err);
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      maximumAge: 300000,
    });
  });
}
