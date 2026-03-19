import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, Search, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import InlineFeedPrompt from '@/components/feed/InlineFeedPrompt';
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';
import UnifiedPostModal from '@/components/feed/UnifiedPostModal';
import CommentsSheet from '@/components/feed/CommentsSheet';
import ReportModal from '@/components/common/ReportModal';
import ProfileSetup from '@/components/profile/ProfileSetup';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import PostTypeSelector from '@/components/feed/PostTypeSelector';
import CommunityAlertModal from '@/components/feed/CommunityAlertModal';
import NotificationBell from '@/components/notifications/NotificationBell';
import SearchModal from '@/components/feed/SearchModal';
import PostBox from '@/components/feed/PostBox';
import HomeFeedTabs from '@/components/feed/HomeFeedTabs';
import CommunityActivityStrip from '@/components/feed/CommunityActivityStrip';
import EventsFeedSection from '@/components/feed/EventsFeedSection';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Feed() {
  const navigate = useNavigate();
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
  const [showFABTypeSelector, setShowFABTypeSelector] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [feedPrompts, setFeedPrompts] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        await Promise.allSettled([loadPinnedPrompt(), loadUserLikes(user), loadFeedPrompts()]);
        // Show onboarding once per user if not yet done
        const onboardingKey = `onboarding_done_${user.id}`;
        if (user.is_profile_complete && !user.onboarding_complete && !localStorage.getItem(onboardingKey)) {
          setShowOnboarding(true);
        }
      } catch (e) {
        setCurrentUser({ id: 'guest', full_name: 'Guest', display_name: 'Guest', role: 'user', is_profile_complete: true });
      }
    };
    init();
  }, []);

  const loadPinnedPrompt = async () => {
    try {
      const prompts = await base44.entities.DailyPrompt.filter({ is_pinned: true });
      if (prompts.length > 0) setPinnedPrompt(prompts[0]);
      else {
        const newest = await base44.entities.DailyPrompt.list('-created_date', 1);
        if (newest.length > 0) setPinnedPrompt(newest[0]);
      }
    } catch (e) {}
  };

  const loadFeedPrompts = async () => {
    try {
      const prompts = await base44.entities.DailyPrompt.list('-created_date', 5);
      setFeedPrompts(prompts);
    } catch (e) {}
  };

  const loadUserLikes = async (user) => {
    try {
      const likes = await base44.entities.Like.filter({ user_id: user.id });
      setUserLikes(likes.map(l => l.post_id));
    } catch (e) {}
  };

  const { data: posts = [], isLoading, isError, refetch: refetchPosts } = useQuery({
    queryKey: ['unified-posts'],
    queryFn: () => base44.entities.UnifiedPost.list('-created_date', 40),
    staleTime: 3600000,
    gcTime: 7200000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 0,
    enabled: !!currentUser
  });

  const { data: communityGroups = [] } = useQuery({
    queryKey: ['community-groups-feed'],
    queryFn: () => base44.entities.CommunityGroup.list('-member_count', 10),
    staleTime: 3600000,
    retry: 0,
    enabled: !!currentUser
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
      if (post.user_id && post.user_id !== currentUser.id) {
        base44.entities.Notification.create({
          user_id: post.user_id,
          type: 'like',
          message: `${currentUser.display_name || currentUser.full_name} liked your post`,
          read: false
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
  };

  const handleReport = (id, type) => {
    setReportTarget({ id, type });
    setShowReport(true);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!currentUser.is_profile_complete) {
    return <ProfileSetup user={currentUser} onComplete={() => base44.auth.me().then(setCurrentUser)} />;
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow
        user={currentUser}
        onComplete={() => {
          setShowOnboarding(false);
          base44.auth.me().then(setCurrentUser);
        }}
      />
    );
  }

  const visiblePosts = posts.filter(p => p.type !== 'dating');
  const trendingScore = (p) => (p.likes_count || 0) + (p.comments_count || 0) * 2;

  const feedPosts = (() => {
    const sorted = [...visiblePosts].sort((a, b) => trendingScore(b) - trendingScore(a));
    if (activeTab === 'trending') return sorted.slice(0, 40);
    if (activeTab === 'chessed') return sorted.filter(p => p.type === 'help' || p.board === 'help');
    if (activeTab === 'learning') return sorted.filter(p => p.type === 'news' || /torah|parsha|daf|halacha|shiur/i.test(p.body || ''));
    if (activeTab === 'social') return sorted.filter(p => p.type === 'feed');
    if (activeTab === 'nearby') return sorted.filter(p => p.city);
    if (activeTab === 'events') return sorted.filter(p => p.type === 'event' || p.board === 'events');
    return sorted.slice(0, 40);
  })();

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FB' }}>

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white" style={{ borderBottom: '1px solid #E8ECF4', boxShadow: '0 1px 8px rgba(15,23,42,0.04)' }}>
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="font-bold text-[16px] tracking-[-0.01em] text-slate-900">
            {currentUser?.cityPreset || currentUser?.cityCustom || 'Five Towns'}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <Search className="w-5 h-5 text-slate-500" />
            </button>
            <button onClick={() => navigate(createPageUrl('MyEvents'))} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <Calendar className="w-5 h-5 text-slate-500" />
            </button>
            <NotificationBell userId={currentUser?.id} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-32">

        {/* 1. Post Box */}
        <PostBox
          currentUser={currentUser}
          onPostClick={(type) => { setPostModalType(type === 'photo' ? 'feed' : type); setShowPostModal(true); }}
          onQuickAction={(type) => {
            if (type === 'alert') { setShowAlertModal(true); return; }
            if (type === 'mitzvah') { navigate(createPageUrl('MitzvahCircle')); return; }
            setPostModalType(type);
            setShowPostModal(true);
          }}
        />

        {/* 2. Feed Tabs */}
        <div className="bg-white rounded-2xl border border-slate-100 mb-3 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <HomeFeedTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* 3. Mitzvah Map Preview */}
        <div
          onClick={() => navigate(createPageUrl('MitzvahMap'))}
          className="rounded-2xl p-4 mb-3 cursor-pointer active:scale-[0.99] transition-transform flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-[14px]">Mitzvah Map</p>
            <p className="text-blue-100 text-[12px]">See help requests near you right now</p>
          </div>
          <span className="text-white/80 text-[13px] font-bold">View →</span>
        </div>

        {/* 4. Community Activity */}
        <CommunityActivityStrip groups={communityGroups} />

        {/* 5. Events Calendar Tab */}
        {activeTab === 'events' && !isLoading && (
          <EventsFeedSection
            posts={visiblePosts}
            currentUser={currentUser}
            onCreateEvent={() => { setPostModalType('event'); setShowPostModal(true); }}
          />
        )}

        {/* 6. Feed Posts (all tabs except events) */}
        {activeTab !== 'events' && (isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-2.5 w-16 rounded" />
                  </div>
                </div>
                <div className="skeleton h-3 w-full rounded mb-2" />
                <div className="skeleton h-3 w-4/5 rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 bg-white rounded-2xl cursor-pointer" onClick={() => refetchPosts()}>
            <span className="text-2xl">⚠️</span>
            <p className="text-slate-700 font-semibold mt-2">Feed failed to load</p>
            <p className="text-[13px] text-blue-600 mt-1 font-semibold">Tap to retry</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {feedPosts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-3xl mb-3">💬</p>
                <p className="font-bold text-slate-900">Nothing here yet</p>
                <p className="text-[13px] text-slate-400 mt-1">Be the first to post!</p>
                <button
                  onClick={() => { setPostModalType('feed'); setShowPostModal(true); }}
                  className="mt-4 px-5 py-2 rounded-full text-white text-[13px] font-semibold bg-blue-600"
                >
                  Post Something
                </button>
              </div>
            ) : feedPosts.map((post, index) => (
              <React.Fragment key={post.id}>
                <UnifiedPostCard
                  post={post}
                  currentUser={currentUser}
                  liked={userLikes.includes(post.id)}
                  onLike={handleLike}
                  onComment={(p) => { setSelectedPost(p); setShowComments(true); }}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onReport={handleReport}
                />
                {(index + 1) % 6 === 0 && feedPrompts[(Math.floor((index + 1) / 6) - 1) % feedPrompts.length] && (
                  <InlineFeedPrompt
                    prompt={feedPrompts[(Math.floor((index + 1) / 6) - 1) % feedPrompts.length]}
                    onReply={(p) => { setPinnedPrompt(p); setShowPromptReply(true); }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : null)}
      </div>

      <UnifiedPostModal
        open={showPostModal}
        onOpenChange={(open) => {
          setShowPostModal(open);
          if (!open) queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
        }}
        currentUser={currentUser}
        postType={postModalType}
      />

      <UnifiedPostModal
        open={showPromptReply}
        onOpenChange={(open) => {
          setShowPromptReply(open);
          if (!open) { queryClient.invalidateQueries({ queryKey: ['unified-posts'] }); loadPinnedPrompt(); }
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

      <CommunityAlertModal
        open={showAlertModal}
        onOpenChange={setShowAlertModal}
        currentUser={currentUser}
      />

      <PostTypeSelector
        open={showFABTypeSelector}
        onOpenChange={setShowFABTypeSelector}
        onSelectType={(type) => { setPostModalType(type); setShowPostModal(true); }}
      />

      <SearchModal
        open={showSearch}
        onOpenChange={setShowSearch}
        posts={visiblePosts}
        helpRequests={[]}
        communities={[]}
      />
    </div>
  );
}