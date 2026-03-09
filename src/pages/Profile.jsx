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
import HelperBadge from '@/components/profile/HelperBadge';
import WeeklySummary from '@/components/profile/WeeklySummary';
import MitzvahTimeline from '@/components/profile/MitzvahTimeline';
import HelperBadgeShowcase from '@/components/profile/HelperBadgeShowcase';
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

  const [mitzvahPoints, setMitzvahPoints] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadMitzvahPoints = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const profileId = params.get('id');
      const user = await base44.auth.me();
      const targetUserId = profileId || user.id;
      
      const points = await base44.entities.MitzvahPoints.filter({ user_id: targetUserId });
      if (points.length > 0) {
        setMitzvahPoints(points[0].total_points);
      }
    } catch (error) {
      console.warn('Failed to load mitzvah points:', error?.message);
      // Silently fail - use default value of 0
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
    <div className="min-h-screen bg-[#F8FAFB]">
      {/* Header band */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-base">Profile</span>
          {isOwnProfile ? (
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="text-slate-500" onClick={() => setShowReport(true)}>
                <Flag className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-500" onClick={handleBlock}>
                <Ban className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-28 space-y-4 pt-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0">
              <UserAvatar user={{...profileUser, display_name: displayName}} size="xl" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-slate-900 truncate">{displayName}</h1>
                <Badge variant="outline" className="text-xs flex-shrink-0">{profileUser.age_range || '18+'}</Badge>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-[13px] mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{profileUser.city || 'Five Towns'}</span>
              </div>
              {profileUser.helper_badge && profileUser.helper_badge !== 'none' && (
                <HelperBadge badge={profileUser.helper_badge} size="sm" />
              )}
            </div>
          </div>

          {profileUser.bio && (
            <p className="text-slate-600 text-[14px] leading-relaxed mb-3">{profileUser.bio}</p>
          )}

          {mitzvahPoints > 0 && (
            <div className="inline-flex items-center gap-2 bg-amber-50 rounded-full px-3 py-1.5 border border-amber-200 mb-3">
              <span>✨</span>
              <span className="font-semibold text-amber-700 text-[13px]">{mitzvahPoints} Mitzvah Points</span>
            </div>
          )}

          {userStreak && userStreak.current_streak > 0 && (
            <div className="mb-3">
              <StreakBadge streak={userStreak} />
            </div>
          )}

          {profileUser.interests && profileUser.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {profileUser.interests.map((interest, i) => (
                <span key={i} className="text-[12px] font-medium bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  {interest}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {!isOwnProfile ? (
              <button
                onClick={handleMessage}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold text-white rounded-xl active:scale-[0.98] transition-all"
                style={{ background: 'var(--primary)' }}
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </button>
            ) : (
              <Link to={createPageUrl('Settings')} className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 active:scale-[0.98] transition-all">
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Impact Stats */}
        {isOwnProfile && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h2 className="text-[14px] font-bold text-slate-900 mb-3">Impact</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-xl font-bold text-slate-900">{mitzvahPoints}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Points</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-xl font-bold text-slate-900">{weeklyMitzvahCount}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">This Week</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-xl font-bold text-slate-900">{userStreak?.current_streak || 0}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Day Streak</p>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Summary */}
        {isOwnProfile && (
          <WeeklySummary mitzvahCount={weeklyMitzvahCount} />
        )}

        {/* Helper Badge Showcase */}
        {isOwnProfile && (
          <HelperBadgeShowcase
            currentBadge={profileUser.helper_badge || 'none'}
            actionCount={profileUser.helper_actions_count || 0}
          />
        )}

        {/* Mitzvah Timeline */}
        {isOwnProfile && mitzvahLogs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h2 className="text-[14px] font-bold text-slate-900 mb-3">Mitzvah Journey</h2>
            <MitzvahTimeline logs={mitzvahLogs} />
          </div>
        )}

        {/* Recent Posts */}
        <div>
          <h2 className="text-[14px] font-bold text-slate-900 mb-3">Recent Posts</h2>
          {postsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
              <p className="text-slate-400 text-[14px]">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
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