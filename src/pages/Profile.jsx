import React, { useState, useEffect } from 'react';
import { Settings, MapPin, Loader2, Edit2, Flag, Ban, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PostCard from '@/components/feed/PostCard';
import ReportModal from '@/components/common/ReportModal';
import UserAvatar from '@/components/common/UserAvatar';
import StreakBadge from '@/components/profile/StreakBadge';
import WeeklySummary from '@/components/profile/WeeklySummary';
import MitzvahTimeline from '@/components/profile/MitzvahTimeline';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadMitzvahPoints();
  }, []);

  const [mitzvahPoints, setMitzvahPoints] = useState(0);

  const loadMitzvahPoints = async () => {
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get('id');
    const user = await base44.auth.me();
    const targetUserId = profileId || user.id;
    
    const points = await base44.entities.MitzvahPoints.filter({ user_id: targetUserId });
    if (points.length > 0) {
      setMitzvahPoints(points[0].total_points);
    }
  };

  const loadProfile = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
    
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get('id');
    
    if (profileId && profileId !== user.id) {
      const users = await base44.entities.User.filter({ id: profileId });
      if (users[0]) {
        setProfileUser(users[0]);
        setIsOwnProfile(false);
      } else {
        setProfileUser(user);
        setIsOwnProfile(true);
      }
    } else {
      setProfileUser(user);
      setIsOwnProfile(true);
    }
  };

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', profileUser?.id],
    queryFn: () => base44.entities.Post.filter({ author_id: profileUser.id }, '-created_date', 20),
    enabled: !!profileUser
  });

  const { data: userStreak } = useQuery({
    queryKey: ['user-streak', profileUser?.id],
    queryFn: async () => {
      const existing = await base44.entities.UserStreak.filter({ user_id: profileUser.id });
      return existing[0] || null;
    },
    enabled: !!profileUser
  });

  const { data: mitzvahLogs = [] } = useQuery({
    queryKey: ['mitzvah-logs', profileUser?.id],
    queryFn: async () => {
      const logs = await base44.entities.MitzvahLog.filter({ user_id: profileUser.id }, '-created_date', 50);
      return logs;
    },
    enabled: !!profileUser && isOwnProfile
  });

  const { data: weeklyMitzvahCount = 0 } = useQuery({
    queryKey: ['weekly-mitzvah-count', profileUser?.id],
    queryFn: async () => {
      const actions = await base44.entities.MitzvahAction.filter({ user_id: profileUser.id });
      const logs = await base44.entities.MitzvahLog.filter({ user_id: profileUser.id });
      
      const weekActions = actions.filter(a => {
        const date = parseISO(a.created_date);
        return date >= startOfWeek(new Date()) && date <= endOfWeek(new Date());
      });
      
      const weekLogs = logs.filter(l => {
        const date = parseISO(l.date);
        return date >= startOfWeek(new Date()) && date <= endOfWeek(new Date());
      });
      
      return weekActions.length + weekLogs.length;
    },
    enabled: !!profileUser && isOwnProfile
  });

  const handleMessage = async () => {
    const conversations = await base44.entities.Conversation.list();
    const existing = conversations.find(c => 
      c.participant_ids?.includes(currentUser.id) && c.participant_ids?.includes(profileUser.id)
    );

    if (existing) {
      navigate(createPageUrl('Messages') + `?conversation=${existing.id}`);
    } else {
      const conv = await base44.entities.Conversation.create({
        participant_ids: [currentUser.id, profileUser.id],
        participant_names: [
          currentUser.display_name || currentUser.full_name?.split(' ')[0],
          profileUser.display_name || profileUser.full_name?.split(' ')[0]
        ],
        participant_ages: [currentUser.age_range || '18+', profileUser.age_range || '18+'],
        unread_count: {}
      });
      navigate(createPageUrl('Messages') + `?conversation=${conv.id}`);
    }
  };

  const handleBlock = async () => {
    await base44.entities.Block.create({
      blocker_id: currentUser.id,
      blocked_id: profileUser.id
    });
    toast.success('User blocked');
    navigate(createPageUrl('Feed'));
  };

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const displayName = profileUser.display_name || profileUser.full_name?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#E6F0FF] to-white pt-8 pb-20 px-4">
        <div className="max-w-2xl mx-auto flex justify-between items-start">
          <div></div>
          {isOwnProfile ? (
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => setShowReport(true)}
              >
                <Flag className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={handleBlock}
              >
                <Ban className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-16">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex flex-col items-center -mt-16 mb-4">
            <div className="border-4 border-white shadow-lg">
              <UserAvatar user={{...profileUser, display_name: displayName}} size="xl" />
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
              <Badge variant="outline" className="text-sm">{profileUser.age_range || '18+'}</Badge>
            </div>
            
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-4">
              <MapPin className="w-4 h-4" />
              <span>{profileUser.city || 'Five Towns'}</span>
            </div>

            <div className="space-y-3 mb-4">
              {mitzvahPoints > 0 && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full px-4 py-2 border border-indigo-200">
                  <span className="text-xl">✨</span>
                  <span className="font-semibold text-indigo-700">
                    {mitzvahPoints} Mitzvah Points
                  </span>
                </div>
              )}

              {userStreak && userStreak.current_streak > 0 && (
                <div className="flex justify-center">
                  <StreakBadge streak={userStreak} />
                </div>
              )}
            </div>

            {profileUser.bio && (
              <p className="text-slate-600 mb-4 max-w-sm mx-auto">{profileUser.bio}</p>
            )}

            {profileUser.interests && profileUser.interests.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {profileUser.interests.map((interest, i) => (
                  <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}

            {!isOwnProfile && (
              <Button 
                onClick={handleMessage}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </Button>
            )}

            {isOwnProfile && (
              <Link to={createPageUrl('Settings')}>
                <Button variant="outline" className="gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Weekly Summary - Own Profile Only */}
        {isOwnProfile && (
          <div className="mb-4">
            <WeeklySummary mitzvahCount={weeklyMitzvahCount} />
          </div>
        )}

        {/* Mitzvah Timeline - Own Profile Only */}
        {isOwnProfile && mitzvahLogs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Mitzvah Journey</h2>
            <MitzvahTimeline logs={mitzvahLogs} />
          </div>
        )}

        {/* Posts */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Posts</h2>
        </div>

        {postsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-slate-500">No posts yet</p>
          </div>
        ) : (
          <div className="space-y-4 pb-24">
            {posts.map(post => (
              <PostCard 
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLike={() => {}}
                onComment={() => {}}
                onRepost={() => {}}
                onDelete={() => {}}
                onReport={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      <ReportModal 
        open={showReport}
        onOpenChange={setShowReport}
        contentId={profileUser.id}
        contentType="user"
        currentUser={currentUser}
      />
    </div>
  );
}