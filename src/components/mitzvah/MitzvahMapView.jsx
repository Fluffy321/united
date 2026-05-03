import React, { useEffect, forwardRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, Navigation } from 'lucide-react';

// Fix default marker icons (required for Leaflet in bundled apps)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Fallback seed pins shown when no real requests have coordinates
const SEED_PINS = [
  { id: 'seed-1', title: 'Shabbat Meal Needed', description: 'Looking for Shabbat hospitality this week.', category: 'Shabbat Help', approxLat: 40.6223, approxLng: -73.7246, created_date: new Date().toISOString() },
  { id: 'seed-2', title: 'Grocery Errand', description: 'Need help picking up groceries from Gourmet Glatt.', category: 'Errand', approxLat: 40.6323, approxLng: -73.7129, created_date: new Date().toISOString() },
  { id: 'seed-3', title: 'Ride to Airport', description: 'Need a ride to JFK on Sunday morning.', category: 'Ride', approxLat: 40.6157, approxLng: -73.7296, created_date: new Date().toISOString() },
  { id: 'seed-4', title: 'Math Tutoring', description: 'Looking for a math tutor for 8th grader.', category: 'Tutoring', approxLat: 40.6434, approxLng: -73.6946, created_date: new Date().toISOString() },
  { id: 'seed-5', title: 'Moving Help', description: 'Need extra hands for a small move this Thursday.', category: 'Quick Favor', approxLat: 40.6229, approxLng: -73.7501, created_date: new Date().toISOString() },
];

const CATEGORY_CONFIG = {
  'Errand':       { color: '#2563eb', emoji: '🛍️' },
  'Lost & Found': { color: '#9333ea', emoji: '🔍' },
  'Quick Favor':  { color: '#16a34a', emoji: '🤝' },
  'Tutoring':     { color: '#eab308', emoji: '📚' },
  'Shabbat Help': { color: '#4f46e5', emoji: '🕯️' },
  'Food':         { color: '#f97316', emoji: '🍽️' },
  'Ride':         { color: '#0891b2', emoji: '🚗' },
  'Other':        { color: '#64748b', emoji: '💙' },
};

const ALL_FILTERS = ['All', ...Object.keys(CATEGORY_CONFIG)];

const createCustomIcon = (color, emoji, selected = false) => {
  const size = selected ? 44 : 36;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 3px ${selected ? '14px' : '8px'} rgba(0,0,0,${selected ? '0.5' : '0.3'}), 0 0 0 ${selected ? '3px' : '0px'} ${color}55;
      display: flex;
      align-items: center;
      justify-content: center;
    "><span style="transform: rotate(45deg); font-size: ${selected ? 18 : 15}px; line-height: 1;">${emoji}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

function BoundsFitter({ pins }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    const bounds = L.latLngBounds(pins.map(p => [p.approxLat, p.approxLng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: false });
    }
  }, []); // only on mount
  return null;
}

