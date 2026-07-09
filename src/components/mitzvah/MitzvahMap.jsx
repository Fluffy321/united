import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { VERIFIED_STATIC_POINTS } from './map/staticPoints';
import {
  DIRECTORY_LAST_REVIEWED,
  PIN_TYPES,
  PRIMARY_FILTERS,
  createClusterIcon,
  createMarkerIcon,
  formatDistance,
  getDistanceMiles,
  getMapLinks,
  getRequestPinType,
  getTrustLabel,
} from './map/shared';

function MapController({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() || 13);
    }
  }, [center, map]);

  useEffect(() => {
    const invalidate = () => map.invalidateSize({ animate: false });
    const timers = [0, 120, 350, 800].map((delay) => window.setTimeout(invalidate, delay));
    window.addEventListener('resize', invalidate);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);

  return null;
}

export default function MitzvahMap({
  requests,
  userLocation,
  onSelectRequest,
  communityPoints = [],
  personalized = true,
  mapHeight,
  includeStaticPoints = false,
  initialPrimaryFilter = '',
  highlightedPlace = '',
}) {
  const [mapCenter, setMapCenter] = useState(null);
  const [activeTypes, setActiveTypes] = useState(() => new Set());
  const [showTypeFilters, setShowTypeFilters] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [tileUrl, setTileUrl] = useState('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png');
  const resolvedMapHeight = mapHeight || 'clamp(460px, 64dvh, 720px)';

  const requestPoints = useMemo(() => {
    return requests.map((request) => ({
      ...request,
      type: getRequestPinType(request),
      description: request.description,
      location_text: request.location_text || request.neighborhood || request.locationLabel || 'Five Towns',
      location_lat: request.location_lat || request.approxLat || request.approx_lat,
      location_lng: request.location_lng || request.approxLng || request.approx_lng,
      isRequest: true,
    }));
  }, [requests]);

  const personalizedPoints = useMemo(() => {
    if (!COMMUNITIES_ENABLED) return [];
    return communityPoints.map((point) => ({
      ...point,
      type: point.type || 'community_post',
      isCommunityPoint: true,
    }));
  }, [communityPoints]);
  const allPoints = useMemo(
    () => [...requestPoints, ...personalizedPoints, ...(includeStaticPoints ? VERIFIED_STATIC_POINTS : [])],
    [includeStaticPoints, personalizedPoints, requestPoints]
  );
  // No filters selected = show everything; the map should never be empty
  const visiblePoints = useMemo(
    () => (activeTypes.size === 0 ? allPoints : allPoints.filter((point) => activeTypes.has(point.type))),
    [activeTypes, allPoints]
  );
  const hasActiveFilters = activeTypes.size > 0;
  const activePrimaryFilter = PRIMARY_FILTERS.find((filter) => (
    filter.types.length === activeTypes.size && filter.types.every((type) => activeTypes.has(type))
  ))?.key;
  const selectedMapLinks = getMapLinks(selectedPoint, userLocation);
  const selectedDistance = formatDistance(getDistanceMiles(userLocation, selectedPoint));

  useEffect(() => {
    if (!initialPrimaryFilter) return;
    const filter = PRIMARY_FILTERS.find((item) => item.key === initialPrimaryFilter);
    if (!filter) return;
    setActiveTypes(new Set(filter.types));
  }, [initialPrimaryFilter]);

  useEffect(() => {
    const normalizedPlace = String(highlightedPlace || '').trim().toLowerCase();
    const highlightedPoint = normalizedPlace
      ? allPoints.find((point) => String(point.title || '').trim().toLowerCase() === normalizedPlace)
      : null;

    if (highlightedPoint?.location_lat && highlightedPoint?.location_lng) {
      setMapCenter([highlightedPoint.location_lat, highlightedPoint.location_lng]);
      setSelectedPoint(highlightedPoint);
    } else if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    } else if (allPoints.length > 0 && allPoints[0].location_lat) {
      setMapCenter([allPoints[0].location_lat, allPoints[0].location_lng]);
    } else {
      setMapCenter([40.6249, -73.7178]);
    }
  }, [userLocation, allPoints, highlightedPlace]);

  useEffect(() => {
    if (!selectedPoint) return;
    const pointStillVisible = visiblePoints.some((point) => point.id === selectedPoint.id);
    if (!pointStillVisible) setSelectedPoint(null);
  }, [selectedPoint, visiblePoints]);

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
      setSelectedPoint(null);
      return;
    }
    setActiveTypes(new Set(filter.types));
    setSelectedPoint(null);
  };

  if (!mapCenter) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-slate-100" style={{ height: resolvedMapHeight }}>
        <p className="text-slate-500">Loading map…</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
      {/* Five Towns hub banner */}
      {personalized && (
        <div className="border-b border-blue-100 bg-blue-50 px-3 py-2">
          <p className="text-[12px] font-black text-blue-900">
            Five Towns map
            <span className="ml-2 font-medium text-blue-700">
              {COMMUNITIES_ENABLED
                ? 'Kosher food, shuls, schools, events, mitzvahs, and community posts'
                : 'Kosher food, shuls, schools, events, and mitzvah needs'}
            </span>
          </p>
        </div>
      )}

      {/* Primary filter chips — horizontal scroll, matches Communities chip pattern */}
      <div className="mobile-scroll-x flex gap-2 border-b border-slate-200 bg-white px-2 py-2">
        <button
          onClick={() => setActiveTypes(new Set())}
          className={`motion-press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-black transition ${
            activeTypes.size === 0 ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          All
        </button>
        {PRIMARY_FILTERS.map((filter) => {
          const active = activePrimaryFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => applyPrimaryFilter(filter)}
              className={`motion-press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-black transition ${
                active ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
        <button
          onClick={() => setShowTypeFilters((v) => !v)}
          className={`motion-press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-black transition ${
            showTypeFilters ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          {showTypeFilters ? 'Fewer filters' : 'More filters'}
        </button>
      </div>

      {/* Granular type chips — collapsed by default so the map isn't buried under two filter rows */}
      {showTypeFilters && (
      <div className="mobile-scroll-x flex gap-2 border-b border-slate-200 bg-white px-2 py-2">
        {Object.entries(PIN_TYPES).filter(([type]) => type !== 'other').map(([type, config]) => {
          const active = activeTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`motion-press flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                active ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: active ? 'rgba(255,255,255,0.7)' : config.color }}
              />
              {config.label}
            </button>
          );
        })}
        {hasActiveFilters && (
          <button
            onClick={() => setActiveTypes(new Set())}
            className="motion-press flex shrink-0 items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700 transition hover:bg-blue-100"
          >
            Clear
          </button>
        )}
      </div>
      )}

      {/* Map canvas */}
      <div className="relative">
        <MapContainer
          center={mapCenter}
          zoom={13}
          minZoom={9}
          style={{ height: resolvedMapHeight, minHeight: 460, width: '100%' }}
          className="junited-leaflet-map"
          zoomControl={true}
          dragging={true}
          touchZoom={true}
          doubleClickZoom={true}
          boxZoom={true}
          keyboard={true}
          scrollWheelZoom={true}
          worldCopyJump={true}
        >
          <MapController center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={tileUrl}
            eventHandlers={{
              tileerror: () => {
                if (tileUrl.includes('cartocdn')) {
                  setTileUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
                }
              },
            }}
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

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={44}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            iconCreateFunction={createClusterIcon}
          >
            {visiblePoints.map(point => {
              if (!point.location_lat || !point.location_lng) return null;

              return (
                <Marker
                  key={point.id}
                  position={[point.location_lat, point.location_lng]}
                  icon={createMarkerIcon(point.type)}
                  eventHandlers={{
                    click: () => {
                      setSelectedPoint(point);
                      if (point.isRequest) onSelectRequest?.(point);
                    }
                  }}
                />
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>

        {/* Selected point card */}
        {selectedPoint && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[550]">
            <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white/96 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className="mb-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-black text-white"
                    style={{ backgroundColor: (PIN_TYPES[selectedPoint.type] || PIN_TYPES.other).color }}
                  >
                    {(PIN_TYPES[selectedPoint.type] || PIN_TYPES.other).label}
                  </div>
                  <p className="truncate text-[14px] font-black text-slate-950">{selectedPoint.title}</p>
                  <p className="mt-1 line-clamp-3 text-[12px] font-semibold leading-5 text-slate-600">
                    {selectedPoint.description || 'Tap the marker to view details for this map item.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPoint(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[16px] font-black text-slate-500 transition hover:bg-slate-100"
                  aria-label="Close map summary"
                >
                  ×
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
                {selectedPoint.location_text && (
                  <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-600 ring-1 ring-slate-200">
                    {selectedPoint.location_text}
                  </span>
                )}
                {selectedDistance && (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 ring-1 ring-blue-100">
                    {selectedDistance}
                  </span>
                )}
                {getTrustLabel(selectedPoint) && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 ring-1 ring-emerald-100">
                    {getTrustLabel(selectedPoint)}
                  </span>
                )}
                {selectedPoint.source_url && (
                  <span className="rounded-full bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-200">
                    Reviewed {selectedPoint.last_verified || DIRECTORY_LAST_REVIEWED}
                  </span>
                )}
                {selectedPoint.communityName && (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 ring-1 ring-blue-100">
                    {selectedPoint.communityName}
                  </span>
                )}
                {selectedPoint.posterName && (
                  <span className="rounded-full bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-200">
                    {selectedPoint.posterName}
                  </span>
                )}
              </div>
              {selectedMapLinks && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <a
                    href={selectedMapLinks.google}
                    target="_blank"
                    rel="noreferrer"
                    className="motion-press rounded-xl bg-blue-600 px-2 py-2 text-center text-[11px] font-black text-white shadow-sm"
                  >
                    Google Maps
                  </a>
                  <a
                    href={selectedMapLinks.apple}
                    target="_blank"
                    rel="noreferrer"
                    className="motion-press rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-[11px] font-black text-slate-700"
                  >
                    Apple Maps
                  </a>
                  <a
                    href={selectedMapLinks.waze}
                    target="_blank"
                    rel="noreferrer"
                    className="motion-press rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-2 text-center text-[11px] font-black text-cyan-700"
                  >
                    Waze
                  </a>
                </div>
              )}
              {selectedPoint.source_url && (
                <a
                  href={selectedPoint.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="motion-press mt-2 inline-flex w-full items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700"
                >
                  Open listing source
                </a>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
