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

export default function MitzvahCircle() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('open');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('near');
  const [timeFilter, setTimeFilter] = useState('anytime');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedMapRequest, setSelectedMapRequest] = useState(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);

    // Check if user has location - set "Near Me" as default
    if (user.location_lat && user.location_lng) {
      setLocationFilter('near');
    } else {
      // Check if prompt was dismissed
      const dismissed = localStorage.getItem('locationPromptDismissed');
      if (!dismissed) {
        setTimeout(() => setShowLocationPrompt(true), 2000);
      }
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

      // Calculate distances and filter if "Near Me" is selected
      if (locationFilter === 'near' && currentUser?.location_lat && currentUser?.location_lng) {
        const requestsWithDistance = allRequests.map(req => {
          if (req.approxLat && req.approxLng) {
            const distance = calculateDistance(
              currentUser.location_lat,
              currentUser.location_lng,
              req.approxLat,
              req.approxLng
            );
            return { ...req, distance };
          }
          return { ...req, distance: 999 }; // Put requests without location at the end
        });

        // Filter to within 10 miles and sort by distance
        return requestsWithDistance
          .filter(req => req.distance <= 10)
          .sort((a, b) => a.distance - b.distance);
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <HandHeart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Mitzvah Circle</h1>
              <p className="text-xs text-slate-600">Help someone nearby in 5 minutes</p>
            </div>
          </div>
        </div>

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
          {currentUser?.location_lat && currentUser?.location_lng && (
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
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
                showDistance={locationFilter === 'near'}
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
              <MitzvahMapView
                requests={requests.filter(r => r.status === 'open' || r.status === 'in_progress')}
                userLocation={currentUser?.location_lat && currentUser?.location_lng ? {
                  lat: currentUser.location_lat,
                  lng: currentUser.location_lng
                } : null}
                onSelectRequest={(req) => {
                  setSelectedMapRequest(req);
                  setShowDetailSheet(true);
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
        <Button 
          size="lg"
          className="fixed bottom-24 right-6 rounded-full w-14 h-14 shadow-xl bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
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