function MapInner({ center, zoom, requests, userOrigin, onSelectRequest, mapRef, selectedRequestId, activeFilter }) {
  const map = useMap();

  useEffect(() => {
    if (mapRef) mapRef.current = map;
    return () => { if (mapRef) mapRef.current = null; };
  }, [map, mapRef]);

  // Normalize: accept approxLat/approxLng or lat/lng or location_lat/location_lng
  const withCoords = requests.map(r => ({
    ...r,
    approxLat: r.approxLat || r.lat || r.location_lat,
    approxLng: r.approxLng || r.lng || r.location_lng,
  }));

  const filtered = withCoords.filter(r =>
    r.approxLat && r.approxLng && !r.is_hidden &&
    (activeFilter === 'All' || r.category === activeFilter)
  );

  // Use seed pins only when no real pins are visible
  const displayPins = filtered.length > 0 ? filtered : SEED_PINS;

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <BoundsFitter pins={displayPins} />

      {userOrigin && (
        <Marker
          position={[userOrigin.lat, userOrigin.lng]}
          icon={L.divIcon({
            className: '',
            html: `<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #3b82f6,0 2px 8px rgba(0,0,0,0.3)"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })}
        />
      )}

      <MarkerClusterGroup chunkedLoading>
        {displayPins.map(req => {
          const cfg = CATEGORY_CONFIG[req.category] || CATEGORY_CONFIG['Other'];
          return (
            <Marker
              key={req.id}
              position={[req.approxLat, req.approxLng]}
              icon={createCustomIcon(cfg.color, cfg.emoji, req.id === selectedRequestId)}
              eventHandlers={{ click: () => onSelectRequest(req) }}
            />
          );
        })}
      </MarkerClusterGroup>
    </>
  );
}

const MitzvahMapView = forwardRef(function MitzvahMapView(
  { requests, userOrigin, mapCenter, mapZoom, onSelectRequest, selectedRequestId, onUseMyLocation, onHelpClick },
  mapRef
) {
  const effectiveCenter = mapCenter ? [mapCenter.lat, mapCenter.lng] : [40.6369, -73.7142];
  const effectiveZoom = mapZoom ?? 12;
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedReq, setSelectedReq] = useState(null);

  // Count real pins
  const realPinCount = requests.filter(r =>
    (r.approxLat || r.lat || r.location_lat) && (r.approxLng || r.lng || r.location_lng) && !r.is_hidden
  ).length;
  const usingSeeds = realPinCount === 0;

  const handlePinClick = (req) => {
    setSelectedReq(req);
    if (onSelectRequest) onSelectRequest(req);
  };

  const cfg = selectedReq ? (CATEGORY_CONFIG[selectedReq.category] || CATEGORY_CONFIG['Other']) : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Filter bar */}
      <div className="absolute top-2.5 left-0 right-0 z-[500]" style={{ paddingLeft: 12, paddingRight: 12 }}>
        <div
          className="scrollbar-hide"
          style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}
        >
          {ALL_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="flex-shrink-0 text-[11px] font-bold transition-all touch-manipulation"
              style={{
                padding: '5px 10px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
                ...(activeFilter === f
                  ? { background: '#0F172A', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }
                  : { background: 'white', color: '#374151', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                )
              }}
            >
              {CATEGORY_CONFIG[f]?.emoji} {f}
            </button>
          ))}
        </div>
      </div>

      {/* Seed notice */}
      {usingSeeds && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[500] px-3 py-1.5 rounded-full text-[11px] font-semibold text-slate-600 pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid #E2E8F0', boxShadow: '0 1px 6px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}
        >
          📍 Showing sample requests — be the first to post!
        </div>
      )}

      {/* Use My Location button */}
      <button
        onClick={onUseMyLocation}
        title="Use my location"
        className="absolute bottom-3 right-3 z-[500] flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-95"
        style={{ background: 'white', color: '#2563EB', border: '1.5px solid #BFDBFE', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}
      >
        <Navigation className="w-4 h-4" />
      </button>

      <MapContainer
        center={effectiveCenter}
        zoom={effectiveZoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <MapInner
          center={effectiveCenter}
          zoom={effectiveZoom}
          requests={requests}
          userOrigin={userOrigin}
          onSelectRequest={handlePinClick}
          mapRef={mapRef}
          selectedRequestId={selectedReq?.id || selectedRequestId}
          activeFilter={activeFilter}
        />
      </MapContainer>

      {/* No pins fallback */}
      {!selectedReq && usingSeeds && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-full text-[12px] font-semibold text-slate-500 pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}
        >
          📍 No nearby requests yet — be the first!
        </div>
      )}

      {/* Bottom sheet preview */}
      {selectedReq && (
        <div
          className="absolute bottom-0 left-0 right-0 z-[500] px-3 pb-3"
          style={{ animation: 'slideUp 200ms ease' }}
        >
          <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
          <div className="bg-white rounded-2xl p-3" style={{ boxShadow: '0 -2px 20px rgba(0,0,0,0.18)', borderTop: `3px solid ${cfg.color}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${cfg.color}18` }}>
                {cfg.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14px] text-slate-900 truncate">{selectedReq.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${cfg.color}18`, color: cfg.color }}>{selectedReq.category}</span>
                  {selectedReq.distance && selectedReq.distance < 999 && (
                    <span className="text-[11px] text-slate-400">{selectedReq.distance.toFixed(1)} mi away</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { if (onHelpClick) onHelpClick(selectedReq); }}
                  className="px-3 py-1.5 rounded-full text-white text-[12px] font-bold active:scale-95 transition-all"
                  style={{ background: cfg.color }}
                >
                  ✋ I'll Help
                </button>
                <button onClick={() => setSelectedReq(null)} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default MitzvahMapView;