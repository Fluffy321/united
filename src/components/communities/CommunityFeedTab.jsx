import React, { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Heart, MessageSquare, Image, Zap, Send, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const AVATAR_COLORS = ['#2563EB','#7C3AED','#16A34A','#F59E0B','#EC4899','#0891B2'];

function Avatar({ name = '?' }) {
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0" style={{ background: color }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function PostCard({ post, onLike }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const name = post.author_name || post.user_name || 'Community';

  const toggleLike = () => {
    setLiked(l => !l);
    setLikes(n => liked ? n - 1 : n + 1);
  };

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    setLoadingComments(true);
    const result = await base44.entities.Comment.filter({ post_id: post.id }, 'created_date', 20);
    setComments(result);
    setLoadingComments(false);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    const c = await base44.entities.Comment.create({
      post_id: post.id,
      author_id: 'guest',
      author_name: 'You',
      body: commentText.trim(),
    });
    setComments(prev => [...prev, c]);
    setCommentText('');
    toast.success('Comment posted!');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full h-48 object-cover" loading="lazy" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar name={name} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-900">{name}</p>
            <p className="text-[11px] text-slate-400">
              {post.created_date ? formatDistanceToNow(parseISO(post.created_date), { addSuffix: true }) : ''}
            </p>
          </div>
          {post.category && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{post.category}</span>
          )}
        </div>
        {post.title && <p className="text-[15px] font-bold text-slate-900 mb-1 leading-snug">{post.title}</p>}
        {post.body && <p className="text-[14px] text-slate-600 leading-relaxed">{post.body}</p>}

        {/* Action row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
            {likes > 0 && likes}
          </button>
          <button
            onClick={loadComments}
            className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-blue-500 transition-colors font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            {post.comments_count > 0 ? post.comments_count : 'Reply'}
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-3 space-y-2 border-t border-slate-50 pt-3">
            {loadingComments ? (
              <p className="text-[11px] text-slate-400 text-center py-2">Loading…</p>
            ) : comments.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-1">No replies yet — be first!</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <Avatar name={c.author_name || '?'} />
                  <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
                    <p className="text-[11px] font-semibold text-slate-700">{c.author_name || 'Member'}</p>
                    <p className="text-[12px] text-slate-600">{c.body}</p>
                  </div>
                </div>
              ))
            )}
            <div className="flex gap-2 mt-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()}
                placeholder="Write a reply…"
                className="flex-1 text-[13px] bg-slate-50 rounded-full px-4 py-2 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button onClick={submitComment} className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white active:scale-90 transition-transform">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PromptCard({ prompt }) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    toast.success('Answer shared with the community!');
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-yellow-300" />
        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Community Question</span>
      </div>
      <p className="text-[15px] font-bold leading-snug mb-3">{prompt.prompt_text || prompt.body}</p>
      {submitted ? (
        <p className="text-[12px] text-white/80 font-medium">✓ Thanks for sharing your answer!</p>
      ) : (
        <div className="flex gap-2">
          <input
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Share your answer…"
            className="flex-1 text-[12px] bg-white/20 backdrop-blur-sm text-white placeholder-white/60 rounded-full px-4 py-2 outline-none border border-white/30 focus:border-white/60"
          />
          <button onClick={submit} className="bg-white text-blue-700 font-bold text-[12px] rounded-full px-4 py-2 active:scale-95 transition-transform">
            Post
          </button>
        </div>
      )}
    </div>
  );
}

function NewPostComposer({ community, currentUser, onNewPost }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    const post = await base44.entities.CommunityPost.create({
      community_id: community.id,
      author_name: currentUser?.display_name || currentUser?.full_name || 'Anonymous',
      author_user_id: currentUser?.id || 'guest',
      body: body.trim(),
      likes_count: 0,
      comments_count: 0,
    });
    onNewPost(post);
    setBody('');
    setOpen(false);
    setSubmitting(false);
    toast.success('Posted!');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-1">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left text-[13px] text-slate-400 bg-slate-50 rounded-full px-4 py-3 border border-slate-200 hover:border-blue-300 transition-colors"
        >
          Share something with {community.name}…
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-slate-800">New Post</p>
            <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none outline-none focus:ring-2 focus:ring-blue-300"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-[12px] font-semibold text-slate-500 rounded-full border border-slate-200">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || !body.trim()}
              className="px-5 py-2 text-[12px] font-bold text-white bg-blue-600 rounded-full disabled:opacity-50 active:scale-95 transition-all"
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunityFeedTab({ posts, prompts, community, currentUser, onNewPost }) {
  // Interleave prompts into feed
  const feed = [];
  const sortedPosts = [...posts].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  
  sortedPosts.forEach((p, i) => {
    feed.push({ ...p, _type: 'post' });
    // Insert a prompt every 3 posts
    if ((i + 1) % 3 === 0 && prompts[Math.floor(i / 3)]) {
      feed.push({ ...prompts[Math.floor(i / 3)], _type: 'prompt' });
    }
  });
  // Add remaining prompts
  if (prompts.length > 0 && sortedPosts.length < 3) {
    prompts.forEach(p => feed.push({ ...p, _type: 'prompt' }));
  }

  return (
    <div className="space-y-3 pb-4">
      <NewPostComposer community={community} currentUser={currentUser} onNewPost={onNewPost} />
      {feed.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-100 p-10 text-center">
          <div className="text-4xl mb-3">✍️</div>
          <p className="text-[15px] font-bold text-slate-900">No posts yet</p>
          <p className="text-[13px] text-slate-500 mt-1">Be the first to share something!</p>
        </div>
      ) : (
        feed.map(item =>
          item._type === 'prompt'
            ? <PromptCard key={item.id} prompt={item} />
            : <PostCard key={item.id} post={item} />
        )
      )}
    </div>
  );
}