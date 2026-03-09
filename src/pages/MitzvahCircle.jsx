import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, HandHeart, Clock, SlidersHorizontal, ChevronUp, Map as MapIcon, GripHorizontal } from 'lucide-react';
import MitzvahMapView from '@/components/mitzvah/MitzvahMapView';
import ChesedHoursTab from '@/components/chesed/ChesedHoursTab';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MitzvahRequestCard from '@/components/mitzvah/MitzvahRequestCard';
import CreateMitzvahModal from '@/components/mitzvah/CreateMitzvahModal';
import LocationPrompt from '@/components/mitzvah/LocationPrompt';
import MitzvahDetailSheet from '@/components/mitzvah/MitzvahDetailSheet';
import FilterDrawer from '@/components/mitzvah/FilterDrawer';
import RequestDetailOverlay from '@/components/mitzvah/RequestDetailOverlay';
import MitzvahTabHeader from '@/components/mitzvah/MitzvahTabHeader';
import ProfileSetup from '@/components/profile/ProfileSetup';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Town center coordinates for Five Towns
const TOWN_CENTERS = {
  'Lawrence': { lat: 40.6157, lng: -73.7296 },
  'Cedarhurst': { lat: 40.6223, lng: -73.7246 },
  'Woodmere': { lat: 40.6323, lng: -73.7129 },
  'Hewlett': { lat: 40.6434, lng: -73.6946 },
  'Inwood': { lat: 40.6229, lng: -73.7501 }
};

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

// Get user's origin point for distance calculations
const getUserOrigin = (user) => {
  // Prefer device geolocation
  if (user?.location_lat && user?.location_lng) {
    return { lat: user.location_lat, lng: user.location_lng };
  }
  // Fallback to selected town center
  if (user?.cityPreset && TOWN_CENTERS[user.cityPreset]) {
    return TOWN_CENTERS[user.cityPreset];
  }
  return null;
};

