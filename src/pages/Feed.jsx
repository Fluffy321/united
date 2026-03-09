import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
import QuickPostPrompt from '@/components/feed/QuickPostPrompt';
import QuickPostModal from '@/components/feed/QuickPostModal';
import PostTypeSelector from '@/components/feed/PostTypeSelector';
import FeedCategoryTabs from '@/components/feed/FeedCategoryTabs';
import CommunityAlertModal from '@/components/feed/CommunityAlertModal';
import NotificationBell from '@/components/notifications/NotificationBell';
import SearchModal from '@/components/feed/SearchModal';
import { toast } from 'sonner';

function CommunityPostItemPreview({ post, currentUser }) {
  const typeEmoji = {
    post: '💬',
    announcement: '📢',
    event: '🎉',
    discussion: '💭'
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3.5 active:scale-[0.99] transition-transform">
      <div className="flex items-start gap-3">
        <div className="text-lg flex-shrink-0">{typeEmoji[post.type] || '📝'}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-[13px]">{post.title || 'Post'}</p>
          <p className="text-[12px] text-slate-500 line-clamp-1 mt-0.5">{post.body}</p>
          <p className="text-[11px] text-slate-400 mt-1.5">{post.author_name}</p>
        </div>
      </div>
    </div>
  );
}
import { format, isToday, parseISO } from 'date-fns';


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
  const [showQuickPostPrompt, setShowQuickPostPrompt] = useState(false);
  const [showQuickPostModal, setShowQuickPostModal] = useState(false);
  const [scrollStartTime, setScrollStartTime] = useState(null);
  const [showFABTypeSelector, setShowFABTypeSelector] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [hideCommunityBanner, setHideCommunityBanner] = useState(
    () => localStorage.getItem('joinCommunitiesBannerDismissed') === '1'
  );
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
    queryFn: () => base44.entities.UnifiedPost.list('-created_date', 30),
    staleTime: 1800000,
    gcTime: 2400000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0,
    enabled: !!currentUser
  });

  const { data: userCommunities = [] } = useQuery({
    queryKey: ['user-communities', currentUser?.id],
    queryFn: async () => {
      const memberships = await base44.entities.UserCommunity.filter({ user_id: currentUser.id });
      return memberships.map(m => m.community_id);
    },
    enabled: !!currentUser && currentUser.id !== 'guest',
    staleTime: 3600000,
    gcTime: 3600000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const { data: communityPosts = [] } = useQuery({
    queryKey: ['community-posts', userCommunities],
    queryFn: async () => {
      if (userCommunities.length === 0) return [];
      const allPosts = await base44.entities.CommunityPost.list('-created_date', 30);
      return allPosts.filter(p => userCommunities.includes(p.community_id));
    },
    enabled: !!currentUser && userCommunities.length > 0 && userCommunities !== undefined,
    staleTime: 7200000,
    gcTime: 7200000,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const { data: todayEvents = [] } = useQuery({
    queryKey: ['today-events'],
    queryFn: async () => {
      const events = await base44.entities.UnifiedPost.filter({ type: 'event' }, '-created_date', 10);
      const today = format(new Date(), 'yyyy-MM-dd');
      return events.filter(e => e.event_date === today);
    },
    staleTime: 1800000,
    gcTime: 2400000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0,
    enabled: !!currentUser
  });

  const { data: communityHelpRequests = [] } = useQuery({
    queryKey: ['community-help-requests', userCommunities],
    queryFn: async () => {
      if (userCommunities.length === 0) return [];
      const allRequests = await base44.entities.MitzvahRequest.filter({ status: 'open' }, '-created_date', 20);
      return allRequests.filter(r => r.community_id && userCommunities.includes(r.community_id));
    },
    enabled: !!currentUser && userCommunities.length > 0,
    staleTime: 900000,
    gcTime: 1200000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false
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
      // Notify post owner (not self)
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

  // Convert community help requests to post-like format for display
  const communityHelpAsUnifiedPosts = communityHelpRequests.map(req => ({
    id: req.id,
    type: 'help',
    title: req.title,
    body: req.description,
    user_id: req.created_by_user_id,
    user_name: req.created_by_name || 'Community Request',
    created_date: req.created_date,
    community_name: req.community_name,
    category: req.category,
    likes_count: req.offers_count || 0
  }));

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', scrollBehavior: 'smooth' }}>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white" style={{ borderBottom: '1px solid var(--border)', boxShadow: '0 1px 8px rgba(15,23,42,0.04)' }}>
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="font-bold text-[16px] tracking-[-0.01em]" style={{ color: 'var(--text-main)' }}>
            Welcome to {currentUser?.cityPreset || currentUser?.cityCustom || 'Five Towns'}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              title="Search"
            >
              <Search className="w-5 h-5 text-[#64748B]" />
            </button>
            <button
              onClick={() => navigate(createPageUrl('MyEvents'))}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              title="Events"
            >
              <Calendar className="w-5 h-5 text-[#64748B]" />
            </button>
            <NotificationBell userId={currentUser?.id} />
          </div>
        </div>
        <div className="max-w-2xl mx-auto">
          <FeedCategoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />
        </div>
      </div>

      {/* Optional: Find Your Community Banner */}
      {!hideCommunityBanner && userCommunities.length === 0 && activeCategory === 'all' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Find your community</p>
              <p className="text-[12px] text-slate-600">Join groups to see posts, events & announcements</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => navigate(createPageUrl('Communities'))}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors"
              >
                Browse
              </button>
              <button
                onClick={() => setHideCommunityBanner(true) || localStorage.setItem('joinCommunitiesBannerDismissed', '1')}
                className="px-3 py-1.5 text-slate-600 text-[12px] font-medium hover:text-slate-900"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="main-feed">
        {/* Welcome Section - Show when no communities joined */}
        {activeCategory === 'all' && userCommunities.length === 0 && (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-4 text-center">
              <div className="text-4xl mb-3">👋</div>
              <h2 className="text-[18px] font-bold text-slate-900 mb-2">Welcome</h2>
              <p className="text-[14px] text-slate-500 mb-4">Find your community</p>
              <button
                onClick={() => navigate(createPageUrl('Communities'))}
                className="px-6 py-2.5 rounded-full text-white text-[14px] font-semibold"
                style={{ background: '#2563EB' }}
              >
                Join communities to see their posts
              </button>
            </div>

            {/* Trending Communities (optional) - placeholder */}
            <div className="mb-4 text-center">
              <h3 className="text-[15px] font-bold text-slate-900 mb-3">Trending communities (optional)</h3>
              <p className="text-[13px] text-slate-400">Explore communities that match your interests</p>
            </div>
          </>
        )}







        {/* Community Posts Section - organized by type */}
        {activeCategory === 'all' && userCommunities.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[15px] font-bold text-slate-900 mb-3">Posts from your communities</h3>
            {communityPosts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
                <p className="text-[13px] text-slate-400">No posts yet from your communities</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Posts */}
                {communityPosts.filter(p => p.type === 'general' || !p.type).length > 0 && (
                  <div>
                    <h4 className="text-[13px] font-semibold text-slate-700 mb-2">Posts</h4>
                    <div className="space-y-2.5">
                      {communityPosts.filter(p => p.type === 'general' || !p.type).map(post => (
                        <CommunityPostItemPreview key={post.id} post={post} currentUser={currentUser} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Events */}
                {communityPosts.filter(p => p.type === 'event').length > 0 && (
                  <div>
                    <h4 className="text-[13px] font-semibold text-slate-700 mb-2">Events</h4>
                    <div className="space-y-2.5">
                      {communityPosts.filter(p => p.type === 'event').map(post => (
                        <CommunityPostItemPreview key={post.id} post={post} currentUser={currentUser} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Announcements */}
                {communityPosts.filter(p => p.type === 'announcement').length > 0 && (
                  <div>
                    <h4 className="text-[13px] font-semibold text-slate-700 mb-2">Announcements</h4>
                    <div className="space-y-2.5">
                      {communityPosts.filter(p => p.type === 'announcement').map(post => (
                        <CommunityPostItemPreview key={post.id} post={post} currentUser={currentUser} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Discussions */}
                {communityPosts.filter(p => p.type === 'discussion').length > 0 && (
                  <div>
                    <h4 className="text-[13px] font-semibold text-slate-700 mb-2">Discussions</h4>
                    <div className="space-y-2.5">
                      {communityPosts.filter(p => p.type === 'discussion').map(post => (
                        <CommunityPostItemPreview key={post.id} post={post} currentUser={currentUser} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}



        {/* Community Help Requests Section */}
        {activeCategory === 'help' && communityHelpRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-slate-900 mb-3">Help Requests from Your Communities</h3>
            <div className="space-y-2.5 pb-4">
              {communityHelpAsUnifiedPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-[16px] p-4 border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[14px] font-semibold text-slate-900">{post.title}</p>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">{post.category}</span>
                      </div>
                      {post.community_name && (
                        <p className="text-[12px] text-slate-500 mb-1">in {post.community_name}</p>
                      )}
                      <p className="text-[13px] text-slate-700 line-clamp-2">{post.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
             <p className="text-[13px] text-[#98A2B3] mt-1">Join a community or create the first post</p>
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

      <SearchModal
        open={showSearch}
        onOpenChange={setShowSearch}
        posts={visiblePosts}
        helpRequests={communityHelpRequests}
        communities={userCommunities.length > 0 ? communityPosts.map(p => ({ id: p.community_id, name: p.community_name })).filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i) : []}
      />

      {/* FAB */}
      <div className="fixed bottom-[80px] left-4 z-30">
        <button
          onClick={() => setShowFABTypeSelector(true)}
          className="flex items-center gap-2 text-white text-[14px] font-semibold px-5 py-2.5 rounded-full active:scale-95 transition-all bg-green-600 hover:bg-green-700"
          style={{ boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}
        >
          <span className="text-[18px] leading-none font-light">+</span>
          Post
        </button>
      </div>
      </div>
      );
}