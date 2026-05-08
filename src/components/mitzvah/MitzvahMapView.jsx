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

const RESOURCE_CONFIG = {
  Shuls: { color: '#1d4ed8', emoji: '🕍' },
  Minyanim: { color: '#7c3aed', emoji: '🙏' },
  Mikvahs: { color: '#0e7490', emoji: '💧' },
  Chabad: { color: '#be123c', emoji: '✡️' },
};

const RESOURCE_PINS = [
  {
    id: 'resource-yilc',
    resourceType: 'Shuls',
    title: 'Young Israel of Lawrence-Cedarhurst',
    description: 'Large Modern Orthodox shul with daily minyanim, youth programming, and active community life.',
    address: '86 Spruce St, Lawrence, NY 11559',
    approxLat: 40.6164,
    approxLng: -73.7319,
    website: 'yilc.org',
  },
  {
    id: 'resource-shaaray-lawrence',
    resourceType: 'Shuls',
    title: 'Congregation Shaaray Tefila',
    description: 'Established Lawrence shul with weekday minyanim and Torah learning.',
    address: '44 Frost Lane, Lawrence, NY 11559',
    approxLat: 40.6137,
    approxLng: -73.7241,
  },
  {
    id: 'resource-yiw',
    resourceType: 'Shuls',
    title: 'Young Israel of Woodmere',
    description: 'Vibrant Woodmere shul with daily shiurim, minyanim, and family programming.',
    address: '135 Irving Place, Woodmere, NY 11598',
    approxLat: 40.6324,
    approxLng: -73.7168,
    website: 'yiwoodmere.org',
  },
  {
    id: 'resource-aish',
    resourceType: 'Shuls',
    title: 'Aish Kodesh',
    description: 'Spirited Woodmere shul known for warm tefillah and deep Torah learning.',
    address: '35 W Broadway, Woodmere, NY 11598',
    approxLat: 40.6321,
    approxLng: -73.7067,
  },
  {
    id: 'resource-yic',
    resourceType: 'Shuls',
    title: 'Young Israel of Cedarhurst',
    description: 'Cedarhurst Young Israel with daily minyanim and community programming.',
    address: '66 Cedarhurst Ave, Cedarhurst, NY 11516',
    approxLat: 40.6227,
    approxLng: -73.7259,
  },
  {
    id: 'resource-yih',
    resourceType: 'Shuls',
    title: 'Young Israel of Hewlett',
    description: 'Traditional Young Israel serving Hewlett families with tefillah and programs.',
    address: '1215 Broadway, Hewlett, NY 11557',
    approxLat: 40.6412,
    approxLng: -73.7012,
  },
  {
    id: 'resource-minyan-lawrence',
    resourceType: 'Minyanim',
    title: 'Lawrence Early Minyan Hub',
    description: 'Common area for early Shacharis and weekday Mincha/Maariv options.',
    address: 'Central Lawrence',
    approxLat: 40.6156,
    approxLng: -73.7292,
  },
  {
    id: 'resource-minyan-woodmere',
    resourceType: 'Minyanim',
    title: 'Woodmere Minyan Corridor',
    description: 'Cluster of daily minyanim around Broadway, Irving Place, and Branch Boulevard.',
    address: 'Woodmere',
    approxLat: 40.6331,
    approxLng: -73.7135,
  },
  {
    id: 'resource-minyan-cedarhurst',
    resourceType: 'Minyanim',
    title: 'Cedarhurst Minyan Area',
    description: 'Neighborhood minyan options near Cedarhurst Avenue and Central Avenue.',
    address: 'Cedarhurst',
    approxLat: 40.6229,
    approxLng: -73.7268,
  },
  {
    id: 'resource-mikvah-fivetowns',
    resourceType: 'Mikvahs',
    title: 'Five Towns Mikvah',
    description: 'Community mikvah serving the Five Towns area.',
    address: '95 Cedarhurst Ave, Cedarhurst, NY 11516',
    approxLat: 40.6232,
    approxLng: -73.7261,
  },
  {
    id: 'resource-chabad-fivetowns',
    resourceType: 'Chabad',
    title: 'Chabad of the Five Towns',
    description: 'Chabad center offering classes, Shabbos and holiday programming, and outreach.',
    address: '74 Spruce St, Lawrence, NY 11559',
    approxLat: 40.6162,
    approxLng: -73.7314,
    website: 'chabadfivetowns.com',
  },
  {
    id: 'resource-chabad-woodmere',
    resourceType: 'Chabad',
    title: 'Chabad of Woodmere',
    description: 'Inclusive Chabad center with learning, holiday events, and community programming.',
    address: '700 Branch Blvd, Woodmere, NY 11598',
    approxLat: 40.6285,
    approxLng: -73.7216,
    website: 'chabadwoodmere.com',
  },
  {
    id: 'resource-chabad-inwood',
    resourceType: 'Chabad',
    title: 'Chabad of Inwood',
    description: 'Chabad center serving Inwood with classes, events, and Jewish community support.',
    address: 'Inwood, NY 11096',
    approxLat: 40.6229,
    approxLng: -73.7501,
  },
  {
    id: 'resource-chabad-hewlett',
    resourceType: 'Chabad',
    title: 'Chabad of Hewlett',
    description: 'Chabad center serving Hewlett with learning, Shabbos meals, and holiday programs.',
    address: 'Hewlett, NY 11557',
    approxLat: 40.6434,
    approxLng: -73.6946,
  },
];