export default function MitzvahCircle({ isActive = true }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({ scope: 'all', category: 'All' });
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showLogMitzvah, setShowLogMitzvah] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Refs
  const mapRef = useRef(null); // Leaflet map instance
  const dragState = useRef(null); // tracks pointer drag
  const rafRef = useRef(null); // RAF id
  const listScrollRef = useRef(null); // scrollable list container
  const SNAP_EXPANDED = Math.round(window.innerHeight * 0.42);
  const SNAP_COLLAPSED = 0;

  // Toggle via button (snap to full or zero)
  const toggleMap = useCallback(() => {
    const next = mapH > 0 ? SNAP_COLLAPSED : SNAP_EXPANDED;
    setMapH(next);
    setMapPanelState(next > 0 ? 'EXPANDED' : 'COLLAPSED');
    // Invalidate after CSS transition (~280ms)
    setTimeout(() => {mapRef.current?.invalidateSize();}, 300);
  }, [mapH, SNAP_EXPANDED]);

  // --- Drag-to-resize handle logic ---
  const onHandlePointerDown = useCallback((e) => {
    // Only drag from the handle, and only when list is at top
    if (listScrollRef.current && listScrollRef.current.scrollTop > 2) return;

    e.preventDefault();
    e.stopPropagation();

    // Disable map interactions while dragging
    if (mapRef.current) {
      mapRef.current.dragging.disable();
      mapRef.current.scrollWheelZoom.disable();
      mapRef.current.touchZoom?.disable();
    }

    dragState.current = {
      startY: e.clientY ?? e.touches?.[0]?.clientY,
      startH: mapH
    };

    const onMove = (ev) => {
      const clientY = ev.clientY ?? ev.touches?.[0]?.clientY;
      if (clientY == null || !dragState.current) return;
      const delta = clientY - dragState.current.startY;
      const nextH = Math.max(0, Math.min(SNAP_EXPANDED * 1.2, dragState.current.startH + delta));

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setMapH(nextH);
      });
    };

    const onUp = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      // Snap to nearest state
      const snapped = mapH > SNAP_EXPANDED * 0.3 ? SNAP_EXPANDED : SNAP_COLLAPSED;
      setMapH(snapped);
      setMapPanelState(snapped > 0 ? 'EXPANDED' : 'COLLAPSED');

      // Re-enable map interactions
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.dragging.enable();
          mapRef.current.scrollWheelZoom.enable();
          mapRef.current.touchZoom?.enable();
          mapRef.current.invalidateSize();
        }
      }, 50);

      dragState.current = null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
  }, [mapH, SNAP_EXPANDED]);

  useEffect(() => {
    loadUser();
    autoSeedOnce();
  }, []);

  const autoSeedOnce = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') return;

      const hasSeeded = localStorage.getItem('seededLaunchContent');
      if (hasSeeded === 'true') return;

      const result = await base44.functions.invoke('seedLaunchContent', {});
      if (result.data?.seeded) {
        localStorage.setItem('seededLaunchContent', 'true');
        queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] });
      }
    } catch (error) {
      console.error('Auto-seed failed:', error);
    }
  };

  const loadUser = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);

    // Check if prompt was dismissed
    const hasOrigin = user.location_lat && user.location_lng || user.cityPreset && TOWN_CENTERS[user.cityPreset];
    if (!hasOrigin) {
      const dismissed = localStorage.getItem('locationPromptDismissed');
      if (!dismissed) setTimeout(() => setShowLocationPrompt(true), 2000);
    }
  };

  // Fetch all open/completed requests; apply filters in-memory so map+list stay in sync
  const { data: rawRequests = [], isLoading } = useQuery({
    queryKey: ['mitzvah-requests', activeTab],
    queryFn: async () => {
      const status = activeTab === 'open' ? 'open' : 'completed';
      return base44.entities.MitzvahRequest.filter({ status }, '-created_date', 100);
    },
    enabled: !!currentUser
  });

  const userOrigin = useMemo(() => liveLocation || getUserOrigin(currentUser), [liveLocation, currentUser]);

  const FIVE_TOWNS = { lat: 40.6369, lng: -73.7142 };
  const mapCenter = filters.scope === 'near' && userOrigin ? userOrigin : FIVE_TOWNS;
  const mapZoom = filters.scope === 'near' && userOrigin ? 14 : 12;

  // Single filtered dataset used by both list and map
  const requests = useMemo(() => {
    let list = rawRequests;
    if (filters.category !== 'All') {
      list = list.filter((r) => r.category === filters.category);
    }
    if (filters.scope === 'near' && userOrigin) {
      list = list.filter((r) => r.approxLat && r.approxLng &&
      calculateDistance(userOrigin.lat, userOrigin.lng, r.approxLat, r.approxLng) <= 10);
    }
    // Attach distance
    if (userOrigin) {
      list = list.map((r) => ({
        ...r,
        distance: r.approxLat && r.approxLng ?
        calculateDistance(userOrigin.lat, userOrigin.lng, r.approxLat, r.approxLng) :
        999
      })).sort((a, b) => a.distance - b.distance);
    }
    return list;
  }, [rawRequests, filters, userOrigin]);



  const handleFilterApply = (newFilters) => {
    // If Near Me requested, try to get GPS
    if (newFilters.scope === 'near' && !liveLocation) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setLiveLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => toast.error('Location denied. Showing Five Towns area.')
      );
    }
    setFilters(newFilters);
  };

  const claimMutation = useMutation({
    mutationFn: async (request) => {
      // Update the request
      await base44.entities.MitzvahRequest.update(request.id, {
        status: 'in_progress',
        claimed_by_user_id: currentUser.id,
        claimed_by_name: currentUser.display_name || currentUser.full_name,
        offers_count: (request.offers_count || 0) + 1,
      });

      // Create signup record
      await base44.entities.MitzvahSignup.create({
        request_id: request.id,
        user_id: currentUser.id,
        user_name: currentUser.display_name || currentUser.full_name,
        status: 'JOINED',
        joined_at: new Date().toISOString(),
      });

      // Find or create a conversation for coordination
      const existingConvs = await base44.entities.Conversation.filter({ request_id: request.id });
      const existingLinked = existingConvs.find(c => c.participant_ids?.includes(currentUser.id));
      let conversation = existingLinked;

      if (!conversation) {
        const [requester] = await base44.entities.User.filter({ id: request.created_by_user_id });
        conversation = await base44.entities.Conversation.create({
          participant_ids: [currentUser.id, request.created_by_user_id],
          participant_names: [currentUser.display_name || currentUser.full_name, requester?.display_name || requester?.full_name],
          participant_ages: [currentUser.age_range || '18+', requester?.age_range || '18+'],
          last_message: `Hi! I can help with "${request.title}".`,
          last_message_at: new Date().toISOString(),
          request_id: request.id
        });

        // Send intro message
        await base44.entities.Message.create({
          conversation_id: conversation.id,
          sender_id: currentUser.id,
          sender_name: currentUser.display_name || currentUser.full_name,
          sender_age_range: currentUser.age_range || '18+',
          recipient_id: request.created_by_user_id,
          content: `Hi! I'm available to help with "${request.title}". What details do you need from me?`
        });
      }

      return conversation;
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] });
      toast.success("You've claimed this mitzvah! Opening chat... 💙");
      navigate(createPageUrl('Messages') + `?conversation=${conversation.id}`);
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (request) => {
      // Update request status
      await base44.entities.MitzvahRequest.update(request.id, {
        status: 'Completed',
        completed_at: new Date().toISOString()
      });

      // Award points to helper
      await base44.entities.MitzvahAction.create({
        user_id: request.claimed_by_user_id,
        user_name: request.claimed_by_name,
        request_id: request.id,
        request_title: request.title,
        points_awarded: 10
      });

      // Update total points
      const existingPoints = await base44.entities.MitzvahPoints.filter({ user_id: request.claimed_by_user_id });
      if (existingPoints.length > 0) {
        await base44.entities.MitzvahPoints.update(existingPoints[0].id, {
          total_points: existingPoints[0].total_points + 10
        });
      } else {
        await base44.entities.MitzvahPoints.create({
          user_id: request.claimed_by_user_id,
          user_name: request.claimed_by_name,
          total_points: 10
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] });
      toast.success('Mitzvah completed! ✨');
    }
  });

  const handleClaim = (e, request) => {
    if (e?.stopPropagation) e.stopPropagation();
    claimMutation.mutate(request);
  };

  const handleComplete = (request) => {
    completeMutation.mutate(request);
  };

  const handleMessage = async (request) => {
    const otherUserId = currentUser.id === request.created_by_user_id
      ? request.claimed_by_user_id
      : request.created_by_user_id;

    // First try to find a conversation linked to this specific request
    const linkedConvs = await base44.entities.Conversation.filter({ request_id: request.id });
    const linked = linkedConvs.find(c => c.participant_ids?.includes(currentUser.id));

    if (linked) {
      navigate(createPageUrl('Messages') + `?conversation=${linked.id}`);
      return;
    }

    // Fallback: find or create a general conversation between participants
    const allConvs = await base44.entities.Conversation.filter({});
    const existing = allConvs.find(c =>
      c.participant_ids?.includes(currentUser.id) &&
      c.participant_ids?.includes(otherUserId) &&
      c.request_id === request.id
    );

    if (existing) {
      navigate(createPageUrl('Messages') + `?conversation=${existing.id}`);
      return;
    }

    // Create new conversation linked to this request
    const [otherUser] = await base44.entities.User.filter({ id: otherUserId });
    const newConv = await base44.entities.Conversation.create({
      participant_ids: [currentUser.id, otherUserId],
      participant_names: [currentUser.display_name || currentUser.full_name, otherUser?.display_name || otherUser?.full_name],
      participant_ages: [currentUser.age_range || '18+', otherUser?.age_range || '18+'],
      last_message: '',
      last_message_at: new Date().toISOString(),
      request_id: request.id
    });
    navigate(createPageUrl('Messages') + `?conversation=${newConv.id}`);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0F1C2E] border-t-transparent animate-spin" />
      </div>);

  }

  if (!currentUser.is_profile_complete) {
    return <ProfileSetup user={currentUser} onComplete={loadUser} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 flex-shrink-0" style={{ borderBottom: '1px solid #E8ECF4' }}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-[20px] font-bold text-slate-900">Mitzvah Circle</h1>
          <p className="text-[13px] text-slate-500 mt-1">Helping the community together</p>
        </div>
      </div>

      {/* Main Content */}
      <div ref={listScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Help Requests Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">Help Requests</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">{requests.length} {requests.length === 1 ? 'person needs' : 'people need'} help</p>
              </div>
              <button
                onClick={() => setShowFilterDrawer(true)}
                className={`p-2 rounded-full transition-colors ${
                  filters.scope !== 'all' || filters.category !== 'All'
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-[16px] border border-[#EAECF0] p-4">
                    <div className="flex items-start gap-3">
                      <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3.5 w-40 rounded" />
                        <div className="skeleton h-3 w-full rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-[16px] border border-[#EAECF0]">
                <div className="w-14 h-14 rounded-full bg-[#F2F4F7] flex items-center justify-center mx-auto mb-3">
                  <HandHeart className="w-6 h-6 text-[#98A2B3]" />
                </div>
                <p className="text-[14px] font-semibold text-[#0F1C2E]">No open requests</p>
                <p className="text-[12px] text-[#98A2B3] mt-1">Check back soon</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="bg-white rounded-[16px] border border-[#EAECF0] p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedRequest(request)}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-slate-900">{request.title}</p>
                        <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{request.description}</p>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 flex-shrink-0">
                        {request.category}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleClaim(e, request); }}
                      disabled={claimMutation.isPending}
                      className="w-full mt-3 py-2 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[12px] font-semibold transition-colors disabled:opacity-50"
                    >
                      {claimMutation.isPending ? 'Joining...' : "I'll Help"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Request Help CTA */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[16px] border border-blue-200 p-4 text-center">
            <p className="text-[13px] text-slate-700 mb-3">Need help with something?</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors"
            >
              Post a Request
            </button>
          </div>
        </div>
      </div>

        {/* Modals */}
        <CreateMitzvahModal
          open={showCreateModal}
          onOpenChange={(open) => {
            setShowCreateModal(open);
            if (!open) queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] });
          }}
          currentUser={currentUser}
        />

        <FilterDrawer
          open={showFilterDrawer}
          onClose={() => setShowFilterDrawer(false)}
          initialFilters={filters}
          onApply={handleFilterApply}
        />

        <LocationPrompt
          show={showLocationPrompt}
          onDismiss={() => setShowLocationPrompt(false)}
          onLocationSet={() => {
            setShowLocationPrompt(false);
            loadUser();
            queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] });
          }}
        />

        {/* Detail overlay */}
        {selectedRequest && (
          <RequestDetailOverlay
            request={selectedRequest}
            currentUser={currentUser}
            onClose={() => setSelectedRequest(null)}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] })}
            overlayStyle={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
              background: '#ffffff',
              overflowY: 'auto',
              pointerEvents: 'auto'
            }}
          />
        )}
      </div>
    );
}