import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, HandHeart, SlidersHorizontal, AlertCircle, Flame, Heart, BookOpen, Users, Coffee, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import LogMitzvahModal from '@/components/feed/LogMitzvahModal';
import CommunityAlertModal from '@/components/feed/CommunityAlertModal';
import MitzvahMapView from '@/components/mitzvah/MitzvahMapView';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CreateMitzvahModal from '@/components/mitzvah/CreateMitzvahModal';
import LocationPrompt from '@/components/mitzvah/LocationPrompt';
import FilterDrawer from '@/components/mitzvah/FilterDrawer';
import RequestDetailOverlay from '@/components/mitzvah/RequestDetailOverlay';
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

  const { data: todayHelpedCount = 0 } = useQuery({
    queryKey: ['today-helped-count'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const signups = await base44.entities.MitzvahSignup.list('-created_date', 100);
      return signups.filter(s => new Date(s.created_date) >= today).length;
    },
    staleTime: 60000,
    retry: 0
  });

  const { data: recentlyCompleted = [] } = useQuery({
    queryKey: ['recently-completed'],
    queryFn: async () => {
      return base44.entities.MitzvahRequest.filter({ status: 'completed' }, '-updated_date', 5);
    },
    staleTime: 60000,
    retry: 0
  });

  const { data: allSignups = [] } = useQuery({
    queryKey: ['all-signups'],
    queryFn: async () => base44.entities.MitzvahSignup.list('-created_date', 200),
    staleTime: 60000,
    retry: 0
  });

  const signupsByRequest = useMemo(() => {
    const map = {};
    allSignups.forEach(s => {
      if (!map[s.request_id]) map[s.request_id] = [];
      map[s.request_id].push(s);
    });
    return map;
  }, [allSignups]);

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
      <div className="min-h-screen flex flex-col bg-[#F6F8FB]">
        {/* Header */}
        <div className="sticky top-0 z-20 flex-shrink-0 bg-[#F6F8FB]/95 backdrop-blur-xl">
          <div className="mobile-page px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-blue-600">Community help</p>
              <h1 className="text-[22px] font-black tracking-normal text-slate-950">Mitzvah Circle</h1>
            </div>
            <button
              onClick={() => setShowLogMitzvah(true)}
              className="mobile-touch rounded-2xl border border-emerald-100 bg-white px-3 text-[13px] font-black text-emerald-700 shadow-sm active:scale-95"
            >
              Log
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <MitzvahTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <div ref={listScrollRef} className="mobile-safe-bottom" style={{ flex: 1, overflowY: 'auto', padding: '12px 0 0', WebkitOverflowScrolling: 'touch' }}>
          {/* Tab: Help Requests */}
          {activeTab === 'requests' && (
            <div className="mobile-page px-3 space-y-3">
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="relative p-4">
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[42px] bg-blue-50" />
                  <div className="relative">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                          <HandHeart className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[15px] font-black text-slate-950">Help nearby</p>
                          <p className="text-[12px] font-semibold text-slate-500">{requests.length} open request{requests.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
                        <p className="text-[16px] font-black text-emerald-700">{todayHelpedCount}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">helped today</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <Flame className="h-4 w-4 shrink-0 text-amber-500" />
                        <p className="truncate text-[13px] font-bold text-slate-800">{userStreak?.current_streak || 0} day streak</p>
                      </div>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-[12px] font-black text-white active:scale-95"
                      >
                        Request Help
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-[18px] border border-blue-100 bg-white p-3 flex flex-col items-center gap-2 text-blue-700 shadow-sm transition active:scale-95"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50">
                    <Plus className="w-4 h-4" />
                  </span>
                  <span className="text-[12px] font-black text-center">Request</span>
                </button>
                <button
                  onClick={() => setShowFilterDrawer(true)}
                  className="rounded-[18px] border border-emerald-100 bg-white p-3 flex flex-col items-center gap-2 text-emerald-700 shadow-sm transition active:scale-95"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50">
                    <HandHeart className="w-4 h-4" />
                  </span>
                  <span className="text-[12px] font-black text-center">Offer</span>
                </button>
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="rounded-[18px] border border-rose-100 bg-white p-3 flex flex-col items-center gap-2 text-rose-700 shadow-sm transition active:scale-95"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <span className="text-[12px] font-black text-center">Alert</span>
                </button>
              </div>

              {/* Social Pulse — slim */}
              {(todayHelpedCount > 0 || recentlyCompleted.length > 0) && (
                <div className="rounded-[18px] border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 shadow-sm">
                  {todayHelpedCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm">🙌</span>
                      <p className="text-[12px] font-semibold text-emerald-700">{todayHelpedCount} {todayHelpedCount === 1 ? 'person' : 'people'} helped today</p>
                    </div>
                  )}
                  {recentlyCompleted.slice(0, 2).map(r => (
                    <div key={r.id} className="mt-1.5 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm">✓</span>
                      <p className="text-[12px] text-slate-600 truncate flex-1">{r.title}</p>
                      {r.claimed_by_name && <span className="text-[11px] text-emerald-600 flex-shrink-0">by {r.claimed_by_name}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Help Requests Section */}
              <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-[17px] font-black text-slate-950">Help Requests</h2>
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
                          <div className="skeleton w-10 h-10 rounded-2xl flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="skeleton h-3.5 w-40 rounded" />
                            <div className="skeleton h-3 w-full rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : requests.length === 0 ? (
                   <div className="text-center py-10 rounded-[18px] border border-dashed border-blue-200 bg-blue-50/50">
                     <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                       <HandHeart className="w-6 h-6 text-blue-600" />
                     </div>
                     <p className="text-[14px] font-semibold text-slate-900">No open requests</p>
                     <p className="text-[12px] text-slate-500 mt-1">Check back soon</p>
                   </div>
                 ) : (
                  <div className="space-y-3">
                     {requests.map((request) => {
                       const responders = signupsByRequest[request.id] || [];
                       const CAT_ICONS = {
                         'Chesed': { icon: Heart, color: '#EC4899', bg: '#FDF2F8' },
                         'Torah Study': { icon: BookOpen, color: '#7C3AED', bg: '#F5F3FF' },
                         'Community': { icon: Users, color: '#2563EB', bg: '#EFF6FF' },
                         'Food': { icon: Coffee, color: '#D97706', bg: '#FFFBEB' },
                       };
                       const catStyle = CAT_ICONS[request.category] || { icon: HelpCircle, color: '#64748B', bg: '#F8FAFC' };
                       const CatIcon = catStyle.icon;
                       return (
                       <div key={request.id} className="rounded-[18px] border border-slate-200 bg-white p-4 cursor-pointer shadow-sm transition active:scale-[0.99]" onClick={() => setSelectedRequest(request)}>
                         <div className="flex items-start gap-3 mb-2">
                           <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: catStyle.bg }}>
                             <CatIcon className="w-5 h-5" style={{ color: catStyle.color }} />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-[14px] font-black text-slate-950">{request.title}</p>
                             <p className="text-[12px] font-medium leading-5 text-slate-500 mt-0.5 line-clamp-2">{request.description}</p>
                           </div>
                           <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: catStyle.bg, color: catStyle.color }}>
                             {request.category}
                           </span>
                         </div>
                         {/* Activity row: responder avatars + counts */}
                         <div className="flex items-center gap-2 mb-2">
                           {responders.length > 0 && (
                             <div className="flex items-center gap-1">
                               <div className="flex -space-x-1.5">
                                 {responders.slice(0, 3).map((s, i) => (
                                   <div key={i} className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white" style={{ background: ['#2563EB','#7C3AED','#16A34A'][i % 3], zIndex: 3 - i }}>
                                     {(s.user_name || '?')[0]?.toUpperCase()}
                                   </div>
                                 ))}
                               </div>
                               <span className="text-[11px] text-emerald-600 font-semibold">{responders.length} helping</span>
                             </div>
                           )}
                           {request.views_count > 0 && (
                             <span className="text-[11px] text-slate-400">{request.views_count} views</span>
                           )}
                         </div>
                         <div className="flex justify-end mt-3">
                           <button
                             onClick={(e) => { e.stopPropagation(); handleClaim(e, request); }}
                             disabled={claimMutation.isPending}
                             className="h-9 px-4 rounded-full bg-slate-950 text-white text-[13px] font-black shadow-sm active:scale-95 disabled:opacity-50"
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
              <div className="rounded-[22px] border border-blue-100 bg-blue-50 p-4 text-center shadow-sm">
                <p className="text-[14px] font-black text-slate-950 mb-1">Need help with something?</p>
                <p className="mb-3 text-[12px] font-medium text-slate-600">Post a request and let the community show up.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 text-white text-[12px] font-black transition active:scale-[0.98]"
                >
                  Post a Request
                </button>
              </div>
            </div>
          )}

          {/* Tab: Map */}
          {activeTab === 'map' && (
            <div className="mobile-page px-3 space-y-3">
              {/* Map block — reduced height */}
              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm" style={{ height: '38vh', minHeight: 240 }}>
                <MitzvahMapView
                  requests={requests}
                  userOrigin={userOrigin}
                  mapCenter={mapCenter}
                  mapZoom={mapZoom}
                  onSelectRequest={(r) => setSelectedRequest(r)}
                  onHelpClick={(r) => claimMutation.mutate(r)}
                  onUseMyLocation={() => {
                    navigator.geolocation?.getCurrentPosition(
                      (pos) => setLiveLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                      () => toast.error('Location access denied')
                    );
                  }}
                />
              </div>

              {/* 2 request cards below map */}
              {requests.length === 0 ? (
                <p className="text-[12px] text-slate-400 text-center py-3">No open requests right now — be the first!</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">
                    {requests.length} open request{requests.length !== 1 ? 's' : ''} near Five Towns
                  </p>
                  {requests.slice(0, 2).map(r => {
                    const catEmoji = { 'Errand':'🛍️','Lost & Found':'🔍','Quick Favor':'🤝','Tutoring':'📚','Shabbat Help':'🕯️','Food':'🍽️','Ride':'🚗','Moving':'📦','Other':'💙' };
                    const emoji = catEmoji[r.category] || '💙';
                    return (
                      <div
                        key={r.id}
                        className="w-full flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-3 py-3 shadow-sm"
                      >
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg">{emoji}</span>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedRequest(r)}>
                          <p className="text-[13px] font-black text-slate-950 truncate">{r.title}</p>
                          <p className="text-[11px] font-medium text-slate-400">{r.category}{r.locationLabel ? ` · ${r.locationLabel}` : ''}</p>
                        </div>
                        <button
                          onClick={() => claimMutation.mutate(r)}
                          disabled={claimMutation.isPending}
                          className="text-[11px] font-black text-white bg-slate-950 px-3 py-1.5 rounded-full flex-shrink-0 active:scale-95 transition-all disabled:opacity-50"
                        >
                          ✋ Help
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: My Mitzvah Log */}
          {activeTab === 'log' && <div className="mobile-page px-3"><MyMitzvahLogTab currentUser={currentUser} /></div>}

          {/* Tab: Completed Mitzvahs */}
          {activeTab === 'completed' && <div className="mobile-page px-3"><CompletedMitzvahs currentUser={currentUser} /></div>}
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
