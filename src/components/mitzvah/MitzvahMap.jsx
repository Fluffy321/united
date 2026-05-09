import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PIN_TYPES = {
  shul: { label: 'Shuls', color: '#4f46e5', short: 'S' },
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
  community_post: { label: 'My Communities', color: '#0f5ed7', short: 'C' },
  other: { label: 'Other', color: '#64748b', short: 'O' },
};

const PRIMARY_FILTERS = [
  { key: 'kosher_food', label: 'Kosher Food', types: ['restaurant', 'grocery', 'bakery'] },
  { key: 'jewish_businesses', label: 'Jewish Businesses', types: ['judaica', 'business', 'services', 'wellness'] },
  { key: 'community_places', label: 'Community Places', types: ['shul', 'event', 'community_post'] },
  { key: 'chesed_needs', label: 'Chesed Needs', types: ['help_needed', 'mitzvah_available', 'lost_found'] },
];

const STATIC_POINTS = [
  {
    id: 'shul-yilc',
    title: 'Young Israel of Lawrence-Cedarhurst',
    description: 'Shul, minyanim, learning, and community updates.',
    type: 'shul',
    location_text: 'Cedarhurst',
    location_lat: 40.6226,
    location_lng: -73.7241,
  },
  {
    id: 'shul-woodmere',
    title: 'Young Israel of Woodmere',
    description: 'Shul hub for tefillah, shiurim, and local announcements.',
    type: 'shul',
    location_text: 'Woodmere',
    location_lat: 40.6325,
    location_lng: -73.7137,
  },
  {
    id: 'restaurant-central',
    title: 'Central Ave Grill & Takeout',
    description: 'Kosher meat takeout, family dinners, and Shabbos order pickup.',
    type: 'restaurant',
    location_text: 'Central Avenue',
    location_lat: 40.6236,
    location_lng: -73.7268,
  },
  {
    id: 'restaurant-cedarhurst-pizza',
    title: 'Cedarhurst Pizza & Pasta',
    description: 'Dairy pizza, salads, soups, and quick family meals.',
    type: 'restaurant',
    location_text: 'Cedarhurst',
    location_lat: 40.6242,
    location_lng: -73.7254,
  },
  {
    id: 'restaurant-woodmere-cafe',
    title: 'Woodmere Dairy Cafe',
    description: 'Coffee, breakfast, sandwiches, and work-friendly tables.',
    type: 'restaurant',
    location_text: 'Woodmere',
    location_lat: 40.6316,
    location_lng: -73.7108,
  },
  {
    id: 'restaurant-lawrence-sushi',
    title: 'Lawrence Sushi Counter',
    description: 'Sushi, poke bowls, and weekday dinner pickup.',
    type: 'restaurant',
    location_text: 'Lawrence',
    location_lat: 40.6154,
    location_lng: -73.7321,
  },
  {
    id: 'grocery-woodmere-market',
    title: 'Woodmere Kosher Market',
    description: 'Kosher groceries, butcher counter, produce, and Shabbos staples.',
    type: 'grocery',
    location_text: 'Woodmere',
    location_lat: 40.6338,
    location_lng: -73.7111,
  },
  {
    id: 'grocery-inwood-market',
    title: 'Inwood Kosher Grocery',
    description: 'Neighborhood grocery, prepared foods, and pantry basics.',
    type: 'grocery',
    location_text: 'Inwood',
    location_lat: 40.6213,
    location_lng: -73.7468,
  },
  {
    id: 'bakery-cedarhurst',
    title: 'Five Towns Bake Shop',
    description: 'Challah, cakes, cookies, and custom simcha orders.',
    type: 'bakery',
    location_text: 'Cedarhurst',
    location_lat: 40.6215,
    location_lng: -73.7282,
  },
  {
    id: 'bakery-hewlett',
    title: 'Hewlett Bagel & Bakery',
    description: 'Bagels, pastries, challah, and morning coffee.',
    type: 'bakery',
    location_text: 'Hewlett',
    location_lat: 40.6423,
    location_lng: -73.6963,
  },
  {
    id: 'judaica-cedarhurst',
    title: 'Cedarhurst Judaica & Gifts',
    description: 'Seforim, mezuzos, gifts, tallis bags, and Yom Tov items.',
    type: 'judaica',
    location_text: 'Cedarhurst',
    location_lat: 40.6251,
    location_lng: -73.7255,
  },
  {
    id: 'business-pharmacy',
    title: 'Cedarhurst Community Pharmacy',
    description: 'Prescriptions, delivery, health items, and community support.',
    type: 'business',
    location_text: 'Cedarhurst',
    location_lat: 40.6242,
    location_lng: -73.7221,
  },
  {
    id: 'business-car-service',
    title: 'Five Towns Car Service',
    description: 'Airport runs, local rides, school pickups, and late-night dispatch.',
    type: 'business',
    location_text: 'Inwood',
    location_lat: 40.6201,
    location_lng: -73.7412,
  },
  {
    id: 'services-tailor',
    title: 'Lawrence Tailor & Cleaners',
    description: 'Alterations, dry cleaning, and simcha rush orders.',
    type: 'services',
    location_text: 'Lawrence',
    location_lat: 40.6129,
    location_lng: -73.7298,
  },
  {
    id: 'services-tutoring',
    title: 'Hewlett Tutoring Studio',
    description: 'Homework help, Regents prep, and limudei kodesh tutoring.',
    type: 'services',
    location_text: 'Hewlett',
    location_lat: 40.6411,
    location_lng: -73.7004,
  },
  {
    id: 'wellness-family',
    title: 'Woodmere Family Wellness',
    description: 'Local therapy, coaching, family support, and referral resources.',
    type: 'wellness',
    location_text: 'Woodmere',
    location_lat: 40.6312,
    location_lng: -73.7187,
  },
  {
    id: 'lost-siddur',
    title: 'Lost siddur reported',
    description: 'Black siddur found near Central Ave. Claim with details.',
    type: 'lost_found',
    location_text: 'Cedarhurst',
    location_lat: 40.6214,
    location_lng: -73.7253,
  },
  {
    id: 'event-learning',
    title: 'Community learning night',
    description: 'Setup help and shiur event tonight.',
    type: 'event',
    location_text: 'Lawrence',
    location_lat: 40.6168,
    location_lng: -73.7308,
  },
  {
    id: 'event-shabbos',
    title: 'Shabbos hosting meetup',
    description: 'Host and guest matching event.',
    type: 'event',
    location_text: 'Five Towns',
    location_lat: 40.6361,
    location_lng: -73.7162,
  },
];

