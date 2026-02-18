import React, { useState, useEffect } from 'react';
import { Plus, Loader2, HandHeart, MapPin, List, Map as MapIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!currentUser.is_profile_complete) {
    return <ProfileSetup user={currentUser} onComplete={loadUser} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Gradient Header */}
      <div className="bg-gradient-to-b from-[#E6F0FF] to-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F5ED7] to-[#0D4EB8] flex items-center justify-center">
              <HandHeart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Mitzvah Circle</h1>
              <p className="text-sm" style={{ color: '#5F6B7A' }}>Help someone nearby in 5 minutes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
            >
              <List className="w-4 h-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className={viewMode === 'map' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
            >
              <MapIcon className="w-4 h-4 mr-1" />
              Map
            </Button>
          </div>

          {/* Location Filter */}
          {getUserOrigin(currentUser) && (
            <div className="flex gap-2">
              <Button
                variant={locationFilter === 'near' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLocationFilter('near')}
                className={locationFilter === 'near' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <MapPin className="w-4 h-4 mr-1" />
                Near Me
              </Button>
              <Button
                variant={locationFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLocationFilter('all')}
              >
                All
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={(newTab) => {
            setActiveTab(newTab);
          }} 
          className="mb-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open">Needs Help</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
          {['All', 'Errand', 'Quick Favor', 'Lost & Found', 'Tutoring', 'Shabbat Help', 'Other'].map(cat => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              size="sm"
              className={`whitespace-nowrap text-xs h-8 ${
                categoryFilter === cat 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'hover:bg-slate-100'
              }`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <HandHeart className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">
              {activeTab === 'open' ? 'No open requests' : 'No completed mitzvahs yet'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
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

        {/* Create Button — only visible when Mitzvah tab is active */}
        {isActive && (
          <Button 
            size="lg"
            className="fixed bottom-24 right-6 rounded-full w-14 h-14 shadow-xl bg-indigo-600 hover:bg-indigo-700 z-40"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-6 h-6" />
          </Button>
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