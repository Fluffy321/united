import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COMMUNITIES_ENABLED } from '@/config/features';
import { VERIFIED_STATIC_POINTS } from './map/staticPoints';
import {
  PRIMARY_FILTERS,
  createClusterIcon,
  createMarkerIcon,
  formatDistance,
  getDistanceMiles,
  getMapLinks,
  getRequestPinType,
} from './map/shared';
import MapController from './map/MapController';
import SelectedPointCard from './map/SelectedPointCard';
import MitzvahMapFilterBar from './map/MitzvahMapFilterBar';

export default function MitzvahMap({
  requests = [],
  userLocation,
  onSelectRequest,
  communityPoints = [],
  directoryPoints = [],
  personalized = true,
  mapHeight,
  includeStaticPoints = false,
  initialPrimaryFilter = '',
  highlightedPlace = '',
}) {
  const [mapCenter, setMapCenter] = useState(null);
  const [activeTypes, setActiveTypes] = useState(() => new Set());
  const [showTypeFilters, setShowTypeFilters] = useState(false);
  const [activeLayers, setActiveLayers] = useState(() => new Set(['places']));
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
  const allPoints = useMemo(() => {
    const trustedPlaces = directoryPoints.length > 0
      ? directoryPoints
      : (includeStaticPoints && directoryPoints.length === 0 ? VERIFIED_STATIC_POINTS : []);
    return [
      ...(activeLayers.has('help') ? requestPoints : []),
      ...(activeLayers.has('community') ? personalizedPoints : []),
      ...(activeLayers.has('places') ? trustedPlaces : []),
    ];
  }, [activeLayers, directoryPoints, includeStaticPoints, personalizedPoints, requestPoints]);
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
    const needsHelp = filter.types.some((type) => ['help_needed', 'mitzvah_available', 'lost_found'].includes(type));
    setActiveLayers((current) => new Set([...current, needsHelp ? 'help' : 'places']));
    if (activePrimaryFilter === filter.key) {
      setActiveTypes(new Set());
      setSelectedPoint(null);
      return;
    }
    setActiveTypes(new Set(filter.types));
    setSelectedPoint(null);
  };

  const toggleLayer = (layer) => {
    setActiveLayers((current) => {
      const next = new Set(current);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
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
      <MitzvahMapFilterBar
        personalized={personalized}
        activeLayers={activeLayers}
        activeTypes={activeTypes}
        activePrimaryFilter={activePrimaryFilter}
        showTypeFilters={showTypeFilters}
        hasActiveFilters={hasActiveFilters}
        onSetActiveTypes={setActiveTypes}
        onSetShowTypeFilters={setShowTypeFilters}
        onApplyPrimaryFilter={applyPrimaryFilter}
        onToggleType={toggleType}
        onToggleLayer={toggleLayer}
      />

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
                  title={point.title || 'Map location'}
                  alt={point.title || 'Map location'}
                  keyboard={true}
                  riseOnHover={true}
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
        <SelectedPointCard
          point={selectedPoint}
          mapLinks={selectedMapLinks}
          distance={selectedDistance}
          onClose={() => setSelectedPoint(null)}
        />
      </div>

    </div>
  );
}
