import React, { useState, useEffect } from 'react';
import { Plus, HandHeart, MapPin, List, Map as MapIcon, Clock } from 'lucide-react';
import ChesedHoursTab from '@/components/chesed/ChesedHoursTab';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MitzvahRequestCard from '@/components/mitzvah/MitzvahRequestCard';
import CreateMitzvahModal from '@/components/mitzvah/CreateMitzvahModal';
import LocationPrompt from '@/components/mitzvah/LocationPrompt';
import MitzvahMapView from '@/components/mitzvah/MitzvahMapView';
import MitzvahDetailSheet from '@/components/mitzvah/MitzvahDetailSheet';
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
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState(() => {
    // Default to 'near' if user has origin (device location or cityPreset)
    return 'near';
  });
  const [timeFilter, setTimeFilter] = useState('anytime');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedMapRequest, setSelectedMapRequest] = useState(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
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

    // Check if user has origin (device location or town selection)
    const hasOrigin = (user.location_lat && user.location_lng) || (user.cityPreset && TOWN_CENTERS[user.cityPreset]);
    
    if (!hasOrigin) {
      // Check if prompt was dismissed
      const dismissed = localStorage.getItem('locationPromptDismissed');
      if (!dismissed) {
        setTimeout(() => setShowLocationPrompt(true), 2000);
      }
      // If no origin, default to 'all' instead of 'near'
      setLocationFilter('all');
    }
  };

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['mitzvah-requests', activeTab, categoryFilter, locationFilter],
    queryFn: async () => {
      const status = activeTab === 'open' ? 'open' : 'completed';
      let allRequests;
      
      if (categoryFilter === 'All') {
        allRequests = await base44.entities.MitzvahRequest.filter({ status }, '-created_date', 100);
      } else {
        allRequests = await base44.entities.MitzvahRequest.filter({ 
          status, 
          category: categoryFilter 
        }, '-created_date', 100);
      }

      // Calculate distances for all requests if user has an origin
      const userOrigin = getUserOrigin(currentUser);
      if (userOrigin) {
        const requestsWithDistance = allRequests.map(req => {
          if (req.approxLat && req.approxLng) {
            const distance = calculateDistance(
              userOrigin.lat,
              userOrigin.lng,
              req.approxLat,
              req.approxLng
            );
            return { ...req, distance };
          }
          return { ...req, distance: 999 }; // Put requests without location at the end
        });

        // If "Near Me" filter is active, filter to within 10 miles
        if (locationFilter === 'near') {
          return requestsWithDistance
            .filter(req => req.distance <= 10)
            .sort((a, b) => a.distance - b.distance);
        }
        
        return requestsWithDistance.sort((a, b) => a.distance - b.distance);
      }
      
      return allRequests;
    },
    enabled: !!currentUser
  });

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
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Compact Header */}
      <div className="bg-white sticky top-0 z-10" style={{ borderBottom: '1px solid #E8ECF4' }}>
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="font-bold text-[#0F172A] text-[16px] tracking-[-0.01em]">Mitzvah Circle</span>
          <div className="flex gap-1">
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
                onClick={() => setViewMode(v => v === 'list' ? 'map' : 'list')}
                className="h-8 w-8 flex items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F5F7FB] transition-colors"
              >
                {viewMode === 'list' ? <MapIcon className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {mainTab === 'chesed' ? (
        <ChesedHoursTab currentUser={currentUser} />
      ) : null}

      <div className={`max-w-2xl mx-auto px-4 pt-4 ${mainTab !== 'circle' ? 'hidden' : ''}`}>

        {/* Status + location filter row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1.5">
            {['open', 'completed'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-8 px-3.5 text-[12px] font-semibold rounded-full border transition-all ${
                  activeTab === tab
                    ? 'bg-[#0F1C2E] text-white border-[#0F1C2E]'
                    : 'bg-white text-[#667085] border-[#EAECF0] hover:border-[#D0D5DD]'
                }`}
              >
                {tab === 'open' ? 'Needs Help' : 'Completed'}
              </button>
            ))}
          </div>

          {getUserOrigin(currentUser) && (
            <div className="flex gap-1.5">
              {['near', 'all'].map(loc => (
                <button
                  key={loc}
                  onClick={() => setLocationFilter(loc)}
                  className={`h-8 px-3 text-[12px] font-semibold rounded-full border transition-all ${
                    locationFilter === loc
                      ? 'bg-[#0F1C2E] text-white border-[#0F1C2E]'
                      : 'bg-white text-[#667085] border-[#EAECF0]'
                  }`}
                >
                  {loc === 'near' ? <><MapPin className="w-3 h-3 inline mr-0.5" />Near Me</> : 'All'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
          {['All', 'Errand', 'Quick Favor', 'Lost & Found', 'Tutoring', 'Shabbat Help', 'Other'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`whitespace-nowrap text-[12px] font-semibold h-8 px-3.5 rounded-full border transition-all flex-shrink-0 ${
                categoryFilter === cat
                  ? 'bg-[#0F1C2E] text-white border-[#0F1C2E]'
                  : 'bg-white text-[#667085] border-[#EAECF0] hover:border-[#D0D5DD]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3 pb-24">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-[14px] border border-[#EAECF0] p-4" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
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
          <div className="text-center py-14 bg-white rounded-[14px] border border-[#EAECF0]" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
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
        ) : viewMode === 'list' ? (
          <div className="space-y-2 pb-24">
            {requests.map(request => (
              <MitzvahRequestCard
                key={request.id}
                request={request}
                currentUser={currentUser}
                onClaim={handleClaim}
                onMessage={handleMessage}
                onComplete={handleComplete}
                showDistance={!!getUserOrigin(currentUser) && request.distance !== undefined && request.distance < 999}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Map Filters */}
            <div className="mb-3 space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['Today', 'This Week', 'Anytime'].map(time => (
                  <Button
                    key={time}
                    variant={timeFilter === time.toLowerCase().replace(' ', '') ? "default" : "outline"}
                    size="sm"
                    className={`whitespace-nowrap text-xs h-8 ${
                      timeFilter === time.toLowerCase().replace(' ', '')
                        ? 'bg-indigo-600 hover:bg-indigo-700' 
                        : 'hover:bg-slate-100'
                    }`}
                    onClick={() => setTimeFilter(time.toLowerCase().replace(' ', ''))}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            <div className="pb-24">
              {currentUser?.role === 'admin' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 text-xs text-yellow-900">
                  <strong>Admin Debug:</strong> Requests with coords: {requests.filter(r => r.approxLat && r.approxLng && r.status === 'open').length}
                </div>
              )}
              
              {/* Count label */}
              <div className="mb-3 text-sm font-medium text-slate-700">
                {locationFilter === 'near' 
                  ? `${requests.filter(r => r.status === 'open' || r.status === 'in_progress').length} open mitzvahs near you`
                  : `${requests.filter(r => r.status === 'open' || r.status === 'in_progress').length} open mitzvahs`
                }
              </div>
              
              <MitzvahMapView
                requests={requests.filter(r => r.status === 'open' || r.status === 'in_progress')}
                userOrigin={getUserOrigin(currentUser)}
                currentUser={currentUser}
                onSelectRequest={(req) => {
                  setSelectedMapRequest(req);
                  setShowDetailSheet(true);
                }}
                onHelpRequest={async (req) => {
                  try {
                    // Create help offer
                    const helpOffer = await base44.entities.HelpOffer.create({
                      request_id: req.id,
                      helper_user_id: currentUser.id,
                      helper_name: currentUser.display_name,
                      status: 'active'
                    });

                    // Update request status
                    await base44.entities.MitzvahRequest.update(req.id, {
                      status: 'in_progress',
                      claimed_by_user_id: currentUser.id,
                      claimed_by_name: currentUser.display_name
                    });

                    // Create or open conversation
                    const conversations = await base44.entities.Conversation.filter({ 
                      participant_ids: { $all: [currentUser.id, req.created_by_user_id] } 
                    });
                    
                    if (conversations.length > 0) {
                      // Update help offer with conversation ID
                      await base44.entities.HelpOffer.update(helpOffer.id, {
                        conversation_id: conversations[0].id
                      });
                      navigate(createPageUrl('Messages') + `?conversation=${conversations[0].id}`);
                    } else {
                      const otherUser = await base44.entities.User.filter({ id: req.created_by_user_id });
                      if (otherUser.length > 0) {
                        const newConversation = await base44.entities.Conversation.create({
                          participant_ids: [currentUser.id, req.created_by_user_id],
                          participant_names: [currentUser.display_name, otherUser[0].display_name],
                          participant_ages: [currentUser.age_range, otherUser[0].age_range],
                          last_message: '',
                          last_message_at: new Date().toISOString(),
                          request_id: req.id
                        });
                        
                        // Update help offer with conversation ID
                        await base44.entities.HelpOffer.update(helpOffer.id, {
                          conversation_id: newConversation.id
                        });
                        
                        navigate(createPageUrl('Messages') + `?conversation=${newConversation.id}`);
                      }
                    }

                    queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] });
                    toast.success('You\'ve offered to help! 💙');
                  } catch (error) {
                    toast.error('Failed to offer help');
                  }
                }}
                filters={{
                  category: categoryFilter,
                  location: locationFilter,
                  time: timeFilter
                }}
              />
            </div>
          </>
        )}

        {/* Create Button */}
        {isActive && mainTab === 'circle' && (
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
      <CreateMitzvahModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] });
        }}
        currentUser={currentUser}
      />

      <LocationPrompt
        show={showLocationPrompt}
        onDismiss={() => setShowLocationPrompt(false)}
        onLocationSet={() => {
          setShowLocationPrompt(false);
          setLocationFilter('near');
          loadUser();
          queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] });
        }}
      />

      {selectedMapRequest && (
        <MitzvahDetailSheet
          request={selectedMapRequest}
          currentUser={currentUser}
          open={showDetailSheet}
          onClose={() => {
            setShowDetailSheet(false);
            setSelectedMapRequest(null);
          }}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] })}
        />
      )}
    </div>
  );
}