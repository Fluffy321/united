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

const SUBJECT_THEMES = [
  {
    key: 'jewish_life',
    label: 'Jewish Life',
    emoji: '🕍',
    color: '#1d4ed8',
    filters: ['Shuls', 'Minyanim', 'Mikvahs', 'Chabad'],
  },
  {
    key: 'food_shops',
    label: 'Food & Shops',
    emoji: '🍽️',
    color: '#f97316',
    filters: ['Food'],
  },
  {
    key: 'chesed_needs',
    label: 'Chesed Needs',
    emoji: '🤝',
    color: '#16a34a',
    filters: ['Shabbat Help', 'Lost & Found', 'Errand', 'Quick Favor', 'Other'],
  },
  {
    key: 'rides',
    label: 'Rides',
    emoji: '🚗',
    color: '#0891b2',
    filters: ['Ride'],
  },
  {
    key: 'learning',
    label: 'Learning',
    emoji: '📚',
    color: '#eab308',
    filters: ['Tutoring'],
  },
  {
    key: 'all',
    label: 'Everything',
    emoji: '✨',
    color: '#0f172a',
    filters: ['All'],
  },
];

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

const QUICK_FILTERS = [
  ...Object.keys(RESOURCE_CONFIG),
  'Food',
  'Ride',
  'Shabbat Help',
  'Lost & Found',
  'Errand',
  'Quick Favor',
  'Tutoring',
  'Other',
  'All',
];

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
  }, [map, pins]);
  return null;
}

function filterMatches(value, activeFilter, activeFilters) {
  if (!activeFilter && (!activeFilters || activeFilters.length === 0)) return false;
  if (activeFilter === 'All' || activeFilters?.includes('All')) return true;
  if (activeFilter) return value === activeFilter;
  return activeFilters.includes(value);
}

function MapInner({ center, zoom, requests, resources, userOrigin, onSelectRequest, onSelectResource, mapRef, selectedRequestId, selectedResourceId, activeFilter, activeFilters }) {
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
    (activeFilter || activeFilters?.length > 0) &&
    r.approxLat && r.approxLng && !r.is_hidden &&
    filterMatches(r.category, activeFilter, activeFilters) &&
    !RESOURCE_CONFIG[activeFilter]
  );

  const filteredResources = resources.filter(resource =>
    (activeFilter || activeFilters?.length > 0) && filterMatches(resource.resourceType, activeFilter, activeFilters)
  );

  const isResourceFilter = activeFilter ? !!RESOURCE_CONFIG[activeFilter] : activeFilters?.some((item) => RESOURCE_CONFIG[item]);
  const displayPins = (activeFilter || activeFilters?.length > 0) && !isResourceFilter ? filtered : filtered;
  const fittingPins = activeFilter === 'All' || activeFilters?.includes('All')
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
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeThemeKey, setActiveThemeKey] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const resources = RESOURCE_PINS;

  const activeTheme = SUBJECT_THEMES.find((theme) => theme.key === activeThemeKey);
  const activeFilters = activeTheme && activeTheme.key !== 'all' ? activeTheme.filters : null;
  const effectiveActiveFilter = activeTheme?.key === 'all' ? 'All' : activeFilter;
  const activeLabel = activeTheme ? activeTheme.label : activeFilter;

  const visiblePinCount = activeFilter
    ? requests.filter(r => {
      const categoryMatch = filterMatches(r.category, effectiveActiveFilter, activeFilters);
      return categoryMatch && (r.approxLat || r.lat || r.location_lat) && (r.approxLng || r.lng || r.location_lng) && !r.is_hidden;
    }).length + resources.filter(resource => filterMatches(resource.resourceType, effectiveActiveFilter, activeFilters)).length
    : activeTheme
      ? requests.filter(r => {
        const categoryMatch = filterMatches(r.category, effectiveActiveFilter, activeFilters);
        return categoryMatch && (r.approxLat || r.lat || r.location_lat) && (r.approxLng || r.lng || r.location_lng) && !r.is_hidden;
      }).length + resources.filter(resource => filterMatches(resource.resourceType, effectiveActiveFilter, activeFilters)).length
    : 0;

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
          style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 7, WebkitOverflowScrolling: 'touch' }}
        >
          {SUBJECT_THEMES.map(theme => {
            const selected = activeThemeKey === theme.key;
            return (
              <button
                key={theme.key}
                onClick={() => {
                  const nextTheme = selected ? null : theme.key;
                  setActiveThemeKey(nextTheme);
                  setActiveFilter(null);
                  setSelectedReq(null);
                  setSelectedResource(null);
                }}
                className="flex-shrink-0 text-[12px] font-black transition-all touch-manipulation"
                style={{
                  padding: '9px 13px',
                  borderRadius: 14,
                  whiteSpace: 'nowrap',
                  ...(selected
                    ? { background: theme.color, color: 'white', boxShadow: `0 8px 18px ${theme.color}33` }
                    : { background: 'rgba(255,255,255,0.96)', color: '#0f172a', border: '1px solid #E2E8F0', boxShadow: '0 1px 6px rgba(0,0,0,0.12)' }
                  )
                }}
              >
                {theme.emoji} {theme.label}
              </button>
            );
          })}
        </div>
        <div
          className="scrollbar-hide"
          style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}
        >
          {QUICK_FILTERS.map(f => {
            const filterCfg = CATEGORY_CONFIG[f] || RESOURCE_CONFIG[f];
            return (
            <button
              key={f}
              onClick={() => {
                setActiveFilter(activeFilter === f ? null : f);
                setActiveThemeKey(null);
                setSelectedReq(null);
                setSelectedResource(null);
              }}
              className="flex-shrink-0 text-[11px] font-bold transition-all touch-manipulation"
              style={{
                padding: '7px 12px',
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

      {!activeFilter && !activeTheme && (
        <div className="absolute top-[92px] left-1/2 -translate-x-1/2 z-[500] px-3 py-1.5 rounded-full text-[11px] font-semibold text-slate-600 pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid #E2E8F0', boxShadow: '0 1px 6px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}
        >
          Pick a subject theme to show pins
        </div>
      )}

      {(activeFilter || activeTheme) && visiblePinCount === 0 && (
        <div className="absolute top-[92px] left-1/2 -translate-x-1/2 z-[500] px-3 py-1.5 rounded-full text-[11px] font-semibold text-slate-600 pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid #E2E8F0', boxShadow: '0 1px 6px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}
        >
          No pins in {activeLabel} yet
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
            activeFilter={effectiveActiveFilter}
            activeFilters={activeFilters}
          />
      </MapContainer>

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
