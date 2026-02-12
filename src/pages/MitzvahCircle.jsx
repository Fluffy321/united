import React, { useState, useEffect } from 'react';
import { Plus, Loader2, HandHeart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MitzvahRequestCard from '@/components/mitzvah/MitzvahRequestCard';
import CreateMitzvahModal from '@/components/mitzvah/CreateMitzvahModal';
import ProfileSetup from '@/components/profile/ProfileSetup';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MitzvahCircle() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('open');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
  };

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['mitzvah-requests', activeTab],
    queryFn: async () => {
      const status = activeTab === 'open' ? 'Open' : 'Completed';
      const allRequests = await base44.entities.MitzvahRequest.filter({ status }, '-created_date', 100);
      return allRequests;
    }
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
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <HandHeart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Mitzvah Circle</h1>
              <p className="text-sm text-slate-600">Help someone nearby in 5 minutes</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open">Needs Help</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <HandHeart className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">No open requests</p>
                <p className="text-sm text-slate-400 mt-1">Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(request => (
                  <MitzvahRequestCard
                    key={request.id}
                    request={request}
                    currentUser={currentUser}
                    onClaim={handleClaim}
                    onMessage={handleMessage}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <HandHeart className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">No completed mitzvahs yet</p>
                <p className="text-sm text-slate-400 mt-1">Be the first to help!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(request => (
                  <MitzvahRequestCard
                    key={request.id}
                    request={request}
                    currentUser={currentUser}
                    onClaim={handleClaim}
                    onMessage={handleMessage}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

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
    </div>
  );
}