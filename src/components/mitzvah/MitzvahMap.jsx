import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PIN_TYPES = {
  shul: { label: 'Shuls', color: '#4f46e5', short: 'S' },
  restaurant: { label: 'Restaurants', color: '#f97316', short: 'R' },
  lost_found: { label: 'Lost & Found', color: '#9333ea', short: 'L' },
  help_needed: { label: 'Help Needed', color: '#dc2626', short: 'H' },
  mitzvah_available: { label: 'Mitzvahs Available', color: '#16a34a', short: 'M' },
  event: { label: 'Events', color: '#0891b2', short: 'E' },
  community_post: { label: 'My Communities', color: '#0f5ed7', short: 'C' },
  other: { label: 'Other', color: '#64748b', short: 'O' },
};

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
    title: 'Central Ave Kosher Eats',
    description: 'Restaurant area and local pickup spot.',
    type: 'restaurant',
    location_text: 'Central Avenue',
    location_lat: 40.6236,
    location_lng: -73.7268,
  },
  {
    id: 'restaurant-woodmere',
    title: 'Woodmere Cafe Strip',
    description: 'Kosher food and meetup area.',
    type: 'restaurant',
    location_text: 'Woodmere',
    location_lat: 40.6316,
    location_lng: -73.7108,
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
  const [activeTypes, setActiveTypes] = useState(() => new Set(Object.keys(PIN_TYPES).filter((type) => type !== 'other')));

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
          <p className="text-[12px] font-black text-blue-900">Personalized map</p>
          <p className="text-[11px] font-semibold text-blue-700">Showing posts, events, places, and mitzvah needs connected to communities you joined.</p>
        </div>
      )}
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
      </div>
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
        
        {userLocation && (
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
