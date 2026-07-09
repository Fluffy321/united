import { divIcon } from 'leaflet';
import { COMMUNITIES_ENABLED } from '@/config/features';

export const createClusterIcon = (cluster) => divIcon({
  className: 'junited-cluster-icon',
  html: `<div style="
    display:flex;align-items:center;justify-content:center;
    width:34px;height:34px;border-radius:9999px;
    background:#0f172a;color:#fff;font-weight:800;font-size:12px;
    border:3px solid #fff;box-shadow:0 6px 16px rgba(15,23,42,0.35);
  ">${cluster.getChildCount()}</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export const PIN_TYPES = {
  shul: { label: 'Shuls', color: '#4f46e5', short: 'S' },
  school: { label: 'Schools / Yeshivas', color: '#0ea5e9', short: 'SC' },
  restaurant: { label: 'Restaurants', color: '#f97316', short: 'R' },
  grocery: { label: 'Grocery', color: '#16a34a', short: 'G' },
  bakery: { label: 'Bakery', color: '#d97706', short: 'B' },
  judaica: { label: 'Judaica', color: '#2563eb', short: 'J' },
  business: { label: 'Businesses', color: '#0f766e', short: '$' },
  services: { label: 'Services', color: '#0891b2', short: 'SV' },
  wellness: { label: 'Wellness', color: '#be123c', short: 'W' },
  lost_found: { label: 'Lost & Found', color: '#9333ea', short: 'L' },
  help_needed: { label: 'Help Needed', color: '#dc2626', short: 'H' },
  mitzvah_available: { label: 'Mitzvahs Available', color: '#16a34a', short: 'M' },
  event: { label: 'Events', color: '#0891b2', short: 'E' },
  ...(COMMUNITIES_ENABLED ? { community_post: { label: 'My Communities', color: '#0f5ed7', short: 'C' } } : {}),
  other: { label: 'Other', color: '#64748b', short: 'O' },
};

export const PRIMARY_FILTERS = [
  { key: 'shuls', label: 'Shuls', types: ['shul'] },
  { key: 'restaurants', label: 'Restaurants', types: ['restaurant'] },
  { key: 'kosher_food', label: 'Kosher Food', types: ['restaurant', 'grocery', 'bakery'] },
  { key: 'businesses', label: 'Businesses', types: ['judaica', 'business', 'services', 'wellness'] },
  { key: 'schools_yeshivas', label: 'Schools / Yeshivas', types: ['school'] },
  { key: 'mitzvot', label: 'Mitzvot', types: ['help_needed', 'mitzvah_available', 'lost_found'] },
];

export const DIRECTORY_LAST_REVIEWED = 'June 2026';

export function getDistanceMiles(from, to) {
  if (!from || !to?.location_lat || !to?.location_lng) return null;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(to.location_lat - from.lat);
  const dLng = toRadians(to.location_lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.location_lat);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(distance) {
  if (distance === null || !Number.isFinite(distance)) return null;
  if (distance < 0.1) return 'Less than 0.1 mi away';
  if (distance < 10) return `${distance.toFixed(1)} mi away`;
  return `${Math.round(distance)} mi away`;
}

export function getMapLinks(point, userLocation) {
  if (!point) return null;
  const lat = point.location_lat;
  const lng = point.location_lng;
  if (!lat || !lng) return null;
  const label = encodeURIComponent(point.title || point.location_text || 'JUnited map pin');
  const hasStreetAddress = /^\d/.test(point.location_text || '');
  const destinationText = hasStreetAddress
    ? `${point.location_text}, NY`
    : `${lat},${lng}`;
  const destination = encodeURIComponent(destinationText);
  const query = encodeURIComponent(`${point.title || point.location_text || 'JUnited map pin'} ${point.location_text || ''}`.trim());
  const origin = userLocation?.lat && userLocation?.lng
    ? `&origin=${userLocation.lat},${userLocation.lng}`
    : '';
  const appleStart = userLocation?.lat && userLocation?.lng
    ? `saddr=${userLocation.lat},${userLocation.lng}&`
    : '';

  return {
    google: `https://www.google.com/maps/dir/?api=1${origin}&destination=${destination}&travelmode=driving`,
    apple: `https://maps.apple.com/?${appleStart}daddr=${destination}&q=${label}&dirflg=d`,
    waze: hasStreetAddress
      ? `https://waze.com/ul?q=${destination}&navigate=yes`
      : `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&q=${query}`,
  };
}

export function getTrustLabel(point) {
  if (!point) return '';
  if (point.verification) return point.verification.replace(/^Verified kosher$/i, 'Source-backed kosher listing');
  if (point.source_url) return 'Source-backed listing';
  if (point.isCommunityPoint) return 'Community post';
  if (point.isRequest) return 'Member request';
  return '';
}

export function getRequestPinType(request) {
  const text = `${request.title || ''} ${request.description || ''} ${request.category || ''}`.toLowerCase();
  if (/lost|found|missing|returned/.test(text)) return 'lost_found';
  if (/event|simcha|shiur|learning night|melave|setup/.test(text)) return 'event';
  if (request.status === 'Open' || request.status === 'Offered') {
    if (request.type === 'volunteer') return 'mitzvah_available';
    return 'help_needed';
  }
  return 'help_needed';
}

export function createMarkerIcon(type) {
  const config = PIN_TYPES[type] || PIN_TYPES.other;
  return divIcon({
    className: `custom-marker custom-marker-${type}`,
    html: `<div style="
      background-color: ${config.color};
      width: 34px;
      height: 34px;
      border-radius: 14px 14px 14px 4px;
      transform: rotate(-45deg) translateY(-2px);
      border: 3px solid white;
      box-shadow: 0 8px 18px rgba(15,23,42,0.28);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
        font-size: 13px;
        font-weight: 900;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        margin-top: -2px;
      ">${config.short}</div>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
}
