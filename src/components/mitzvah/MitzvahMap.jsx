import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CATEGORY_COLORS = {
  'Errand': '#2563eb',
  'Lost & Found': '#9333ea',
  'Quick Favor': '#16a34a',
  'Tutoring': '#eab308',
  'Shabbat Help': '#4f46e5',
  'Other': '#64748b'
};

function MapController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  
  return null;
}

export default function MitzvahMap({ requests, userLocation, onSelectRequest }) {
  const [mapCenter, setMapCenter] = useState(null);

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    } else if (requests.length > 0 && requests[0].location_lat) {
      setMapCenter([requests[0].location_lat, requests[0].location_lng]);
    } else {
      // Default to Five Towns area
      setMapCenter([40.6249, -73.7178]);
    }
  }, [userLocation, requests]);

  const createMarkerIcon = (category) => {
    const color = CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
    return divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 16px;
          font-weight: bold;
          margin-top: -4px;
        ">📍</div>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  if (!mapCenter) {
    return (
      <div className="h-[500px] bg-slate-100 rounded-2xl flex items-center justify-center">
        <p className="text-slate-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] rounded-2xl overflow-hidden border-2 border-slate-200">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <MapController center={mapCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

        {requests.map(request => {
          if (!request.location_lat || !request.location_lng) return null;
          
          return (
            <Marker
              key={request.id}
              position={[request.location_lat, request.location_lng]}
              icon={createMarkerIcon(request.category)}
              eventHandlers={{
                click: () => onSelectRequest(request)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold mb-1">{request.title}</div>
                  <div className="text-slate-600 text-xs">{request.category}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}