const ALL_FILTERS = ['All', ...Object.keys(CATEGORY_CONFIG), ...Object.keys(RESOURCE_CONFIG)];

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

function MapInner({ center, zoom, requests, resources, userOrigin, onSelectRequest, onSelectResource, mapRef, selectedRequestId, selectedResourceId, activeFilter }) {
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
    (activeFilter === 'All' || r.category === activeFilter) &&
    !RESOURCE_CONFIG[activeFilter]
  );

  const filteredResources = resources.filter(resource =>
    activeFilter === 'All' || resource.resourceType === activeFilter
  );

  // Use seed pins only when no real pins are visible
  const isResourceFilter = !!RESOURCE_CONFIG[activeFilter];
  const displayPins = isResourceFilter ? [] : (filtered.length > 0 ? filtered : SEED_PINS);
  const fittingPins = activeFilter === 'All'
    ? [...displayPins, ...filteredResources]
    : isResourceFilter
      ? filteredResources
      : displayPins;

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <BoundsFitter pins={fittingPins} />

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

      <MarkerClusterGroup chunkedLoading>
        {filteredResources.map(resource => {
          const cfg = RESOURCE_CONFIG[resource.resourceType];
          return (
            <Marker
              key={resource.id}
              position={[resource.approxLat, resource.approxLng]}
              icon={createCustomIcon(cfg.color, cfg.emoji, resource.id === selectedResourceId)}
              eventHandlers={{ click: () => onSelectResource(resource) }}
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
  const [selectedResource, setSelectedResource] = useState(null);
  const resources = RESOURCE_PINS;

  // Count real pins
  const realPinCount = requests.filter(r =>
    (r.approxLat || r.lat || r.location_lat) && (r.approxLng || r.lng || r.location_lng) && !r.is_hidden
  ).length;
  const usingSeeds = realPinCount === 0;
  const showingOnlyResources = !!RESOURCE_CONFIG[activeFilter];
  const showSeedMessaging = usingSeeds && !showingOnlyResources;

  const handlePinClick = (req) => {
    setSelectedReq(req);
    setSelectedResource(null);
    if (onSelectRequest) onSelectRequest(req);
  };

  const handleResourceClick = (resource) => {
    setSelectedResource(resource);
    setSelectedReq(null);
  };

  const cfg = selectedReq ? (CATEGORY_CONFIG[selectedReq.category] || CATEGORY_CONFIG['Other']) : null;
  const resourceCfg = selectedResource ? RESOURCE_CONFIG[selectedResource.resourceType] : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Filter bar */}
      <div className="absolute top-2.5 left-0 right-0 z-[500]" style={{ paddingLeft: 12, paddingRight: 12 }}>
        <div
          className="scrollbar-hide"
          style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}
        >
          {ALL_FILTERS.map(f => {
            const filterCfg = CATEGORY_CONFIG[f] || RESOURCE_CONFIG[f];
            return (
            <button
              key={f}
              onClick={() => {
                setActiveFilter(f);
                setSelectedReq(null);
                setSelectedResource(null);
              }}
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
              {filterCfg?.emoji} {f}
            </button>
          );
          })}
        </div>
      </div>

      {/* Seed notice */}
      {showSeedMessaging && (
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
            resources={resources}
            userOrigin={userOrigin}
            onSelectRequest={handlePinClick}
            onSelectResource={handleResourceClick}
            mapRef={mapRef}
            selectedRequestId={selectedReq?.id || selectedRequestId}
            selectedResourceId={selectedResource?.id}
            activeFilter={activeFilter}
          />
      </MapContainer>

      {/* No pins fallback */}
      {!selectedReq && showSeedMessaging && (
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

      {selectedResource && (
        <div
          className="absolute bottom-0 left-0 right-0 z-[500] px-3 pb-3"
          style={{ animation: 'slideUp 200ms ease' }}
        >
          <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
          <div className="bg-white rounded-2xl p-3" style={{ boxShadow: '0 -2px 20px rgba(0,0,0,0.18)', borderTop: `3px solid ${resourceCfg.color}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${resourceCfg.color}18` }}>
                {resourceCfg.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14px] text-slate-900 truncate">{selectedResource.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${resourceCfg.color}18`, color: resourceCfg.color }}>{selectedResource.resourceType}</span>
                  <span className="text-[11px] text-slate-400 truncate">{selectedResource.address}</span>
                </div>
                <p className="mt-1 text-[11px] font-medium leading-4 text-slate-500 line-clamp-2">{selectedResource.description}</p>
              </div>
              <button onClick={() => setSelectedResource(null)} className="w-7 h-7 flex flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default MitzvahMapView;
