import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { ExternalLink, MapPin, Navigation, ShieldCheck, Store } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [40.6249, -73.7178];

function MapController({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

function businessIcon(business) {
  const initials = (business.name || 'B')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return divIcon({
    html: `<div style="background:#2563eb;color:white;border:3px solid white;box-shadow:0 10px 24px rgba(15,94,215,.28);width:42px;height:42px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;">${initials}</div>`,
    className: '',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

function directionsUrl(business) {
  const query = business.address || `${business.location_lat},${business.location_lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function BusinessMap({ businesses = [], userLocation }) {
  const [selectedId, setSelectedId] = useState(businesses[0]?.id || null);
  const selected = businesses.find((business) => business.id === selectedId) || businesses[0] || null;

  const center = useMemo(() => {
    if (selected?.location_lat && selected?.location_lng) return [Number(selected.location_lat), Number(selected.location_lng)];
    if (userLocation?.lat && userLocation?.lng) return [userLocation.lat, userLocation.lng];
    return DEFAULT_CENTER;
  }, [selected, userLocation]);

  if (businesses.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[26px] border border-dashed border-slate-200 bg-white p-6 text-center">
        <MapPin className="h-10 w-10 text-slate-300" />
        <p className="mt-3 text-base font-black text-slate-900">No approved map pins for this view</p>
        <p className="mt-1 max-w-sm text-sm font-semibold leading-6 text-slate-500">
          Choose another category, or list a business with a public location so it can be reviewed for the map.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="relative h-[460px] min-h-[420px]">
        <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="h-full w-full">
          <MapController center={center} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {businesses.map((business) => (
            <Marker
              key={business.id}
              position={[Number(business.location_lat), Number(business.location_lng)]}
              icon={businessIcon(business)}
              eventHandlers={{ click: () => setSelectedId(business.id) }}
            />
          ))}
        </MapContainer>

        {selected && (
          <div className="absolute inset-x-3 bottom-3 z-[500] rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-black text-slate-950">{selected.name}</p>
                  {selected.jewish_owned_status === 'verified' && (
                    <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                  )}
                </div>
                <p className="mt-0.5 text-xs font-bold text-slate-500">{selected.neighborhood || selected.city || selected.address}</p>
                <div className="mt-2 flex gap-2">
                  {selected.website && (
                    <a
                      href={selected.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Website
                    </a>
                  )}
                  <a
                    href={directionsUrl(selected)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-950 px-3 text-[11px] font-black text-white"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Directions
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
