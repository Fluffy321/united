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
import HappeningTodayCard from '@/components/feed/HappeningTodayCard';
import MitzvahNowCard from '@/components/feed/MitzvahNowCard';
import MitzvahSharePrompt from '@/components/feed/MitzvahSharePrompt';
import StreakBanner from '@/components/feed/StreakBanner';
import StreakProgress from '@/components/feed/StreakProgress';
import LogMitzvahModal from '@/components/feed/LogMitzvahModal';
import QuickPostPrompt from '@/components/feed/QuickPostPrompt';
import QuickPostModal from '@/components/feed/QuickPostModal';
import PostTypeSelector from '@/components/feed/PostTypeSelector';
import FeedCategoryTabs from '@/components/feed/FeedCategoryTabs';
import { toast } from 'sonner';
import { format, isToday, parseISO } from 'date-fns';
import { SlidersHorizontal } from 'lucide-react';

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
  const [showQuickPostPrompt, setShowQuickPostPrompt] = useState(false);
  const [showQuickPostModal, setShowQuickPostModal] = useState(false);
  const [scrollStartTime, setScrollStartTime] = useState(null);
  const [showFABTypeSelector, setShowFABTypeSelector] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      // Run these in parallel after we have the user — single auth.me() call
      await Promise.all([loadPinnedPrompt(), loadUserLikes(user)]);
    };
    init();
  }, []);

  useEffect(() => {
    // Check if dismissed in last 24 hours
    const dismissedTime = localStorage.getItem('quickPostPromptDismissed');
    if (dismissedTime) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) return;
    }

    // Start tracking scroll time
    setScrollStartTime(Date.now());

    const timer = setTimeout(() => {
      setShowQuickPostPrompt(true);
    }, 17000); // 17 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleDismissQuickPost = () => {
    setShowQuickPostPrompt(false);
    localStorage.setItem('quickPostPromptDismissed', Date.now().toString());
  };

  const handleOpenQuickPost = () => {
    setShowQuickPostPrompt(false);
    setShowQuickPostModal(true);
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

  const loadUserLikes = async (user) => {
    const u = user || await base44.auth.me();
    const likes = await base44.entities.Like.filter({ user_id: u.id });
    setUserLikes(likes.map(l => l.post_id));
  };

  const { data: posts = [], isLoading, isError, refetch: refetchPosts } = useQuery({
    queryKey: ['unified-posts'],
    queryFn: () => base44.entities.UnifiedPost.list('-created_date', 100),
    staleTime: 300000, // 5 minutes — don't refetch unless stale
    gcTime: 600000,    // keep in cache 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // use cache if available
    retry: 1,
    enabled: !!currentUser
  });

  const { data: todayEvents = [] } = useQuery({
    queryKey: ['today-events'],
    queryFn: async () => {
      const events = await base44.entities.UnifiedPost.filter({ type: 'event' }, '-created_date', 20);
      const today = format(new Date(), 'yyyy-MM-dd');
      return events.filter(e => e.event_date === today);
    },
    staleTime: 600000,
    gcTime: 600000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    enabled: !!currentUser
  });

  const { data: openMitzvahRequests = [] } = useQuery({
    queryKey: ['open-mitzvah'],
    queryFn: async () => {
      const requests = await base44.entities.MitzvahRequest.filter({ status: 'Open' }, '-created_date', 10);
      return requests.filter(r => isToday(parseISO(r.created_date)));
    },
    staleTime: 600000,
    gcTime: 600000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    enabled: !!currentUser
  });

  const { data: todayActions = [] } = useQuery({
    queryKey: ['today-actions'],
    queryFn: async () => {
      const actions = await base44.entities.MitzvahAction.list('-created_date', 100);
      return actions.filter(a => isToday(parseISO(a.created_date)));
    },
    staleTime: 600000,
    gcTime: 600000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    enabled: !!currentUser
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
    staleTime: 600000,
    gcTime: 600000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1
  });

  const { data: todayMitzvahCount = 0 } = useQuery({
    queryKey: ['today-mitzvah-count', currentUser?.id],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [actions, logs] = await Promise.all([
        base44.entities.MitzvahAction.filter({ user_id: currentUser.id }),
        base44.entities.MitzvahLog.filter({ user_id: currentUser.id, date: today })
      ]);
      const todayActionCount = actions.filter(a => format(parseISO(a.created_date), 'yyyy-MM-dd') === today).length;
      return todayActionCount + logs.length;
    },
    enabled: !!currentUser,
    staleTime: 600000,
    gcTime: 600000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1
  });



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
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0F1C2E] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!currentUser.is_profile_complete) {
    return <ProfileSetup user={currentUser} onComplete={() => base44.auth.me().then(setCurrentUser)} />;
  }

  const visiblePosts = posts.filter(p => p.type !== 'dating');
  const feedPosts = (() => {
    if (activeCategory === 'all') return visiblePosts.slice(0, 50);
    if (activeCategory === 'discussion') return visiblePosts.filter(p => p.type === 'feed' || p.type === 'prompt_reply');
    if (activeCategory === 'event') return visiblePosts.filter(p => p.type === 'event');
    if (activeCategory === 'job') return visiblePosts.filter(p => p.type === 'job');
    if (activeCategory === 'help') return visiblePosts.filter(p => p.type === 'help' || p.board === 'help');
    if (activeCategory === 'news') return visiblePosts.filter(p => p.type === 'news');
    return visiblePosts.slice(0, 50);
  })();

  return (
    <div className="min-h-screen bg-[#F5F7FB]" style={{ scrollBehavior: 'smooth' }}>

      {/* Header */}
      <div className="bg-white sticky top-0 z-20" style={{ borderBottom: '1px solid #E8ECF4', boxShadow: '0 1px 8px rgba(15,23,42,0.04)' }}>
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="font-bold text-[#0F1C2E] text-[16px] tracking-[-0.01em]">
            {currentUser?.cityPreset || currentUser?.cityCustom || 'Five Towns'}
          </span>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F2F4F7] transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-[#667085]" />
          </button>
        </div>
        <div className="max-w-2xl mx-auto">
          <FeedCategoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Pinned widgets — only on "All" tab */}
        {activeCategory === 'all' && (
          <div className="space-y-3 mb-4">
            {userStreak && (
              <div className="bg-gradient-to-br from-[#0F1C2E] to-[#1e3a5f] rounded-[14px] px-4 py-4">
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-3">Your Daily Mitzvah</p>
                <StreakBanner
                  streak={userStreak}
                  todayCount={todayMitzvahCount}
                  onLogMitzvah={() => setShowLogMitzvah(true)}
                />
                <div className="mt-2.5">
                  <StreakProgress todayCount={todayMitzvahCount} streak={userStreak} />
                </div>
              </div>
            )}
            {pinnedPrompt && (
              <DailyPromptCard prompt={pinnedPrompt} onReply={handlePromptReply} />
            )}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 pb-24">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-[14px] border border-[#EAECF0] p-4" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-2.5 w-16 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-4/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div
            className="text-center py-12 bg-white rounded-[14px] border border-[#EAECF0] cursor-pointer"
            onClick={() => refetchPosts()}
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-[#0F1C2E] font-semibold text-[15px]">Feed failed to load</p>
            <p className="text-[13px] text-[#2563EB] mt-1 font-semibold">Tap to retry</p>
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[14px] border border-[#EAECF0]">
            <div className="w-14 h-14 rounded-full bg-[#F2F4F7] flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-[#0F1C2E] font-semibold text-[15px]">No posts yet</p>
            <p className="text-[13px] text-[#98A2B3] mt-1">Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-2.5 pb-24">
            {feedPosts.map((post) => (
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

      <QuickPostPrompt 
        show={showQuickPostPrompt}
        onQuickPost={handleOpenQuickPost}
        onDismiss={handleDismissQuickPost}
      />

      <QuickPostModal 
        open={showQuickPostModal}
        onOpenChange={(open) => {
          setShowQuickPostModal(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
          }
        }}
        currentUser={currentUser}
      />

      <PostTypeSelector 
        open={showFABTypeSelector}
        onOpenChange={setShowFABTypeSelector}
        onSelectType={(type) => {
          setPostModalType(type);
          setShowPostModal(true);
        }}
      />

      {/* FAB */}
      <div className="fixed bottom-[80px] left-4 z-30">
        <button
          onClick={() => setShowFABTypeSelector(true)}
          className="flex items-center gap-2 bg-[#0F1C2E] text-white text-[14px] font-semibold px-5 py-2.5 rounded-full active:scale-95 transition-all"
          style={{ boxShadow: '0 4px 14px rgba(15,28,46,0.35)' }}
        >
          <span className="text-[18px] leading-none font-light">+</span>
          Post
        </button>
      </div>
      </div>
      );
}