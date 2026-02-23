import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORY_COLORS = {
  'Errand': '#2563eb',
  'Lost & Found': '#9333ea',
  'Quick Favor': '#16a34a',
  'Tutoring': '#eab308',
  'Shabbat Help': '#4f46e5',
  'Other': '#64748b'
};

const createCustomIcon = (color, selected = false) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background-color: ${color};
    width: ${selected ? '36px' : '28px'};
    height: ${selected ? '36px' : '28px'};
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: ${selected ? '3px' : '2px'} solid white;
    box-shadow: 0 2px ${selected ? '12px' : '6px'} rgba(0,0,0,${selected ? '0.45' : '0.25'});
  "></div>`,
  iconSize: [selected ? 36 : 28, selected ? 36 : 28],
  iconAnchor: [selected ? 18 : 14, selected ? 36 : 28],
});

// Inner component that has access to the Leaflet map instance
function MapInner({ center, zoom, requests, userOrigin, onSelectRequest, mapRef, selectedRequestId }) {
  const map = useMap();

  // Expose map instance to parent via ref
  useEffect(() => {
    if (mapRef) mapRef.current = map;
    return () => { if (mapRef) mapRef.current = null; };
  }, [map, mapRef]);

  // Update center/zoom when filters change
  useEffect(() => {
    if (center) map.setView(center, zoom, { animate: false });
  }, [center, zoom]);

  const filteredRequests = requests.filter(r => r.approxLat && r.approxLng && !r.is_hidden);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User location dot */}
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

      {/* Request pins */}
      {filteredRequests.map(req => (
        <Marker
          key={req.id}
          position={[req.approxLat, req.approxLng]}
          icon={createCustomIcon(CATEGORY_COLORS[req.category] || '#64748b', req.id === selectedRequestId)}
          eventHandlers={{ click: () => onSelectRequest(req) }}
        />
      ))}
    </>
  );
}

// forwardRef so parent can call map.invalidateSize(), map.dragging.disable(), etc.
const MitzvahMapView = forwardRef(function MitzvahMapView(
  { requests, userOrigin, mapCenter, mapZoom, onSelectRequest, selectedRequestId },
  mapRef
) {
  const effectiveCenter = mapCenter ? [mapCenter.lat, mapCenter.lng] : [40.6369, -73.7142];
  const effectiveZoom = mapZoom ?? 12;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
          onSelectRequest={onSelectRequest}
          mapRef={mapRef}
          selectedRequestId={selectedRequestId}
        />
      </MapContainer>
    </div>
  );
});

export default MitzvahMapView;