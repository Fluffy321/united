import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Users, CheckCircle2, Bell, BellOff, Plus } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ShulPostCard from '@/components/shul/ShulPostCard';
import ShulEventCard from '@/components/shul/ShulEventCard';
import CreateShulPostModal from '@/components/shul/CreateShulPostModal';
import MinyanStatusWidget from '@/components/shul/MinyanStatusWidget';
import WeeklyScheduleWidget from '@/components/shul/WeeklyScheduleWidget';
import MealTrainBoard from '@/components/shul/MealTrainBoard';
import RideBoard from '@/components/shul/RideBoard';
import VolunteerBoard from '@/components/shul/VolunteerBoard';

export default function ShulPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [shul, setShul] = useState(null);
  const [membership, setMembership] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');

  const params = new URLSearchParams(location.search);
  const shulId = params.get('shulId');

  useEffect(() => {
    loadData();
  }, [shulId]);

  useEffect(() => {
    // Auto-load first verified shul if no shulId provided (fallback for dev)
    if (!shulId) {
      const loadFirstShul = async () => {
        const shuls = await base44.entities.Shul.filter({ verified: true });
        if (shuls.length > 0) {
          navigate(createPageUrl('ShulPage') + `?shulId=${shuls[0].id}`, { replace: true });
        } else {
          // No shuls exist, redirect to Communities
          navigate(createPageUrl('Communities'), { replace: true });
        }
      };
      loadFirstShul();
    }
  }, [shulId, navigate]);

  const loadData = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);

    if (shulId) {
      const shuls = await base44.entities.Shul.filter({ id: shulId });
      if (shuls.length > 0) {
        setShul(shuls[0]);
      }

      const memberships = await base44.entities.ShulMember.filter({
        shul_id: shulId,
        user_id: user.id
      });
      if (memberships.length > 0) {
        setMembership(memberships[0]);
      }
    }
  };

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['shul-posts', shulId],
    queryFn: () => base44.entities.ShulPost.filter({ shul_id: shulId }, '-created_date', 50),
    enabled: !!shulId,
    staleTime: 30000
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['shul-members', shulId],
    queryFn: () => base44.entities.ShulMember.filter({ shul_id: shulId }),
    enabled: !!shulId,
    staleTime: 30000
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.ShulMember.create({
        shul_id: shul.id,
        shul_name: shul.name,
        user_id: currentUser.id,
        user_name: currentUser.display_name,
        role: 'member'
      });
    },
    onSuccess: async (newMembership) => {
      await base44.entities.Shul.update(shul.id, {
        member_count: (shul.member_count || 0) + 1
      });
      setMembership(newMembership);
      queryClient.invalidateQueries({ queryKey: ['shul-members'] });
      toast.success('You\'ve joined the community!');
    }
  });

  const toggleNotificationsMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.ShulMember.update(membership.id, {
        notifications_enabled: !membership.notifications_enabled
      });
    },
    onSuccess: (updated) => {
      setMembership(updated);
      toast.success(updated.notifications_enabled ? 'Notifications enabled' : 'Notifications disabled');
    }
  });

  // Show loading only briefly, then show page skeleton
  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if ((!shul || !currentUser) && showLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!shul) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Community not found</p>
          <Button onClick={() => navigate(createPageUrl('Communities'))}>
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const isAdmin = membership?.role === 'admin';
  const isMember = !!membership;

  const announcements = posts.filter(p => p.type === 'announcement' && p.is_pinned);
  const feedPosts = posts.filter(p => (p.type === 'announcement' || p.type === 'discussion') && !p.is_pinned);
  const eventPosts = posts.filter(p => p.type === 'event');

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{shul.name}</h1>
                {shul.verified && (
                  <Badge className="bg-[#E6F0FF] text-[#0F5ED7] border-0">✓</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {shul.town}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {shul.member_count || 0} members
                </div>
              </div>

              {shul.description && (
                <p className="text-sm text-slate-700 mb-4">{shul.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {!isMember ? (
              <Button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                className="bg-[#0F5ED7] hover:bg-[#0D4EB8] text-white font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Join Community
              </Button>
            ) : (
              <Button
                onClick={() => toggleNotificationsMutation.mutate()}
                variant="outline"
                size="sm"
              >
                {membership.notifications_enabled ? (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Mute
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Unmute
                  </>
                )}
              </Button>
            )}
            {isAdmin && (
              <Button
                onClick={() => setShowCreatePost(true)}
                className="bg-[#0F5ED7] hover:bg-[#0D4EB8] text-white font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <MinyanStatusWidget shulId={shulId} currentUser={currentUser} />
          <WeeklyScheduleWidget shulId={shulId} />
        </div>

        {/* Pinned Announcements */}
        {announcements.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-slate-900">
              📌 Announcements
            </h3>
            <div className="space-y-3">
              {announcements.map(post => (
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="chesed">Chesed</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-3">
            {feedPosts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No posts yet
              </div>
            ) : (
              feedPosts.map(post => (
                <ShulPostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  onRefresh={() => queryClient.invalidateQueries({ queryKey: ['shul-posts'] })}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-3">
            {eventPosts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No upcoming events
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
          </TabsContent>

          <TabsContent value="chesed" className="space-y-6">
            <MealTrainBoard shulId={shulId} currentUser={currentUser} isAdmin={isAdmin} />
            <RideBoard shulId={shulId} currentUser={currentUser} />
            <VolunteerBoard shulId={shulId} currentUser={currentUser} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="members" className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{member.user_name}</div>
                </div>
                {member.role === 'admin' && (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    Admin
                  </Badge>
                )}
              </div>
            ))}
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
    </div>
  );
}