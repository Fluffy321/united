import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, HandHeart, SlidersHorizontal, Bell, AlertCircle, Flame, Heart, BookOpen, Users, Coffee, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import LogMitzvahModal from '@/components/feed/LogMitzvahModal';
import CommunityAlertModal from '@/components/feed/CommunityAlertModal';
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
import MitzvahTabs from '@/components/mitzvah/MitzvahTabs';
import MyMitzvahLogTab from '@/components/mitzvah/MyMitzvahLogTab';
import CompletedMitzvahs from '@/components/mitzvah/CompletedMitzvahs';
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
  const [activeTab, setActiveTab] = useState('requests');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Refs
  const listScrollRef = useRef(null);

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
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Check if prompt was dismissed
      const hasOrigin = user?.location_lat && user?.location_lng || user?.cityPreset && TOWN_CENTERS[user?.cityPreset];
      if (!hasOrigin) {
        const dismissed = localStorage.getItem('locationPromptDismissed');
        if (!dismissed) setTimeout(() => setShowLocationPrompt(true), 2000);
      }
    } catch (e) {
      // Not logged in — show page as guest
      setCurrentUser({ id: 'guest', full_name: 'Guest', display_name: 'Guest', role: 'user', is_profile_complete: true });
    }
  };

  // Fetch all open requests
  const { data: rawRequests = [], isLoading } = useQuery({
    queryKey: ['mitzvah-requests'],
    queryFn: async () => {
      return base44.entities.MitzvahRequest.filter({ status: 'open' }, '-created_date', 100);
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

  const { data: userStreak, refetch: refetchStreak } = useQuery({
    queryKey: ['user-streak', currentUser?.id],
    queryFn: async () => {
      const existing = await base44.entities.UserStreak.filter({ user_id: currentUser.id });
      if (existing.length > 0) return existing[0];
      return base44.entities.UserStreak.create({
        user_id: currentUser.id,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: format(new Date(), 'yyyy-MM-dd'),
        badge_level: 'none'
      });
    },
    enabled: !!currentUser,
    staleTime: 1800000,
    gcTime: 2400000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  const { data: todayMitzvahCount = 0 } = useQuery({
    queryKey: ['today-mitzvah-count', currentUser?.id],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const logs = await base44.entities.MitzvahLog.filter({ user_id: currentUser.id, date: today });
      return logs.length;
    },
    enabled: !!currentUser,
    staleTime: 600000,
    gcTime: 600000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1
  });

  const handleClaim = (e, request) => {
    if (e?.stopPropagation) e.stopPropagation();
    claimMutation.mutate(request);
  };

  const handleLogMitzvah = async ({ description, category, reflection }) => {
    try {
      await base44.entities.MitzvahLog.create({
        user_id: currentUser.id,
        user_name: currentUser.display_name || currentUser.full_name,
        description,
        category,
        reflection,
        date: format(new Date(), 'yyyy-MM-dd')
      });

      await refetchStreak();
      queryClient.invalidateQueries({ queryKey: ['today-mitzvah-count'] });
      queryClient.invalidateQueries({ queryKey: ['user-streak'] });
      toast.success('Mitzvah logged! 💜');
      setShowLogMitzvah(false);
    } catch (error) {
      toast.error('Failed to log mitzvah');
    }
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
      </div>
    );
  }

  if (!currentUser.is_profile_complete) {
    return <ProfileSetup user={currentUser} onComplete={loadUser} />;
  }

  return (
    <>
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #F0F6FF 0%, #FAF5FF 30%, #F8FAFC 100%)' }}>
        {/* Header */}
        <div className="sticky top-0 z-20 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)' }}>
          <div className="max-w-2xl mx-auto px-4 py-5">
            <h1 className="text-[22px] font-bold text-white">Mitzvah Circle</h1>
            <p className="text-[13px] text-white/70 mt-0.5">Helping the community together</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <MitzvahTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <div ref={listScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', WebkitOverflowScrolling: 'touch' }}>
          {/* Tab: Help Requests */}
          {activeTab === 'requests' && (
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-[14px] p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}
                >
                  <Plus className="w-5 h-5 text-white" />
                  <span className="text-[12px] font-bold text-white text-center">Request Help</span>
                </button>
                <button
                  onClick={() => setShowFilterDrawer(true)}
                  className="rounded-[14px] p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}
                >
                  <HandHeart className="w-5 h-5 text-white" />
                  <span className="text-[12px] font-bold text-white text-center">Offer Help</span>
                </button>
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="rounded-[14px] p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
                >
                  <AlertCircle className="w-5 h-5 text-white" />
                  <span className="text-[12px] font-bold text-white text-center">Alert</span>
                </button>
              </div>

              {/* Your Daily Mitzvah HERO */}
              <div
                className="rounded-[20px] p-5 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #6D28D9 0%, #4F46E5 60%, #2563EB 100%)',
                  boxShadow: '0 8px 32px rgba(109,40,217,0.45)',
                }}
              >
                {/* Glow orbs */}
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">✡️</span>
                    <h3 className="text-[18px] font-bold text-white">Your Daily Mitzvah</h3>
                  </div>
                  <p className="text-white/70 text-[13px] mb-4">Do good, every single day</p>

                  <div className="bg-white/15 backdrop-blur rounded-[14px] p-3.5 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-semibold text-white/80">Current Streak</span>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        {Math.max(0, 2 - (todayMitzvahCount || 0))} more to keep it going
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-5 h-5 text-orange-300" />
                      <span className="text-[28px] font-black text-white">{userStreak?.current_streak || 0}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowLogMitzvah(true)}
                    className="w-full py-3 rounded-[12px] font-bold text-[14px] text-purple-700 transition-all active:scale-95 hover:shadow-lg"
                    style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  >
                    + Log a Mitzvah
                  </button>
                </div>
              </div>

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
                   <div className="text-center py-10 rounded-[16px] border" style={{ background: 'rgba(255,255,255,0.6)', borderColor: '#BFDBFE' }}>
                     <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                       <HandHeart className="w-6 h-6 text-blue-600" />
                     </div>
                     <p className="text-[14px] font-semibold text-slate-900">No open requests</p>
                     <p className="text-[12px] text-slate-500 mt-1">Check back soon</p>
                   </div>
                 ) : (
                  <div className="space-y-3">
                    {requests.map((request) => {
                      const CAT_ICONS = {
                        'Chesed': { icon: Heart, color: '#EC4899', bg: '#FDF2F8' },
                        'Torah Study': { icon: BookOpen, color: '#7C3AED', bg: '#F5F3FF' },
                        'Community': { icon: Users, color: '#2563EB', bg: '#EFF6FF' },
                        'Food': { icon: Coffee, color: '#D97706', bg: '#FFFBEB' },
                      };
                      const catStyle = CAT_ICONS[request.category] || { icon: HelpCircle, color: '#64748B', bg: '#F8FAFC' };
                      const CatIcon = catStyle.icon;
                      return (
                      <div key={request.id} className="bg-white rounded-[16px] border border-[#EAECF0] p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedRequest(request)}>
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: catStyle.bg }}>
                            <CatIcon className="w-5 h-5" style={{ color: catStyle.color }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-[14px] font-semibold text-slate-900">{request.title}</p>
                            <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{request.description}</p>
                          </div>
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: catStyle.bg, color: catStyle.color }}>
                            {request.category}
                          </span>
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleClaim(e, request); }}
                            disabled={claimMutation.isPending}
                            className="h-8 px-4 rounded-full bg-blue-600 text-white text-[13px] font-bold shadow-sm hover:scale-105 transition-transform disabled:opacity-50"
                          >
                            {claimMutation.isPending ? 'Joining...' : "✋ I'll Help"}
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Request Help CTA */}
              <div className="rounded-[16px] p-4 text-center" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1px solid #BFDBFE' }}>
                <p className="text-[13px] text-slate-700 mb-3">Need help with something?</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors"
                >
                  Post a Request
                </button>
              </div>
            </div>
          )}

          {/* Tab: Map */}
          {activeTab === 'map' && (
            <div className="max-w-2xl mx-auto">
              <div className="rounded-[16px] overflow-hidden border border-[#EAECF0]" style={{ height: '60vh', minHeight: 320 }}>
                <MitzvahMapView
                  requests={requests}
                  center={mapCenter}
                  zoom={mapZoom}
                  onRequestClick={(r) => setSelectedRequest(r)}
                />
              </div>
              <p className="text-[12px] text-slate-400 mt-2 text-center">{requests.length} open request{requests.length !== 1 ? 's' : ''} near Five Towns</p>
            </div>
          )}

          {/* Tab: My Mitzvah Log */}
          {activeTab === 'log' && <MyMitzvahLogTab currentUser={currentUser} />}

          {/* Tab: Completed Mitzvahs */}
          {activeTab === 'completed' && <CompletedMitzvahs currentUser={currentUser} />}
        </div>

          {/* Modals rendered at root level */}
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

          <LogMitzvahModal
          open={showLogMitzvah}
          onOpenChange={setShowLogMitzvah}
          onSubmit={handleLogMitzvah}
          />

          <CommunityAlertModal
          open={showAlertModal}
          onOpenChange={setShowAlertModal}
          currentUser={currentUser}
          />

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
          </>
          );
          }