function MapController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  
  return null;
}

export default function MitzvahMap({ requests, userLocation, onSelectRequest, communityPoints = [], personalized = true }) {
  const [mapCenter, setMapCenter] = useState(null);
  const [activeTypes, setActiveTypes] = useState(() => new Set());

  const requestPoints = useMemo(() => {
    return requests.map((request) => ({
      ...request,
      type: getRequestPinType(request),
      description: request.description,
      location_text: request.location_text || request.neighborhood || request.locationLabel || 'Five Towns',
      isRequest: true,
    }));
  }, [requests]);

  const personalizedPoints = useMemo(() => {
    return communityPoints.map((point) => ({
      ...point,
      type: point.type || 'community_post',
      isCommunityPoint: true,
    }));
  }, [communityPoints]);
  const allPoints = useMemo(() => [...requestPoints, ...personalizedPoints, ...STATIC_POINTS], [personalizedPoints, requestPoints]);
  const visiblePoints = useMemo(() => allPoints.filter((point) => activeTypes.has(point.type)), [activeTypes, allPoints]);
  const hasActiveFilters = activeTypes.size > 0;
  const activePrimaryFilter = PRIMARY_FILTERS.find((filter) => (
    filter.types.length === activeTypes.size && filter.types.every((type) => activeTypes.has(type))
  ))?.key;

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    } else if (allPoints.length > 0 && allPoints[0].location_lat) {
      setMapCenter([allPoints[0].location_lat, allPoints[0].location_lng]);
    } else {
      setMapCenter([40.6249, -73.7178]);
    }
  }, [userLocation, allPoints]);

  const toggleType = (type) => {
    setActiveTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const applyPrimaryFilter = (filter) => {
    if (activePrimaryFilter === filter.key) {
      setActiveTypes(new Set());
      return;
    }
    setActiveTypes(new Set(filter.types));
  };

  const createMarkerIcon = (type) => {
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
  };

  if (!mapCenter) {
    return (
      <div className="h-[500px] bg-slate-100 rounded-2xl flex items-center justify-center">
        <p className="text-slate-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
      {personalized && (
        <div className="border-b border-blue-100 bg-blue-50 px-3 py-2">
          <p className="text-[12px] font-black text-blue-900">Five Towns digital hub</p>
          <p className="text-[11px] font-semibold leading-5 text-blue-700">
            A personalized local map for Lawrence, Cedarhurst, Woodmere, Hewlett, and Inwood, showing posts, events, places, and mitzvah needs from communities you joined.
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 border-b border-slate-200 bg-white p-2 sm:grid-cols-4">
        {PRIMARY_FILTERS.map((filter) => {
          const active = activePrimaryFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => applyPrimaryFilter(filter)}
              className={`rounded-xl border px-3 py-2 text-[12px] font-black transition ${
                active ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      <div className="mobile-scroll-x flex gap-2 border-b border-slate-200 bg-white p-2">
        {Object.entries(PIN_TYPES).filter(([type]) => type !== 'other').map(([type, config]) => {
          const active = activeTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-black transition ${
                active ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.color }} />
              {config.label}
            </button>
          );
        })}
        {hasActiveFilters && (
          <button
            onClick={() => setActiveTypes(new Set())}
            className="flex shrink-0 items-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-black text-blue-700 transition"
          >
            Clear
          </button>
        )}
      </div>
      <div className="relative">
        {!hasActiveFilters && (
          <div className="absolute left-3 right-3 top-3 z-[500] rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
            <p className="text-[13px] font-black text-slate-900">Pick a filter to show pins</p>
            <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
              Choose shuls, restaurants, groceries, businesses, lost and found, help, mitzvahs, events, or community posts.
            </p>
          </div>
        )}
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: 500, width: '100%' }}
          zoomControl={true}
        >
          <MapController center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {userLocation && hasActiveFilters && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={divIcon({
                className: 'user-marker',
                html: `<div style="
                  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
            />
          )}

          {visiblePoints.map(point => {
            if (!point.location_lat || !point.location_lng) return null;
            const config = PIN_TYPES[point.type] || PIN_TYPES.other;
            
            return (
              <Marker
                key={point.id}
                position={[point.location_lat, point.location_lng]}
                icon={createMarkerIcon(point.type)}
                eventHandlers={{
                  click: () => point.isRequest && onSelectRequest?.(point)
                }}
              >
                <Popup>
                  <div className="min-w-[180px] text-sm">
                    <div className="mb-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-black text-white" style={{ backgroundColor: config.color }}>
                      {config.label}
                    </div>
                    <div className="mb-1 font-bold text-slate-950">{point.title}</div>
                    <div className="text-xs leading-5 text-slate-600">{point.description}</div>
                    <div className="mt-1 text-[11px] font-bold text-slate-400">{point.location_text}</div>
                    {point.communityName && (
                      <div className="mt-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">
                        {point.communityName}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

function getRequestPinType(request) {
  const text = `${request.title || ''} ${request.description || ''} ${request.category || ''}`.toLowerCase();
  if (/lost|found|missing|returned/.test(text)) return 'lost_found';
  if (/event|simcha|shiur|learning night|melave|setup/.test(text)) return 'event';
  if (request.status === 'Open' || request.status === 'Offered') {
    if (request.type === 'volunteer') return 'mitzvah_available';
    return 'help_needed';
  }
  return 'help_needed';
}
