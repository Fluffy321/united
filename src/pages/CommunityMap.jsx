import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Users, X, ExternalLink, HandHeart, Calendar, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const FIVE_TOWNS_CENTER = [40.6282, -73.7157];

const TYPE_CONFIG = {
  community: { color: '#0F5ED7', emoji: '🏛️', label: 'Community Hub' },
  event:     { color: '#059669', emoji: '📅', label: 'Event' },
  help:      { color: '#DC2626', emoji: '🤝', label: 'Help Request' },
  housing:   { color: '#7C3AED', emoji: '🏠', label: 'Housing' },
};

const NEIGHBORHOOD_COORDS = {
  'Lawrence':     [40.6209, -73.7302],
  'Cedarhurst':   [40.6237, -73.7256],
  'Woodmere':     [40.6337, -73.7107],
  'Hewlett':      [40.6432, -73.6954],
  'Inwood':       [40.6126, -73.7479],
  'Far Rockaway': [40.6054, -73.7542],
  'Long Beach':   [40.5882, -73.6607],
};

function getCoords(text) {
  const loc = (text || '').toLowerCase();
  for (const [name, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
    if (loc.includes(name.toLowerCase())) {
      return [coords[0] + (Math.random() - 0.5) * 0.006, coords[1] + (Math.random() - 0.5) * 0.006];
    }
  }
  return [FIVE_TOWNS_CENTER[0] + (Math.random() - 0.5) * 0.03, FIVE_TOWNS_CENTER[1] + (Math.random() - 0.5) * 0.03];
}

function makeIcon(type, large = false) {
  const cfg = TYPE_CONFIG[type];
  const size = large ? 40 : 32;
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${cfg.color};
      color:white;
      width:${size}px;height:${size}px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2.5px solid white;
      box-shadow:0 3px 10px rgba(0,0,0,0.28);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);font-size:${large ? 17 : 13}px;">${cfg.emoji}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 4)],
  });
}

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 1) {
      map.fitBounds(markers.map(m => m.coords), { padding: [50, 50] });
    }
  }, [markers.length]);
  return null;
}

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'community', label: '🏛️ Hubs' },
  { key: 'help',      label: '🤝 Help' },
  { key: 'event',     label: '📅 Events' },
  { key: 'housing',   label: '🏠 Housing' },
];

export default function CommunityMap() {
  const navigate = useNavigate();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadPins(); }, []);

  const loadPins = async () => {
    try {
      const [posts, communities] = await Promise.all([
        base44.entities.UnifiedPost.list('-created_date', 80),
        base44.entities.Community.list('-follower_count', 60),
      ]);

      const postPins = posts
        .filter(p => ['event', 'housing', 'help'].includes(p.type) || p.board === 'housing' || p.board === 'help' || p.board === 'events')
        .map(p => {
          let type = p.type;
          if (!['event', 'housing', 'help'].includes(type)) {
            if (p.board === 'housing') type = 'housing';
            else if (p.board === 'events') type = 'event';
            else type = 'help';
          }
          const coords = getCoords(p.location_text || p.city);
          return {
            id: p.id, type, coords,
            title: p.title || p.body?.slice(0, 60),
            body: p.body?.slice(0, 120),
            location: p.location_text || p.city || 'Five Towns',
            date: p.event_date,
            user: p.user_name,
          };
        });

      const communityPins = communities.map(c => ({
        id: `comm-${c.id}`,
        entityId: c.id,
        type: 'community',
        coords: getCoords(c.neighborhood || c.address),
        title: c.name,
        body: c.description_short,
        location: c.neighborhood || c.address || 'Five Towns',
        communityType: c.type,
        followers: c.follower_count || 0,
        logo: c.logo_url,
        isClaimed: c.is_claimed,
        isVerified: c.is_verified,
      }));

      setMarkers([...communityPins, ...postPins]);
    } catch (e) {
      console.error('CommunityMap load error:', e);
    }
    setLoading(false);
  };

  const visibleMarkers = activeFilter === 'all' ? markers : markers.filter(m => m.type === activeFilter);

  return (
    <div className="flex flex-col bg-white relative" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid #E8EDF5', boxShadow: '0 1px 6px rgba(15,23,42,0.04)', zIndex: 10 }}>
        <button onClick={() => navigate(createPageUrl('Communities'))} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="flex-1 text-[17px] font-bold text-slate-900">Community Map</h1>
        <span className="text-[12px] text-slate-400 font-medium">{visibleMarkers.length} pins</span>
      </div>

      {/* Filter chips */}
      <div className="flex-shrink-0 flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide bg-white border-b border-slate-100">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap flex-shrink-0 transition-all ${
              activeFilter === f.key ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          </div>
        ) : (
          <MapContainer
            center={FIVE_TOWNS_CENTER}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <FitBounds markers={visibleMarkers} />
            {visibleMarkers.map(m => (
              <Marker
                key={m.id}
                position={m.coords}
                icon={makeIcon(m.type, selected?.id === m.id)}
                eventHandlers={{ click: () => setSelected(selected?.id === m.id ? null : m) }}
              />
            ))}
          </MapContainer>
        )}

        {/* Empty state */}
        {!loading && visibleMarkers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-2xl shadow-lg px-6 py-5 text-center mx-4">
              <p className="text-2xl mb-2">📍</p>
              <p className="font-bold text-slate-800 text-[14px]">No pins for this filter</p>
              <p className="text-[12px] text-slate-400 mt-1">Try selecting a different category</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected item card */}
      {selected && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-2xl" style={{ borderTop: '1px solid #E8EDF5' }}>
          <div className="flex items-start gap-3 p-4">
            {/* Icon / logo */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl overflow-hidden" style={{ background: TYPE_CONFIG[selected.type].color + '18' }}>
              {selected.type === 'community' && selected.logo
                ? <img src={selected.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                : <span>{TYPE_CONFIG[selected.type].emoji}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white" style={{ background: TYPE_CONFIG[selected.type].color }}>
                  {TYPE_CONFIG[selected.type].label}
                </span>
                {selected.isVerified && <span className="text-[10px] font-bold text-blue-600">✓ Verified</span>}
              </div>
              <p className="text-[15px] font-bold text-slate-900 leading-snug truncate">{selected.title}</p>
              {selected.body && <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{selected.body}</p>}
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                <span>📍 {selected.location}</span>
                {selected.date && <span>• 📅 {format(parseISO(selected.date), 'MMM d')}</span>}
                {selected.followers > 0 && <span>• 👥 {selected.followers} followers</span>}
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 rounded-full hover:bg-slate-100">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          {selected.type === 'community' && (
            <div className="px-4 pb-4">
              <button
                onClick={() => navigate(`${createPageUrl('Communities')}?community=${selected.entityId}`)}
                className="w-full py-2.5 rounded-xl text-white text-[13px] font-bold flex items-center justify-center gap-2"
                style={{ background: TYPE_CONFIG.community.color }}
              >
                <Users className="w-4 h-4" /> View Community
              </button>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className={`flex-shrink-0 bg-white border-t border-slate-100 px-4 py-2 flex items-center justify-center gap-5 ${selected ? 'hidden' : ''}`}>
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
            <span className="text-[11px] font-medium text-slate-500">{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}