import React, { useState, useEffect, useMemo } from 'react';
import { Plus, HandHeart, Clock, SlidersHorizontal } from 'lucide-react';
import ChesedHoursTab from '@/components/chesed/ChesedHoursTab';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MitzvahRequestCard from '@/components/mitzvah/MitzvahRequestCard';
import CreateMitzvahModal from '@/components/mitzvah/CreateMitzvahModal';
import LocationPrompt from '@/components/mitzvah/LocationPrompt';
import MitzvahDetailSheet from '@/components/mitzvah/MitzvahDetailSheet';
import PullDownMap from '@/components/mitzvah/PullDownMap';
import FilterDrawer from '@/components/mitzvah/FilterDrawer';
import RequestDetailOverlay from '@/components/mitzvah/RequestDetailOverlay';
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
  const [mainTab, setMainTab] = useState('circle'); // 'circle' | 'chesed'
  const [activeTab, setActiveTab] = useState('open');
  const [filters, setFilters] = useState({ scope: 'all', category: 'All' });
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
        const hasOrigin = (user.location_lat && user.location_lng) || (user.cityPreset && TOWN_CENTERS[user.cityPreset]);
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
  const mapZoom  = filters.scope === 'near' && userOrigin ? 14 : 12;

  // Single filtered dataset used by both list and map
  const requests = useMemo(() => {
    let list = rawRequests;
    if (filters.category !== 'All') {
      list = list.filter(r => r.category === filters.category);
    }
    if (filters.scope === 'near' && userOrigin) {
      list = list.filter(r => r.approxLat && r.approxLng &&
        calculateDistance(userOrigin.lat, userOrigin.lng, r.approxLat, r.approxLng) <= 10);
    }
    // Attach distance
    if (userOrigin) {
      list = list.map(r => ({
        ...r,
        distance: r.approxLat && r.approxLng
          ? calculateDistance(userOrigin.lat, userOrigin.lng, r.approxLat, r.approxLng)
          : 999
      })).sort((a, b) => a.distance - b.distance);
    }
    return list;
  }, [rawRequests, filters, userOrigin]);

  const handleFilterApply = (newFilters) => {
    // If Near Me requested, try to get GPS
    if (newFilters.scope === 'near' && !liveLocation) {
      navigator.geolocation?.getCurrentPosition(
        pos => setLiveLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => toast.error('Location denied. Showing Five Towns area.')
      );
    }
    setFilters(newFilters);
  };

  const claimMutation = useMutation({
    mutationFn: async (request) => {
      await base44.entities.MitzvahRequest.update(request.id, {
        status: 'Claimed',
        claimed_by_user_id: currentUser.id,
        claimed_by_name: currentUser.display_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] });
      toast.success('You\'ve claimed this mitzvah! 💙');
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

  const handleClaim = (request) => {
    claimMutation.mutate(request);
  };

  const handleComplete = (request) => {
    completeMutation.mutate(request);
  };

  const handleMessage = async (userId) => {
    const conversations = await base44.entities.Conversation.filter({ 
      participant_ids: { $all: [currentUser.id, userId] } 
    });
    
    if (conversations.length > 0) {
      navigate(createPageUrl('Messages') + `?conversation=${conversations[0].id}`);
    } else {
      const otherUser = await base44.entities.User.filter({ id: userId });
      if (otherUser.length > 0) {
        const newConversation = await base44.entities.Conversation.create({
          participant_ids: [currentUser.id, userId],
          participant_names: [currentUser.display_name, otherUser[0].display_name],
          participant_ages: [currentUser.age_range, otherUser[0].age_range],
          last_message: '',
          last_message_at: new Date().toISOString()
        });
        navigate(createPageUrl('Messages') + `?conversation=${newConversation.id}`);
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0F1C2E] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!currentUser.is_profile_complete) {
    return <ProfileSetup user={currentUser} onComplete={loadUser} />;
  }

  return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
        {/* Compact Header */}
        <div className="bg-white sticky top-0 z-10 flex-shrink-0" style={{ borderBottom: '1px solid #E8ECF4' }}>
          <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
            <span className="font-bold text-[#0F172A] text-[16px] tracking-[-0.01em]">Mitzvah Circle</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMainTab('circle')}
                className={`h-8 px-3 text-[12px] font-semibold rounded-full transition-colors ${mainTab === 'circle' ? 'bg-[#0F172A] text-white' : 'text-[#6B7280] hover:bg-[#F5F7FB]'}`}
              >
                <HandHeart className="w-3.5 h-3.5 inline mr-1" />Requests
              </button>
              <button
                onClick={() => setMainTab('chesed')}
                className={`h-8 px-3 text-[12px] font-semibold rounded-full transition-colors ${mainTab === 'chesed' ? 'bg-[#2563EB] text-white' : 'text-[#6B7280] hover:bg-[#F5F7FB]'}`}
              >
                <Clock className="w-3.5 h-3.5 inline mr-1" />My Hours
              </button>
              {mainTab === 'circle' && (
                <button
                  onClick={() => setShowFilterDrawer(true)}
                  style={{
                    marginLeft: 4, width: 34, height: 34, borderRadius: 999,
                    background: (filters.scope !== 'all' || filters.category !== 'All') ? '#0F172A' : '#F1F5F9',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <SlidersHorizontal size={16} color={(filters.scope !== 'all' || filters.category !== 'All') ? 'white' : '#374151'} />
                </button>
              )}
            </div>
          </div>
        </div>

        {mainTab === 'chesed' && <ChesedHoursTab currentUser={currentUser} />}

        {mainTab === 'circle' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#F7F8FA' }}>

            {/* Pull-down map */}
            <PullDownMap
              requests={requests}
              userOrigin={userOrigin}
              mapCenter={mapCenter}
              mapZoom={mapZoom}
              currentUser={currentUser}
              onSelectRequest={(req) => setSelectedRequest(req)}
              onHelpRequest={() => {}}
            />

            {/* Status tabs + filter pills */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-shrink-0 bg-white" style={{ borderBottom: '1px solid #F0F3F9' }}>
              {['open', 'completed'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`h-8 px-3.5 text-[12px] font-semibold rounded-full border transition-all ${
                    activeTab === tab
                      ? 'bg-[#0F1C2E] text-white border-[#0F1C2E]'
                      : 'bg-white text-[#667085] border-[#EAECF0]'
                  }`}
                >
                  {tab === 'open' ? 'Needs Help' : 'Completed'}
                </button>
              ))}
              {filters.scope === 'near' && (
                <span style={{ fontSize: 11, fontWeight: 600, background: '#EEF2FF', color: '#4F46E5', borderRadius: 999, padding: '3px 10px' }}>
                  📍 Near Me
                </span>
              )}
              {filters.category !== 'All' && (
                <span style={{ fontSize: 11, fontWeight: 600, background: '#F1F5F9', color: '#374151', borderRadius: 999, padding: '3px 10px' }}>
                  {filters.category}
                </span>
              )}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 112px', WebkitOverflowScrolling: 'touch' }}>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-[14px] border border-[#EAECF0] p-4">
                      <div className="flex items-start gap-3">
                        <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-3.5 w-40 rounded" />
                          <div className="skeleton h-3 w-full rounded" />
                          <div className="skeleton h-3 w-3/4 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-14 bg-white rounded-[14px] border border-[#EAECF0]">
                  <div className="w-14 h-14 rounded-full bg-[#F2F4F7] flex items-center justify-center mx-auto mb-3">
                    <HandHeart className="w-6 h-6 text-[#98A2B3]" />
                  </div>
                  <p className="text-[15px] font-semibold text-[#0F1C2E]">
                    {activeTab === 'open' ? 'No open requests' : 'No completed mitzvahs yet'}
                  </p>
                  <p className="text-[13px] text-[#98A2B3] mt-1">
                    {activeTab === 'open' ? 'Check back soon!' : 'Be the first to help!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {requests.map(request => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      style={{ cursor: 'pointer' }}
                    >
                      <MitzvahRequestCard
                        request={request}
                        currentUser={currentUser}
                        onClaim={handleClaim}
                        onMessage={handleMessage}
                        onComplete={handleComplete}
                        showDistance={!!userOrigin && request.distance !== undefined && request.distance < 999}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Button */}
            {isActive && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="fixed bottom-[80px] right-4 z-30 flex items-center gap-2 bg-[#0F172A] text-white text-[14px] font-semibold px-5 py-2.5 rounded-full active:scale-95 transition-all"
                style={{ boxShadow: '0 4px 14px rgba(15,23,42,0.35)' }}
              >
                <Plus className="w-4 h-4" />
                Request
              </button>
            )}
          </div>
        )}

        {/* Fullscreen Request Detail Overlay */}
        {selectedRequest && (
          <RequestDetailOverlay
            request={selectedRequest}
            currentUser={currentUser}
            onClose={() => setSelectedRequest(null)}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] })}
          />
        )}

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


      </div>
    );
}