import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import MitzvahMapView from '@/components/mitzvah/MitzvahMapView';
import MitzvahDetailSheet from '@/components/mitzvah/MitzvahDetailSheet';
import { toast } from 'sonner';

const TOWN_CENTERS = {
  'Lawrence': { lat: 40.6157, lng: -73.7296 },
  'Cedarhurst': { lat: 40.6223, lng: -73.7246 },
  'Woodmere': { lat: 40.6323, lng: -73.7129 },
  'Hewlett': { lat: 40.6434, lng: -73.6946 },
  'Inwood': { lat: 40.6229, lng: -73.7501 }
};

const getUserOrigin = (user) => {
  if (user?.location_lat && user?.location_lng) return { lat: user.location_lat, lng: user.location_lng };
  if (user?.cityPreset && TOWN_CENTERS[user.cityPreset]) return TOWN_CENTERS[user.cityPreset];
  return null;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function MitzvahMap() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [scope, setScope] = useState('ALL'); // 'NEAR_ME' | 'ALL'
  const [liveLocation, setLiveLocation] = useState(null); // from device GPS

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
    });
  }, []);

  // When Near Me is tapped, try to get live GPS first
  const handleScopeChange = (s) => {
    setScope(s);
    if (s === 'NEAR_ME' && !liveLocation) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setLiveLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => toast('Enable location to use Near Me', { description: 'Showing Five Towns area instead.' })
      );
    }
  };

  const { data: requests = [], refetch } = useQuery({
    queryKey: ['mitzvah-map-requests'],
    queryFn: () => base44.entities.MitzvahRequest.filter({ status: 'open' }, '-created_date', 200),
    enabled: !!currentUser
  });

  const userOrigin = currentUser ? getUserOrigin(currentUser) : null;

  // Best available location: live GPS > profile preset
  const effectiveLocation = liveLocation || userOrigin;

  // Map center: Near Me = user location, All = Five Towns
  const FIVE_TOWNS = { lat: 40.6369, lng: -73.7142 };
  const mapCenter = scope === 'NEAR_ME' && effectiveLocation ? effectiveLocation : FIVE_TOWNS;
  const mapZoom  = scope === 'NEAR_ME' && effectiveLocation ? 14 : 12;

  // Single filtered dataset used by BOTH count and map pins
  const filteredRequests = useMemo(() => {
    const base = requests.filter(r => r.approxLat && r.approxLng && !r.is_hidden);
    if (scope === 'NEAR_ME' && effectiveLocation) {
      return base.filter(r => calculateDistance(effectiveLocation.lat, effectiveLocation.lng, r.approxLat, r.approxLng) <= 10);
    }
    return base;
  }, [requests, scope, effectiveLocation]);

  const handleHelpRequest = async (req) => {
    try {
      const helpOffer = await base44.entities.HelpOffer.create({
        request_id: req.id,
        helper_user_id: currentUser.id,
        helper_name: currentUser.display_name,
        status: 'active'
      });
      await base44.entities.MitzvahRequest.update(req.id, {
        status: 'in_progress',
        claimed_by_user_id: currentUser.id,
        claimed_by_name: currentUser.display_name
      });
      const conversations = await base44.entities.Conversation.filter({
        participant_ids: { $all: [currentUser.id, req.created_by_user_id] }
      });
      if (conversations.length > 0) {
        await base44.entities.HelpOffer.update(helpOffer.id, { conversation_id: conversations[0].id });
        navigate(createPageUrl('Messages') + `?conversation=${conversations[0].id}`);
      } else {
        const otherUser = await base44.entities.User.filter({ id: req.created_by_user_id });
        if (otherUser.length > 0) {
          const newConv = await base44.entities.Conversation.create({
            participant_ids: [currentUser.id, req.created_by_user_id],
            participant_names: [currentUser.display_name, otherUser[0].display_name],
            participant_ages: [currentUser.age_range, otherUser[0].age_range],
            last_message: '',
            last_message_at: new Date().toISOString(),
            request_id: req.id
          });
          await base44.entities.HelpOffer.update(helpOffer.id, { conversation_id: newConv.id });
          navigate(createPageUrl('Messages') + `?conversation=${newConv.id}`);
        }
      }
      refetch();
      toast.success("You've offered to help! 💙");
    } catch {
      toast.error('Failed to offer help');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'white', zIndex: 50 }}>
      {/* Header */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid #E8ECF4', background: 'white' }}
        className="flex items-center gap-3 px-4 h-12">
        <button
          onClick={() => navigate(createPageUrl('MitzvahCircle'))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F7FB] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
        </button>
        <span className="font-bold text-[#0F172A] text-[15px]">Mitzvah Map</span>

        {/* Near Me / All toggle — always visible */}
        <div className="ml-3 flex gap-1">
          {['NEAR_ME', 'ALL'].map(s => (
            <button
              key={s}
              onClick={() => handleScopeChange(s)}
              style={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
              className={`h-7 px-2.5 text-[11px] font-semibold rounded-full border transition-all flex items-center gap-0.5 ${
                scope === s
                  ? 'bg-[#0F172A] text-white border-[#0F172A]'
                  : 'bg-white text-[#667085] border-[#EAECF0]'
              }`}
            >
              {s === 'NEAR_ME' ? <><MapPin className="w-3 h-3" />Near Me</> : 'All'}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[12px] text-[#98A2B3]">
          {filteredRequests.length} open
        </span>
      </div>

      {/* Map fills remaining space — min-height:0 prevents flex overflow */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {currentUser ? (
          <MitzvahMapView
            key={`${scope}-${mapCenter.lat}-${mapCenter.lng}`}
            requests={filteredRequests}
            userOrigin={effectiveLocation}
            mapCenter={mapCenter}
            mapZoom={mapZoom}
            currentUser={currentUser}
            onSelectRequest={(req) => { setSelectedRequest(req); setShowDetailSheet(true); }}
            onHelpRequest={handleHelpRequest}
            filters={{ category: 'All', time: 'anytime' }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#0F1C2E] border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {selectedRequest && (
        <MitzvahDetailSheet
          request={selectedRequest}
          currentUser={currentUser}
          open={showDetailSheet}
          onClose={() => { setShowDetailSheet(false); setSelectedRequest(null); }}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}