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
import NearbyHelpBanner from '@/components/feed/NearbyHelpBanner';
import CommunityResponseScore from '@/components/feed/CommunityResponseScore';
import LiveHelpBoard from '@/components/feed/LiveHelpBoard';
import CommunityAlertModal from '@/components/feed/CommunityAlertModal';
import CommunityAlertBanner from '@/components/feed/CommunityAlertBanner';
import WeeklyActivityBar from '@/components/feed/WeeklyActivityBar';
import WeeklyImpactCard from '@/components/feed/WeeklyImpactCard';
import { toast } from 'sonner';
import { format, isToday, parseISO } from 'date-fns';


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
  const [showAlertModal, setShowAlertModal] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        // Run these in parallel, ignore individual failures
        await Promise.allSettled([loadPinnedPrompt(), loadUserLikes(user)]);
      } catch (e) {
        console.warn('Feed init error:', e?.message);
        // Bypass auth — allow guest access temporarily
        setCurrentUser({ id: 'guest', full_name: 'Guest', display_name: 'Guest', role: 'user', is_profile_complete: true });
      }
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
    try {
      const prompts = await base44.entities.DailyPrompt.filter({ is_pinned: true });
      if (prompts.length > 0) {
        setPinnedPrompt(prompts[0]);
      } else {
        const newest = await base44.entities.DailyPrompt.list('-created_date', 1);
        if (newest.length > 0) setPinnedPrompt(newest[0]);
      }
    } catch (e) {
      console.warn('loadPinnedPrompt failed:', e?.message);
    }
  };

  const loadUserLikes = async (user) => {
    try {
      const u = user || await base44.auth.me();
      const likes = await base44.entities.Like.filter({ user_id: u.id });
      setUserLikes(likes.map(l => l.post_id));
    } catch (e) {
      console.warn('loadUserLikes failed:', e?.message);
    }
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

  const { data: recentlyCompleted = [] } = useQuery({
    queryKey: ['recently-completed'],
    queryFn: () => base44.entities.MitzvahRequest.filter({ status: 'completed' }, '-updated_date', 3),
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
      return base44.entities.MitzvahRequest.filter({ status: 'open' }, '-created_date', 50);
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
    <div className="min-h-screen" style={{ background: 'var(--background)', scrollBehavior: 'smooth' }}>

      {/* Header */}
      <div className="sticky top-0 z-20" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 8px rgba(15,23,42,0.04)' }}>
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="font-bold text-[16px] tracking-[-0.01em]" style={{ color: 'var(--text-main)' }}>
            {currentUser?.cityPreset || currentUser?.cityCustom || 'Five Towns'}
          </span>

        </div>
        <div className="max-w-2xl mx-auto">
          <FeedCategoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />
        </div>
      </div>

      <div className="main-feed">
        {/* Community Help Center Hero */}
        {activeCategory === 'all' && (
          <div
            className="rounded-2xl mb-4 p-4 cursor-pointer active:scale-[0.99] transition-all"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #152d6e 100%)', boxShadow: '0 8px 24px rgba(30,58,138,0.25)' }}
            onClick={() => {
              setPostModalType('help');
              setShowPostModal(true);
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/60 text-[11px] font-semibold uppercase tracking-widest mb-1">Live Now</p>
                <h2 className="text-white font-bold text-[22px] leading-tight">Community Help Center</h2>
                <div className="flex items-center gap-3 mt-2.5">
                  {openMitzvahRequests.filter(r => r.urgency === 'HIGH').length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-white font-bold text-[14px]">
                        {openMitzvahRequests.filter(r => r.urgency === 'HIGH').length} urgent
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-white/80 font-semibold text-[14px]">
                      {openMitzvahRequests.length} active requests
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white/15 rounded-xl px-3.5 py-2 text-center mt-1">
                <p className="text-white font-bold text-[22px] leading-tight">{openMitzvahRequests.length}</p>
                <p className="text-white/70 text-[10px] font-semibold">open</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPostModalType('help');
                setShowPostModal(true);
              }}
              className="mt-3 w-full py-3.5 rounded-xl font-bold text-[15px] tracking-wide active:scale-[0.98] transition-all"
              style={{ background: 'var(--primary)', color: '#fff', boxShadow: '0 4px 12px rgba(22,163,74,0.35)' }}
            >
              🙋 REQUEST HELP
            </button>
          </div>
        )}

        {/* Recently Completed */}
        {activeCategory === 'all' && recentlyCompleted.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Recently Completed</span>
              <span className="ml-auto text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Your community shows up</span>
            </div>
            <div style={{ borderTop: 'none' }}>
              {recentlyCompleted.map((req, i) => (
                <div key={req.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <span className="font-bold text-[13px]" style={{ color: 'var(--success)' }}>✔</span>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-main)' }}>{req.title}</p>
                  {req.claimed_by_name && (
                    <span className="ml-auto text-[11px] font-medium flex-shrink-0" style={{ color: 'var(--text-muted)' }}>by {req.claimed_by_name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Activity Bar */}
        <WeeklyActivityBar />

        {/* Community Alert Banner */}
        <CommunityAlertBanner currentUser={currentUser} />

        {/* Pinned widgets — only on "All" tab */}
        {activeCategory === 'all' && (
          <div className="space-y-3 mb-4">
            {userStreak && (
              <div className="rounded-[14px] px-4 py-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mb-3">Your Daily Mitzvah</p>
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
            <WeeklyImpactCard />
            <CommunityResponseScore />
            {pinnedPrompt && (
              <DailyPromptCard prompt={pinnedPrompt} onReply={handlePromptReply} />
            )}
          </div>
        )}

        {/* Nearby Help Banner */}
        {activeCategory === 'all' && (
          <NearbyHelpBanner currentUser={currentUser} onClaim={handleHelpMitzvah} />
        )}

        {/* Live Help Board - Scaled down */}
        {activeCategory === 'all' && openMitzvahRequests.length > 0 && (
          <div style={{ transform: 'scale(0.9)', transformOrigin: 'top left', marginBottom: '-10%' }}>
            <LiveHelpBoard requests={openMitzvahRequests} onClaim={handleHelpMitzvah} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-card">
          <button
            onClick={() => {
              setPostModalType('help');
              setShowPostModal(true);
            }}
            className="primary-btn"
          >
            Request Help
          </button>
          <button
            onClick={() => {
              setPostModalType('feed');
              setShowPostModal(true);
            }}
            className="secondary-btn"
          >
            Offer Help
          </button>
        </div>

        {/* Alert Button */}
        <button
          onClick={() => setShowAlertModal(true)}
          className="w-full active:scale-95 text-[#0F1C2E] font-semibold text-[13px] py-3 rounded-xl transition-all mb-4"
          style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
          title="Community Alert"
        >
          🚨 Report Community Alert
        </button>

        {isLoading ? (
          <div className="space-y-3 pb-24">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] p-4" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)' }}>
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
            className="text-center py-12 bg-white rounded-[16px] cursor-pointer"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={() => refetchPosts()}
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-[#0F1C2E] font-semibold text-[15px]">Feed failed to load</p>
            <p className="text-[13px] text-[#2563EB] mt-1 font-semibold">Tap to retry</p>
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[16px]" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
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

      <CommunityAlertModal
        open={showAlertModal}
        onOpenChange={setShowAlertModal}
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
          className="flex items-center gap-2 text-white text-[14px] font-semibold px-5 py-2.5 rounded-full active:scale-95 transition-all"
          style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}
        >
          <span className="text-[18px] leading-none font-light">+</span>
          Post
        </button>
      </div>
      </div>
      );
}