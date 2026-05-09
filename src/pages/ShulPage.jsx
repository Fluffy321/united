import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { dataService, incrementCounter } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import CommunityHubHeader from '@/components/shul/CommunityHubHeader';
import ShulPostCard from '@/components/shul/ShulPostCard';
import ShulEventCard from '@/components/shul/ShulEventCard';
import CreateShulPostModal from '@/components/shul/CreateShulPostModal';
import MinyanStatusWidget from '@/components/shul/MinyanStatusWidget';
import WeeklyScheduleWidget from '@/components/shul/WeeklyScheduleWidget';
import MealTrainBoard from '@/components/shul/MealTrainBoard';
import RideBoard from '@/components/shul/RideBoard';
import VolunteerBoard from '@/components/shul/VolunteerBoard';
import AdminBroadcastModal from '@/components/shul/AdminBroadcastModal';
import MembersTab from '@/components/shul/MembersTab';
import MediaTab from '@/components/shul/MediaTab';
import ShulHelpFeed from '@/components/shul/ShulHelpFeed';
import ShulQRCode from '@/components/shul/ShulQRCode';

export default function ShulPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user: currentUser } = useAuth();
  const [shul, setShul] = useState(null);
  const [membership, setMembership] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tabDirection, setTabDirection] = useState(0);

  const params = new URLSearchParams(location.search);
  const shulId = params.get('shulId');

  const TABS = ['dashboard', 'help', 'events', 'chesed', 'members', 'media'];

  useEffect(() => {
    loadData();
  }, [shulId]);

  useEffect(() => {
    if (!shulId) {
      const loadFirstShul = async () => {
        try {
          const shuls = await dataService.entities.Shul.list('-created_date', 5);
          const verified = shuls.filter(s => s.verified || s.is_verified);
          if (verified.length > 0) {
            navigate(createPageUrl('ShulPage') + `?shulId=${verified[0].id}`, { replace: true });
          } else if (shuls.length > 0) {
            navigate(createPageUrl('ShulPage') + `?shulId=${shuls[0].id}`, { replace: true });
          }
          // else: stay on ShulPage and show empty state — no silent redirect
        } catch {}
      };
      loadFirstShul();
    }
  }, [shulId, navigate]);

  const loadData = async () => {
    if (shulId) {
      const shuls = await dataService.entities.Shul.filter({ id: shulId });
      if (shuls.length > 0) setShul(shuls[0]);
      if (currentUser) {
        const memberships = await dataService.entities.ShulMember.filter({ shul_id: shulId, user_id: currentUser.id });
        if (memberships.length > 0) setMembership(memberships[0]);
      }
    }
  };

  const { data: posts = [] } = useQuery({
    queryKey: ['shul-posts', shulId],
    queryFn: () => dataService.entities.ShulPost.filter({ shul_id: shulId }, '-created_date', 50),
    enabled: !!shulId,
    staleTime: 30000
  });

  const { data: members = [] } = useQuery({
    queryKey: ['shul-members', shulId],
    queryFn: () => dataService.entities.ShulMember.filter({ shul_id: shulId }),
    enabled: !!shulId,
    staleTime: 30000
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      return dataService.entities.ShulMember.create({
        shul_id: shul.id,
        shul_name: shul.name,
        user_id: currentUser.id,
        user_name: currentUser.display_name || currentUser.full_name,
        role: 'member'
      });
    },
    onSuccess: async (newMembership) => {
      await incrementCounter('shuls', 'member_count', shul.id, 1);
      setMembership(newMembership);
      setShul(prev => ({ ...prev, member_count: (prev.member_count || 0) + 1 }));
      queryClient.invalidateQueries({ queryKey: ['shul-members'] });
      toast.success("You've joined the community! You'll now receive updates.");
    }
  });

  const toggleNotificationsMutation = useMutation({
    mutationFn: () =>
      dataService.entities.ShulMember.update(membership.id, {
        notifications_enabled: !membership.notifications_enabled
      }),
    onSuccess: (updated) => {
      setMembership(updated);
      toast.success(updated.notifications_enabled ? 'Notifications enabled' : 'Notifications muted');
    }
  });

  const handleTabChange = (newTab) => {
    const oldIndex = TABS.indexOf(activeTab);
    const newIndex = TABS.indexOf(newTab);
    setTabDirection(newIndex > oldIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  if (!currentUser || (!shul && shulId)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
      </div>
    );
  }

  if (!shul && !shulId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">🕍</div>
        <h2 className="text-[20px] font-bold text-slate-800 mb-2">No Shuls Yet</h2>
        <p className="text-slate-500 text-[14px] mb-6">Shul directory is coming soon. Check back after communities are set up.</p>
        <button onClick={() => navigate('/Communities')} className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold text-[14px]">Browse Communities</button>
      </div>
    );
  }

  const isAdmin = membership?.role === 'admin';
  const pinnedAnnouncements = posts.filter(p => p.type === 'announcement' && p.is_pinned);
  const feedPosts = posts.filter(p => (p.type === 'announcement' || p.type === 'discussion') && !p.is_pinned);
  const eventPosts = posts.filter(p => p.type === 'event');

  return (
    <div className="min-h-screen bg-[#F8FAFB] pb-20">
      <CommunityHubHeader
        shul={shul}
        membership={membership}
        isAdmin={isAdmin}
        onJoin={() => joinMutation.mutate()}
        onToggleNotifications={() => toggleNotificationsMutation.mutate()}
        onNewPost={() => setShowCreatePost(true)}
        onBroadcast={() => setShowBroadcast(true)}
        joining={joinMutation.isPending}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="flex w-full mb-6 bg-white border border-slate-100 rounded-2xl p-1 overflow-x-auto scrollbar-hide">
            {[
              { value: 'dashboard', label: '🏠 Home' },
              { value: 'help', label: '🙏 Help' },
              { value: 'events', label: '📅 Events' },
              { value: 'chesed', label: '🤝 Chesed' },
              { value: 'members', label: '👥 Members' },
              { value: 'media', label: '📄 Media' }
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 min-w-fit text-xs font-semibold rounded-xl data-[state=active]:bg-[#0F5ED7] data-[state=active]:text-white whitespace-nowrap"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard">
            <motion.div
              key="dashboard"
              initial={{ x: tabDirection > 0 ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              {/* Minyan + Schedule Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MinyanStatusWidget shulId={shulId} currentUser={currentUser} />
                <WeeklyScheduleWidget shulId={shulId} />
              </div>

              {/* QR Code — admin only */}
              {isAdmin && (
                <ShulQRCode shul={shul} />
              )}

              {/* Pinned Announcements */}
              {pinnedAnnouncements.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">📌 Pinned</h2>
                  <div className="space-y-3">
                    {pinnedAnnouncements.map(post => (
                      <ShulPostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        isAdmin={isAdmin}
                        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['shul-posts'] })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Feed */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-slate-900">Community Feed</h2>
                  {isAdmin && (
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="text-sm text-[#0F5ED7] font-semibold"
                    >
                      + Add Post
                    </button>
                  )}
                </div>
                {feedPosts.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl text-slate-500">
                    <p className="text-2xl mb-2">💬</p>
                    <p>No posts yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feedPosts.slice(0, 10).map(post => (
                      <ShulPostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        isAdmin={isAdmin}
                        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['shul-posts'] })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* HELP FEED */}
          <TabsContent value="help">
            <motion.div
              key="help"
              initial={{ x: tabDirection > 0 ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              <ShulHelpFeed
                shulId={shulId}
                shulName={shul.name}
                currentUser={currentUser}
                isAdmin={isAdmin}
              />
            </motion.div>
          </TabsContent>

          {/* EVENTS */}
          <TabsContent value="events">
            <motion.div
              key="events"
              initial={{ x: tabDirection > 0 ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              {isAdmin && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center text-slate-500 hover:border-[#0F5ED7] hover:text-[#0F5ED7] transition-colors font-medium text-sm"
                >
                  + Add Event
                </button>
              )}
              {eventPosts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-3xl mb-2">📅</p>
                  <p>No upcoming events</p>
                </div>
              ) : (
                eventPosts.map(post => (
                  <ShulEventCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                  />
                ))
              )}
            </motion.div>
          </TabsContent>

          {/* CHESED */}
          <TabsContent value="chesed">
            <motion.div
              key="chesed"
              initial={{ x: tabDirection > 0 ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              <MealTrainBoard shulId={shulId} currentUser={currentUser} isAdmin={isAdmin} />
              <RideBoard shulId={shulId} currentUser={currentUser} />
              <VolunteerBoard shulId={shulId} currentUser={currentUser} isAdmin={isAdmin} />
            </motion.div>
          </TabsContent>

          {/* MEMBERS */}
          <TabsContent value="members">
            <motion.div
              key="members"
              initial={{ x: tabDirection > 0 ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.22 }}
            >
              <MembersTab members={members} currentUserId={currentUser.id} />
            </motion.div>
          </TabsContent>

          {/* MEDIA */}
          <TabsContent value="media">
            <motion.div
              key="media"
              initial={{ x: tabDirection > 0 ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.22 }}
            >
              <MediaTab
                shul={shul}
                isAdmin={isAdmin}
                onShulUpdate={setShul}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <CreateShulPostModal
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        shul={shul}
        currentUser={currentUser}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['shul-posts'] });
          setShowCreatePost(false);
        }}
      />

      <AdminBroadcastModal
        open={showBroadcast}
        onOpenChange={setShowBroadcast}
        shul={shul}
        currentUser={currentUser}
        memberCount={members.length}
      />
    </div>
  );
}