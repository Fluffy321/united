import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hand, Eye, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Category colors for pins
const CATEGORY_COLORS = {
  'Errand': '#2563eb',
  'Lost & Found': '#9333ea',
  'Quick Favor': '#16a34a',
  'Tutoring': '#eab308',
  'Shabbat Help': '#4f46e5',
  'Other': '#64748b'
};

// Create custom colored markers
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function MitzvahMapView({ requests, userLocation, onSelectRequest, filters }) {
  const [mapCenter, setMapCenter] = useState([40.6223, -73.7159]); // Five Towns center
  const [mapZoom, setMapZoom] = useState(13);

  useEffect(() => {
    if (userLocation && filters.location === 'near') {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(14);
    } else {
      // Default to Five Towns area
      setMapCenter([40.6223, -73.7159]);
      setMapZoom(13);
    }
  }, [userLocation, filters.location]);

  // Filter requests based on filters
  const filteredRequests = requests.filter(req => {
    if (filters.category !== 'All' && req.category !== filters.category) return false;
    
    if (filters.time === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reqDate = new Date(req.created_date);
      if (reqDate < today) return false;
    } else if (filters.time === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const reqDate = new Date(req.created_date);
      if (reqDate < weekAgo) return false;
    }
    
    return req.location_lat && req.location_lng && !req.is_hidden;
  });

  return (
    <div className="relative">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        className="h-[calc(100vh-280px)] rounded-2xl z-0"
        scrollWheelZoom={true}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: 'user-location-marker',
              html: `<div style="
                background-color: #3b82f6;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
              "></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          >
            <Popup>
              <div className="text-sm font-medium">You are here</div>
            </Popup>
          </Marker>
        )}

        <MarkerClusterGroup chunkedLoading>
          {filteredRequests.map(request => (
            <Marker
              key={request.id}
              position={[request.location_lat, request.location_lng]}
              icon={createCustomIcon(CATEGORY_COLORS[request.category])}
              eventHandlers={{
                click: () => onSelectRequest(request)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <Badge className="mb-2" style={{ backgroundColor: CATEGORY_COLORS[request.category] }}>
                    {request.category}
                  </Badge>
                  <h3 className="font-bold text-sm mb-1">{request.title}</h3>
                  <p className="text-xs text-slate-600 mb-2 line-clamp-2">{request.description}</p>
                  {request.location_label && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                      <MapPin className="w-3 h-3" />
                      {request.location_label}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(request.created_date), { addSuffix: true })}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => onSelectRequest(request)}
                  >
                    View Details
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}