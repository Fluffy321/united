import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hand, MapPin } from 'lucide-react';

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

// Calculate distance between two coordinates in miles
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function MitzvahMapView({ requests, userOrigin, currentUser, onSelectRequest, onHelpRequest, filters }) {
  const [mapCenter, setMapCenter] = useState([40.6223, -73.7159]); // Five Towns center
  const [mapZoom, setMapZoom] = useState(13);

  useEffect(() => {
    if (userOrigin && filters.location === 'near') {
      setMapCenter([userOrigin.lat, userOrigin.lng]);
      setMapZoom(14);
    } else {
      // Default to Five Towns area
      setMapCenter([40.6223, -73.7159]);
      setMapZoom(13);
    }
  }, [userOrigin, filters.location]);

  // Filter requests based on filters - only show open requests
  const filteredRequests = requests.filter(req => {
    if (req.status !== 'open') return false;
    if (filters.category !== 'All' && req.category !== filters.category) return false;
    
    if (filters.time === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reqDate = new Date(req.created_date);
      if (reqDate < today) return false;
    } else if (filters.time === 'thisweek') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const reqDate = new Date(req.created_date);
      if (reqDate < weekAgo) return false;
    }
    
    return req.approxLat && req.approxLng && !req.is_hidden;
  });

  const formatDistance = (dist) => {
    if (!dist) return null;
    if (dist < 0.5) return 'Nearby';
    return `${dist.toFixed(1)} mi`;
  };

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
        
        {userOrigin && (
          <Marker 
            position={[userOrigin.lat, userOrigin.lng]}
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

        {filteredRequests.map(request => {
          const distance = userOrigin 
            ? calculateDistance(userOrigin.lat, userOrigin.lng, request.approxLat, request.approxLng)
            : null;
          
          const isRequester = currentUser?.id === request.created_by_user_id;

          return (
            <Marker
              key={request.id}
              position={[request.approxLat, request.approxLng]}
              icon={createCustomIcon(CATEGORY_COLORS[request.category])}
            >
              <Popup maxWidth={280}>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className="text-xs font-semibold text-white border-0" 
                      style={{ backgroundColor: CATEGORY_COLORS[request.category] }}>
                      {request.category}
                    </Badge>
                    {distance && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <MapPin className="w-3 h-3 mr-1" />
                        {formatDistance(distance)}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-sm mb-1.5 text-slate-900">{request.title}</h3>
                  <p className="text-xs text-slate-600 mb-2 line-clamp-2">{request.description}</p>
                  
                  {request.locationLabel && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                      <MapPin className="w-3 h-3" />
                      {request.locationLabel}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onSelectRequest(request)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      View Details
                    </Button>
                    {!isRequester && request.status === 'open' && (
                      <Button
                        onClick={() => onHelpRequest(request)}
                        size="sm"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs"
                      >
                        <Hand className="w-3 h-3 mr-1" />
                        I'll Help
                      </Button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}