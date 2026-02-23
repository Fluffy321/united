import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, X } from 'lucide-react';

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

const CATEGORY_BG = {
  'Errand': 'bg-blue-100 text-blue-700',
  'Lost & Found': 'bg-purple-100 text-purple-700',
  'Quick Favor': 'bg-green-100 text-green-700',
  'Tutoring': 'bg-yellow-100 text-yellow-700',
  'Shabbat Help': 'bg-indigo-100 text-indigo-700',
  'Other': 'bg-slate-100 text-slate-600'
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
    transition: all 0.15s;
  "></div>`,
  iconSize: [selected ? 36 : 28, selected ? 36 : 28],
  iconAnchor: [selected ? 18 : 14, selected ? 36 : 28],
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function MapController({ center, zoom, selectedRequest }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom]);

  useEffect(() => {
    if (selectedRequest?.approxLat && selectedRequest?.approxLng) {
      // Pan so the pin is in the upper ~40% of the visible map (above the sheet)
      const point = map.latLngToContainerPoint([selectedRequest.approxLat, selectedRequest.approxLng]);
      const targetY = map.getSize().y * 0.3; // aim for 30% from top
      const offsetY = point.y - targetY;
      map.panBy([0, offsetY], { animate: true, duration: 0.3 });
    }
  }, [selectedRequest]);

  return null;
}

export default function MitzvahMapView({ requests, userOrigin, mapCenter, mapZoom, currentUser, onSelectRequest }) {
  // requests are already filtered by the parent; just strip any that lack coordinates
  const filteredRequests = requests.filter(req => req.approxLat && req.approxLng && !req.is_hidden);

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
        <MapController center={effectiveCenter} zoom={effectiveZoom} selectedRequest={null} />
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

        {/* Request pins — tap goes straight to fullscreen overlay */}
        {filteredRequests.map(req => (
          <Marker
            key={req.id}
            position={[req.approxLat, req.approxLng]}
            icon={createCustomIcon(CATEGORY_COLORS[req.category] || '#64748b', false)}
            eventHandlers={{ click: () => onSelectRequest(req) }}
          />
        ))}
      </MapContainer>
    </div>
  );
}