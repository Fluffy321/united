import React, { useEffect, useImperativeHandle, forwardRef, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, MapPin, Navigation, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Fix default marker icons
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

const ALL_FILTERS = ['All', ...Object.keys(CATEGORY_CONFIG)];

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

function MapInner({ center, zoom, requests, userOrigin, onSelectRequest, mapRef, selectedRequestId, activeFilter }) {
  const map = useMap();

  useEffect(() => {
    if (mapRef) mapRef.current = map;
    return () => { if (mapRef) mapRef.current = null; };
  }, [map, mapRef]);

  useEffect(() => {
    if (center) map.setView(center, zoom, { animate: false });
  }, [center, zoom]);

  const filtered = requests.filter(r =>
    r.approxLat && r.approxLng && !r.is_hidden &&
    (activeFilter === 'All' || r.category === activeFilter)
  );

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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
        {filtered.map(req => {
          const cfg = CATEGORY_CONFIG[req.category] || CATEGORY_CONFIG['Other'];
          return (
            <Marker
              key={req.id}
              position={[req.approxLat, req.approxLng]}
              icon={createCustomIcon(cfg.color, req.id === selectedRequestId)}
              eventHandlers={{ click: () => onSelectRequest(req) }}
            />
          );
        })}
      </MarkerClusterGroup>
    </>
  );
}

const MitzvahMapView = forwardRef(function MitzvahMapView(
  { requests, userOrigin, mapCenter, mapZoom, onSelectRequest, selectedRequestId, onUseMyLocation },
  mapRef
) {
  const effectiveCenter = mapCenter ? [mapCenter.lat, mapCenter.lng] : [40.6369, -73.7142];
  const effectiveZoom = mapZoom ?? 12;
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedReq, setSelectedReq] = useState(null);

  const handlePinClick = (req) => {
    setSelectedReq(req);
    if (onSelectRequest) onSelectRequest(req);
  };

  const cfg = selectedReq ? (CATEGORY_CONFIG[selectedReq.category] || CATEGORY_CONFIG['Other']) : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Filter bar */}
      <div className="absolute top-3 left-0 right-0 z-[500] px-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {ALL_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all"
              style={activeFilter === f
                ? { background: '#0F172A', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }
                : { background: 'white', color: '#374151', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
              }
            >
              {CATEGORY_CONFIG[f]?.emoji} {f}
            </button>
          ))}
        </div>
      </div>

      {/* Use My Location button */}
      <button
        onClick={onUseMyLocation}
        className="absolute bottom-4 right-3 z-[500] flex items-center gap-1.5 px-3 py-2.5 rounded-full font-bold text-[13px] shadow-lg transition-all active:scale-95"
        style={{ background: 'white', color: '#2563EB', border: '1.5px solid #BFDBFE', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
      >
        <Navigation className="w-4 h-4" />
        My Location
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

      {/* Bottom sheet preview */}
      {selectedReq && (
        <div
          className="absolute bottom-0 left-0 right-0 z-[500] px-3 pb-3"
          style={{ animation: 'slideUp 200ms ease' }}
        >
          <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 -2px 20px rgba(0,0,0,0.15)', borderTop: `3px solid ${cfg.color}` }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${cfg.color}18` }}>
                {cfg.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[15px] text-slate-900 truncate">{selectedReq.title}</p>
                <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{selectedReq.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(selectedReq.created_date), { addSuffix: true })}
                  </span>
                  {selectedReq.distance && selectedReq.distance < 999 && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {selectedReq.distance.toFixed(1)} mi
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button onClick={() => setSelectedReq(null)} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (onSelectRequest) onSelectRequest(selectedReq); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-[12px] font-bold"
                  style={{ background: cfg.color }}
                >
                  View <ChevronRight className="w-3 h-3" />
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