import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Sparkles, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PostCard from '@/components/feed/PostCard';
import CreatePostModal from '@/components/feed/CreatePostModal';
import CommentsSheet from '@/components/feed/CommentsSheet';
import ReportModal from '@/components/common/ReportModal';
import ProfileSetup from '@/components/profile/ProfileSetup';
import { toast } from 'sonner';

const INTERESTS = ["All", "Torah & Learning", "Sports", "Music", "Art", "Tech", "Food", "Travel"];

export default function Feed() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
  const [selectedInterest, setSelectedInterest] = useState('All');
  const [activePrompt, setActivePrompt] = useState(null);
  const [userLikes, setUserLikes] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
    loadPrompt();
    loadUserLikes();
  }, []);

  const loadUser = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
  };

  const loadPrompt = async () => {
    const prompts = await base44.entities.CommunityPrompt.filter({ is_active: true }, '-created_date', 1);
    if (prompts.length > 0) setActivePrompt(prompts[0]);
  };

  const loadUserLikes = async () => {
    const user = await base44.auth.me();
    const likes = await base44.entities.Like.filter({ user_id: user.id });
    setUserLikes(likes.map(l => l.post_id));
  };

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', selectedInterest],
    queryFn: async () => {
      if (selectedInterest === 'All') {
        return base44.entities.Post.list('-created_date', 50);
      }
      const allPosts = await base44.entities.Post.list('-created_date', 100);
      return allPosts.filter(p => p.interests?.includes(selectedInterest));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Post.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted');
    }
  });

  const handleLike = async (postId) => {
    const isLiked = userLikes.includes(postId);
    const post = posts.find(p => p.id === postId);
    
    if (isLiked) {
      const like = await base44.entities.Like.filter({ post_id: postId, user_id: currentUser.id });
      if (like[0]) await base44.entities.Like.delete(like[0].id);
      await base44.entities.Post.update(postId, { likes_count: Math.max(0, (post.likes_count || 0) - 1) });
      setUserLikes(prev => prev.filter(id => id !== postId));
    } else {
      await base44.entities.Like.create({ post_id: postId, user_id: currentUser.id });
      await base44.entities.Post.update(postId, { likes_count: (post.likes_count || 0) + 1 });
      setUserLikes(prev => [...prev, postId]);
    }
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const handleRepost = async (post) => {
    await base44.entities.Post.create({
      content: post.content,
      image_url: post.image_url,
      author_name: currentUser.display_name || currentUser.full_name?.split(' ')[0],
      author_id: currentUser.id,
      author_age_range: currentUser.age_range || '18+',
      city: currentUser.city || 'Five Towns',
      interests: post.interests,
      is_repost: true,
      original_post_id: post.id
    });
    await base44.entities.Post.update(post.id, { reposts_count: (post.reposts_count || 0) + 1 });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    toast.success('Reposted!');
  };

  const handleReport = (id, type) => {
    setReportTarget({ id, type });
    setShowReport(true);
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
        {/* Daily Prompt */}
        {activePrompt && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 mb-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Today's Prompt</span>
            </div>
            <p className="text-lg font-semibold mb-4">{activePrompt.prompt_text}</p>
            <Button 
              variant="secondary" 
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => setShowCreatePost(true)}
            >
              Share your thoughts
            </Button>
          </div>
        )}

        {/* Interest Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {INTERESTS.map(interest => (
            <Badge 
              key={interest}
              variant={selectedInterest === interest ? "default" : "outline"}
              className={`cursor-pointer whitespace-nowrap transition-all py-1.5 px-4 ${
                selectedInterest === interest 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-white hover:bg-slate-100'
              }`}
              onClick={() => setSelectedInterest(interest)}
            >
              {interest}
            </Badge>
          ))}
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-slate-600 font-medium">No posts yet</p>
            <p className="text-sm text-slate-400 mt-1">Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard 
                key={post.id}
                post={post}
                currentUser={currentUser}
                liked={userLikes.includes(post.id)}
                onLike={handleLike}
                onComment={(p) => { setSelectedPost(p); setShowComments(true); }}
                onRepost={handleRepost}
                onDelete={(id) => deleteMutation.mutate(id)}
                onReport={handleReport}
              />
            ))}
          </div>
        )}

        {/* Create Post FAB */}
        <Button 
          size="lg"
          className="fixed bottom-24 right-6 rounded-full w-14 h-14 shadow-xl bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setShowCreatePost(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <CreatePostModal 
        open={showCreatePost} 
        onOpenChange={setShowCreatePost}
        currentUser={currentUser}
        prompt={activePrompt}
        onPostCreated={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
      />

      <CommentsSheet 
        open={showComments}
        onOpenChange={setShowComments}
        post={selectedPost}
        currentUser={currentUser}
        onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
      />

      <ReportModal 
        open={showReport}
        onOpenChange={setShowReport}
        contentId={reportTarget.id}
        contentType={reportTarget.type}
        currentUser={currentUser}
      />
    </div>
  );
}