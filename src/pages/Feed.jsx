import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DailyPromptCard from '@/components/feed/DailyPromptCard';
import QuickActions from '@/components/feed/QuickActions';
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';
import UnifiedPostModal from '@/components/feed/UnifiedPostModal';
import CommentsSheet from '@/components/feed/CommentsSheet';
import ReportModal from '@/components/common/ReportModal';
import ProfileSetup from '@/components/profile/ProfileSetup';
import ShabbatBanner from '@/components/feed/ShabbatBanner';
import TodaySummaryCard from '@/components/feed/TodaySummaryCard';
import HappeningTodayCard from '@/components/feed/HappeningTodayCard';
import MitzvahNowCard from '@/components/feed/MitzvahNowCard';
import ActivityPulseBanner from '@/components/feed/ActivityPulseBanner';
import HappeningTonightSection from '@/components/feed/HappeningTonightSection';
import CommunityWinsCard from '@/components/feed/CommunityWinsCard';
import TopHelpersCard from '@/components/feed/TopHelpersCard';
import MitzvahSharePrompt from '@/components/feed/MitzvahSharePrompt';
import StreakBanner from '@/components/feed/StreakBanner';
import StreakProgress from '@/components/feed/StreakProgress';
import LogMitzvahModal from '@/components/feed/LogMitzvahModal';
import { toast } from 'sonner';
import { format, isToday, parseISO, subHours, startOfWeek, endOfWeek } from 'date-fns';

