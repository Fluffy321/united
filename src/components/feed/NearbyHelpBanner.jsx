import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, X, Loader2, Hand } from 'lucide-react';
import { dataService, storageService } from '@/services';
import { formatDistanceToNow } from 'date-fns';

const MILES_TO_KM = 1.60934;
const RADIUS_MILES = 5;

function getDistanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyHelpBanner({ currentUser, onClaim }) {
  const [status, setStatus] = useState('idle'); // idle | requesting | granted | denied | loading | done
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    // Check if already granted from a previous session
    const cached = storageService.getItem('userCoords');
    if (cached) {
      try {
        const coords = JSON.parse(cached);
        setUserCoords(coords);
        setStatus('loading');
        fetchNearby(coords);
      } catch {}
    }
  }, []);

  const requestLocation = () => {
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        storageService.setJson('userCoords', coords);
        setUserCoords(coords);
        setStatus('loading');
        fetchNearby(coords);
      },
      () => setStatus('denied')
    );
  };

  const fetchNearby = async (coords) => {
    try {
      const requests = await dataService.entities.MitzvahRequest.filter({ status: 'open' }, '-created_date', 50);
      const withDistance = requests
        .filter(r => r.approxLat && r.approxLng)
        .map(r => ({
          ...r,
          distance: getDistanceMiles(coords.lat, coords.lng, r.approxLat, r.approxLng)
        }))
        .filter(r => r.distance <= RADIUS_MILES)
        .sort((a, b) => a.distance - b.distance);
      setNearbyRequests(withDistance);
      setStatus('done');
    } catch {
      setStatus('done');
    }
  };

  if (dismissed) return null;

  // Prompt to enable location
  if (status === 'idle') {
    return (
      <div className="bg-white border border-emerald-200 rounded-[14px] p-4 mb-3 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200"
        >
          <X className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Navigation className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-[14px] text-[#0F1C2E]">Help Within 5 Miles</p>
            <p className="text-[12px] text-slate-500">See who needs help near you right now</p>
          </div>
        </div>
        <button
          onClick={requestLocation}
          className="w-full bg-emerald-600 text-white font-bold text-[13px] py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all mt-3"
        >
          <MapPin className="w-3.5 h-3.5" />
          Enable Location
        </button>
      </div>
    );
  }

  if (status === 'requesting' || status === 'loading') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-[14px] p-4 mb-3 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin flex-shrink-0" />
        <p className="text-[13px] font-semibold text-emerald-800">Finding nearby help requests…</p>
      </div>
    );
  }

  if (status === 'denied') {
    return null; // silently hide if denied
  }

  if (status === 'done' && nearbyRequests.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-[14px] p-4 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-[13px] font-semibold text-emerald-800">No open requests within 5 miles 🎉</p>
        </div>
        <button onClick={() => setDismissed(true)}><X className="w-4 h-4 text-emerald-400" /></button>
      </div>
    );
  }

  if (status === 'done' && nearbyRequests.length > 0) {
    return (
      <div className="bg-white border border-emerald-200 rounded-[14px] overflow-hidden mb-3" style={{ boxShadow: '0 2px 8px rgba(16,185,129,0.10)' }}>
        {/* Header */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-[13px] text-emerald-800">
              {nearbyRequests.length} {nearbyRequests.length === 1 ? 'request' : 'requests'} within 5 miles
            </span>
          </div>
          <button onClick={() => setDismissed(true)} className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100">
            <X className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>

        {/* Requests list */}
        <div className="divide-y divide-slate-100">
          {nearbyRequests.slice(0, 3).map(req => (
            <div key={req.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-[#0F1C2E] truncate">{req.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {req.distance < 0.2 ? 'Nearby' : `${req.distance.toFixed(1)} mi`}
                  </span>
                  <span className="text-[11px] text-slate-400">·</span>
                  <span className="text-[11px] text-slate-400">{req.category}</span>
                  <span className="text-[11px] text-slate-400">·</span>
                  <span className="text-[11px] text-slate-400">{formatDistanceToNow(new Date(req.created_date), { addSuffix: true })}</span>
                </div>
              </div>
              <button
                onClick={() => onClaim(req)}
                className="flex-shrink-0 bg-emerald-600 text-white text-[12px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-all"
              >
                <Hand className="w-3 h-3" />
                Help
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
