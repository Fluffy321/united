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

export default function MitzvahMapView({ requests, userOrigin, currentUser, onSelectRequest, onHelpRequest, filters }) {
  const [mapCenter] = useState([40.6223, -73.7159]);
  const [mapZoom] = useState(13);
  const [selected, setSelected] = useState(null);

  const filteredRequests = requests.filter(req => {
    if (req.status !== 'open') return false;
    if (filters?.category && filters.category !== 'All' && req.category !== filters.category) return false;
    if (filters?.time === 'today') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(req.created_date) < today) return false;
    } else if (filters?.time === 'thisweek') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      if (new Date(req.created_date) < weekAgo) return false;
    }
    return req.approxLat && req.approxLng && !req.is_hidden;
  });

  const effectiveCenter = userOrigin ? [userOrigin.lat, userOrigin.lng] : mapCenter;
  const effectiveZoom = userOrigin ? 14 : mapZoom;
  const isRequester = selected && currentUser?.id === selected.created_by_user_id;
  const distance = selected && userOrigin
    ? calculateDistance(userOrigin.lat, userOrigin.lng, selected.approxLat, selected.approxLng)
    : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={effectiveCenter}
        zoom={effectiveZoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <MapController center={effectiveCenter} zoom={effectiveZoom} selectedRequest={selected} />
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
            icon={createCustomIcon(CATEGORY_COLORS[req.category] || '#64748b', selected?.id === req.id)}
            eventHandlers={{ click: () => setSelected(req) }}
          />
        ))}
      </MapContainer>

      {/* Bottom Sheet */}
      {selected && (
        <div
          style={{
            position: 'fixed',
            left: 0, right: 0, bottom: 0,
            background: 'white',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            boxShadow: '0 -12px 30px rgba(0,0,0,0.12)',
            zIndex: 9999,
            maxHeight: '45vh',
            overflowY: 'auto',
            padding: '16px 16px 32px',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center mb-3">
            <div style={{ width: 36, height: 4, borderRadius: 9999, background: '#E2E8F0' }} />
          </div>

          {/* Close button */}
          <button
            onClick={() => setSelected(null)}
            style={{ position: 'absolute', top: 14, right: 14 }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Category pill */}
          <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-2 ${CATEGORY_BG[selected.category] || 'bg-slate-100 text-slate-600'}`}>
            {selected.category}
          </span>

          {/* Title + description */}
          <h3 className="font-bold text-[15px] text-[#0F172A] mb-1 pr-8">{selected.title}</h3>
          <p className="text-[13px] text-[#6B7280] mb-3 line-clamp-3">{selected.description}</p>

          {/* Location */}
          {selected.locationLabel && (
            <div className="flex items-center gap-1 text-[12px] text-[#98A2B3] mb-4">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {selected.locationLabel}
              {distance != null && distance < 50 && (
                <span className="ml-1 text-green-600 font-medium">· {distance < 0.5 ? 'Nearby' : `${distance.toFixed(1)} mi`}</span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => { onSelectRequest(selected); setSelected(null); }}
              className="flex-1 h-10 rounded-full border border-[#E8ECF4] text-[13px] font-semibold text-[#374151] bg-white hover:bg-[#F5F7FB] transition-colors"
            >
              View Details
            </button>
            {!isRequester && (
              <button
                onClick={() => { onHelpRequest(selected); setSelected(null); }}
                className="flex-1 h-10 rounded-full text-[13px] font-semibold text-white bg-[#0F172A] hover:bg-[#1e2d42] transition-colors"
              >
                I'll Help 💙
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}