export default function Feed() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postModalType, setPostModalType] = useState('feed');
  const [showPromptReply, setShowPromptReply] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
  const [pinnedPrompt, setPinnedPrompt] = useState(null);
  const [userLikes, setUserLikes] = useState([]);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [showLogMitzvah, setShowLogMitzvah] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
    loadPinnedPrompt();
    loadUserLikes();
  }, []);

  const loadUser = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
  };

  const loadPinnedPrompt = async () => {
    const prompts = await base44.entities.DailyPrompt.filter({ is_pinned: true });
    if (prompts.length > 0) {
      setPinnedPrompt(prompts[0]);
    } else {
      const newest = await base44.entities.DailyPrompt.list('-created_date', 1);
      if (newest.length > 0) setPinnedPrompt(newest[0]);
    }
  };

  const loadUserLikes = async () => {
    const user = await base44.auth.me();
    const likes = await base44.entities.Like.filter({ user_id: user.id });
    setUserLikes(likes.map(l => l.post_id));
  };

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['unified-posts'],
    queryFn: async () => {
      const allPosts = await base44.entities.UnifiedPost.list('-created_date', 100);
      return allPosts;
    }
  });

  const { data: todayEvents = [] } = useQuery({
    queryKey: ['today-events'],
    queryFn: async () => {
      const events = await base44.entities.UnifiedPost.filter({ type: 'event' }, '-created_date', 20);
      const today = format(new Date(), 'yyyy-MM-dd');
      return events.filter(e => e.event_date === today);
    }
  });

  const { data: openMitzvahRequests = [] } = useQuery({
    queryKey: ['open-mitzvah'],
    queryFn: async () => {
      const requests = await base44.entities.MitzvahRequest.filter({ status: 'Open' }, '-created_date', 10);
      return requests.filter(r => {
        const createdToday = isToday(parseISO(r.created_date));
        return createdToday;
      });
    }
  });

  const { data: todayActions = [] } = useQuery({
    queryKey: ['today-actions'],
    queryFn: async () => {
      const actions = await base44.entities.MitzvahAction.list('-created_date', 100);
      return actions.filter(a => isToday(parseISO(a.created_date)));
    }
  });

  const { data: tonightEvents = [] } = useQuery({
    queryKey: ['tonight-events'],
    queryFn: async () => {
      const events = await base44.entities.UnifiedPost.filter({ type: 'event' }, '-created_date', 20);
      const now = new Date();
      const tonight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const twelveHoursFromNow = subHours(tonight, 12);
      
      return events.filter(e => {
        if (!e.event_date || !e.event_time) return false;
        const eventDateTime = parseISO(`${e.event_date}T${e.event_time}`);
        return eventDateTime >= now && eventDateTime <= twelveHoursFromNow;
      });
    }
  });

  const { data: activeUsersToday = 0 } = useQuery({
    queryKey: ['active-users-today'],
    queryFn: async () => {
      const todayPosts = await base44.entities.UnifiedPost.list('-created_date', 200);
      const uniqueUsers = new Set(todayPosts.filter(p => isToday(parseISO(p.created_date))).map(p => p.user_id));
      return uniqueUsers.size;
    }
  });

  const { data: weeklyStats } = useQuery({
    queryKey: ['weekly-stats'],
    queryFn: async () => {
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const existing = await base44.entities.WeeklyStats.filter({ week_start: weekStart });
      
      if (existing.length > 0) return existing[0];
      
      const actions = await base44.entities.MitzvahAction.list('-created_date', 500);
      const weekActions = actions.filter(a => {
        const actionDate = parseISO(a.created_date);
        return actionDate >= startOfWeek(new Date()) && actionDate <= endOfWeek(new Date());
      });
      
      const helperCounts = {};
      weekActions.forEach(a => {
        helperCounts[a.user_id] = (helperCounts[a.user_id] || 0) + 1;
      });
      
      const allUsers = await base44.entities.User.list();
      const newUsers = allUsers.filter(u => {
        const joinDate = parseISO(u.created_date);
        return joinDate >= startOfWeek(new Date()) && joinDate <= endOfWeek(new Date());
      });

      const topHelpers = Object.entries(helperCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, count]) => {
          const user = allUsers.find(u => u.id === userId);
          return { ...user, count };
        });

      return {
        week_start: weekStart,
        mitzvahs_completed: weekActions.length,
        new_users: newUsers.length,
        total_posts: posts.filter(p => {
          const postDate = parseISO(p.created_date);
          return postDate >= startOfWeek(new Date()) && postDate <= endOfWeek(new Date());
        }).length,
        top_helpers: topHelpers
      };
    }
  });

  const { data: recentMitzvah } = useQuery({
    queryKey: ['recent-mitzvah'],
    queryFn: async () => {
      const actions = await base44.entities.MitzvahAction.list('-created_date', 1);
      if (actions.length > 0) {
        return actions[0].request_title;
      }
      const logs = await base44.entities.MitzvahLog.list('-created_date', 1);
      if (logs.length > 0) {
        return logs[0].description;
      }
      return null;
    }
  });

  const { data: topHelpers = [] } = useQuery({
    queryKey: ['top-helpers-week'],
    queryFn: async () => {
      const actions = await base44.entities.MitzvahAction.list('-created_date', 500);
      const weekActions = actions.filter(a => {
        const actionDate = parseISO(a.created_date);
        return actionDate >= startOfWeek(new Date()) && actionDate <= endOfWeek(new Date());
      });
      
      const helperCounts = {};
      weekActions.forEach(a => {
        helperCounts[a.user_id] = (helperCounts[a.user_id] || 0) + 1;
      });
      
      const allUsers = await base44.entities.User.list();
      const helpers = Object.entries(helperCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([userId, count]) => {
          const user = allUsers.find(u => u.id === userId);
          const badges = [];
          
          if (count === 1) badges.push('first_mitzvah');
          if (count >= 3) badges.push('weekly_helper');
          if (count >= 10) badges.push('community_helper');
          
          return { ...user, count, badges };
        });

      return helpers;
    }
  });

  const { data: userStreak, refetch: refetchStreak } = useQuery({
    queryKey: ['user-streak', currentUser?.id],
    queryFn: async () => {
      const existing = await base44.entities.UserStreak.filter({ user_id: currentUser.id });
      if (existing.length > 0) return existing[0];
      
      const newStreak = await base44.entities.UserStreak.create({
        user_id: currentUser.id,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: format(new Date(), 'yyyy-MM-dd'),
        badge_level: 'none'
      });
      return newStreak;
    },
    enabled: !!currentUser
  });

  const { data: todayMitzvahCount = 0 } = useQuery({
    queryKey: ['today-mitzvah-count', currentUser?.id],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const actions = await base44.entities.MitzvahAction.filter({ user_id: currentUser.id });
      const logs = await base44.entities.MitzvahLog.filter({ user_id: currentUser.id, date: today });
      
      const todayActions = actions.filter(a => {
        const actionDate = format(parseISO(a.created_date), 'yyyy-MM-dd');
        return actionDate === today;
      });
      
      return todayActions.length + logs.length;
    },
    enabled: !!currentUser
  });

  const todayStats = {
    eventsToday: todayEvents.length,
    mitzvahNeeds: openMitzvahRequests.length,
    newPostsToday: posts.filter(p => isToday(parseISO(p.created_date))).length,
    actionsToday: todayActions.length
  };

  const pulseStats = {
    activeUsers: activeUsersToday,
    mitzvahs: todayActions.length,
    posts: posts.filter(p => isToday(parseISO(p.created_date))).length
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UnifiedPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
      toast.success('Post deleted');
    }
  });

  const handleLike = async (postId) => {
    const isLiked = userLikes.includes(postId);
    const post = posts.find(p => p.id === postId);
    
    if (isLiked) {
      const like = await base44.entities.Like.filter({ post_id: postId, user_id: currentUser.id });
      if (like[0]) await base44.entities.Like.delete(like[0].id);
      await base44.entities.UnifiedPost.update(postId, { likes_count: Math.max(0, (post.likes_count || 0) - 1) });
      setUserLikes(prev => prev.filter(id => id !== postId));
    } else {
      await base44.entities.Like.create({ post_id: postId, user_id: currentUser.id });
      await base44.entities.UnifiedPost.update(postId, { likes_count: (post.likes_count || 0) + 1 });
      setUserLikes(prev => [...prev, postId]);
    }
    queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
  };

  const handleQuickAction = (type) => {
    setPostModalType(type);
    setShowPostModal(true);
  };

  const handlePromptReply = () => {
    setShowPromptReply(true);
  };

  const handleReport = (id, type) => {
    setReportTarget({ id, type });
    setShowReport(true);
  };

  const handleViewEvent = (event) => {
    setSelectedPost(event);
    setShowComments(true);
  };

  const handleHelpMitzvah = async (request) => {
    try {
      await base44.entities.MitzvahRequest.update(request.id, { 
        status: 'Claimed',
        claimed_by_user_id: currentUser.id,
        claimed_by_name: currentUser.display_name || currentUser.full_name
      });
      
      await base44.entities.MitzvahAction.create({
        user_id: currentUser.id,
        user_name: currentUser.display_name || currentUser.full_name,
        request_id: request.id,
        request_title: request.title,
        points_awarded: 10
      });

      const existingPoints = await base44.entities.MitzvahPoints.filter({ user_id: currentUser.id });
      if (existingPoints.length > 0) {
        await base44.entities.MitzvahPoints.update(existingPoints[0].id, {
          total_points: (existingPoints[0].total_points || 0) + 10
        });
      } else {
        await base44.entities.MitzvahPoints.create({
          user_id: currentUser.id,
          user_name: currentUser.display_name || currentUser.full_name,
          total_points: 10
        });
      }

      await updateStreak();
      queryClient.invalidateQueries(['open-mitzvah']);
      queryClient.invalidateQueries(['today-actions']);
      queryClient.invalidateQueries(['top-helpers-week']);
      queryClient.invalidateQueries(['weekly-stats']);
      queryClient.invalidateQueries(['today-mitzvah-count']);
      toast.success('You claimed this mitzvah! +10 points');
      setShowSharePrompt(true);
      setTimeout(() => setShowSharePrompt(false), 8000);
    } catch (error) {
      toast.error('Failed to claim mitzvah');
    }
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

      await updateStreak();
      queryClient.invalidateQueries(['today-mitzvah-count']);
      queryClient.invalidateQueries(['user-streak']);
      toast.success('You made a difference today. 💜');
    } catch (error) {
      toast.error('Failed to log mitzvah');
    }
  };

  const updateStreak = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const count = todayMitzvahCount + 1;

    if (count >= 2) {
      const lastDate = userStreak?.last_activity_date;
      const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
      
      let newStreak = 1;
      if (lastDate === yesterday) {
        newStreak = (userStreak.current_streak || 0) + 1;
      } else if (lastDate === today) {
        newStreak = userStreak.current_streak || 1;
      }

      const newLongest = Math.max(newStreak, userStreak?.longest_streak || 0);
      let badgeLevel = 'none';
      if (newStreak >= 30) badgeLevel = 'elite';
      else if (newStreak >= 10) badgeLevel = 'gold';
      else if (newStreak >= 5) badgeLevel = 'silver';
      else if (newStreak >= 2) badgeLevel = 'basic';

      await base44.entities.UserStreak.update(userStreak.id, {
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
        badge_level: badgeLevel
      });

      refetchStreak();
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

  const feedPosts = posts.filter(p => p.type === 'feed' || p.type === 'prompt_reply');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Shabbat Banner */}
        <ShabbatBanner onCreatePost={() => setShowPostModal(true)} />

        {/* Streak Banner */}
        {userStreak && (
          <StreakBanner 
            streak={userStreak}
            todayCount={todayMitzvahCount}
            onLogMitzvah={() => setShowLogMitzvah(true)}
          />
        )}

        {/* Streak Progress */}
        {userStreak && (
          <StreakProgress 
            todayCount={todayMitzvahCount}
            streak={userStreak}
          />
        )}

        {/* Activity Pulse */}
        <ActivityPulseBanner stats={pulseStats} />

        {/* Community Wins */}
        <CommunityWinsCard weeklyStats={weeklyStats} recentMitzvah={recentMitzvah} />

        {/* Top Helpers */}
        <TopHelpersCard helpers={topHelpers} />

        {/* Today Summary */}
        <TodaySummaryCard stats={todayStats} />

        {/* Happening Tonight */}
        <HappeningTonightSection 
          events={tonightEvents}
          mitzvahRequests={openMitzvahRequests.slice(0, 3)}
          onViewEvent={handleViewEvent}
          onHelpMitzvah={handleHelpMitzvah}
        />

        {/* Happening Today */}
        {todayEvents.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-orange-600">🔥</span>
              Happening Today
            </h2>
            <div className="space-y-3">
              {todayEvents.slice(0, 3).map(event => (
                <HappeningTodayCard 
                  key={event.id}
                  event={event}
                  onView={handleViewEvent}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mitzvah Happening Now */}
        {openMitzvahRequests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-purple-600">💜</span>
              Mitzvah Happening Now
            </h2>
            <div className="space-y-3">
              {openMitzvahRequests.slice(0, 3).map(request => (
                <MitzvahNowCard 
                  key={request.id}
                  request={request}
                  onHelp={handleHelpMitzvah}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Daily Prompt */}
        {pinnedPrompt && (
          <div className="mb-6">
            <DailyPromptCard prompt={pinnedPrompt} onReply={handlePromptReply} />
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions onAction={handleQuickAction} />

        {/* Community Posts */}
        <div className="mb-3">
          <h2 className="text-lg font-bold text-slate-900">Community Posts</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-slate-600 font-medium">No posts yet</p>
            <p className="text-sm text-slate-400 mt-1">Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-2 pb-24">
            {feedPosts.map(post => (
              <UnifiedPostCard 
                key={post.id}
                post={post}
                currentUser={currentUser}
                liked={userLikes.includes(post.id)}
                onLike={handleLike}
                onComment={(p) => { setSelectedPost(p); setShowComments(true); }}
                onDelete={(id) => deleteMutation.mutate(id)}
                onReport={handleReport}
              />
            ))}
          </div>
        )}
      </div>

      <UnifiedPostModal 
        open={showPostModal} 
        onOpenChange={(open) => {
          setShowPostModal(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
            queryClient.invalidateQueries({ queryKey: ['today-events'] });
            queryClient.invalidateQueries({ queryKey: ['open-mitzvah'] });
          }
        }}
        currentUser={currentUser}
        postType={postModalType}
      />

      <UnifiedPostModal 
        open={showPromptReply} 
        onOpenChange={(open) => {
          setShowPromptReply(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
            loadPinnedPrompt();
          }
        }}
        currentUser={currentUser}
        postType="prompt_reply"
        promptId={pinnedPrompt?.id}
        promptText={pinnedPrompt?.question}
      />

      <CommentsSheet 
        open={showComments}
        onOpenChange={setShowComments}
        post={selectedPost}
        currentUser={currentUser}
        onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ['unified-posts'] })}
      />

      <ReportModal 
        open={showReport}
        onOpenChange={setShowReport}
        contentId={reportTarget.id}
        contentType={reportTarget.type}
        currentUser={currentUser}
      />

      {showSharePrompt && <MitzvahSharePrompt onClose={() => setShowSharePrompt(false)} />}
      
      <LogMitzvahModal 
        open={showLogMitzvah}
        onOpenChange={setShowLogMitzvah}
        onSubmit={handleLogMitzvah}
      />
    </div>
  );
}