import React, { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Heart, MessageSquare, Send, X, Image, Link, Zap, ArrowUpDown } from 'lucide-react';
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

function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

function PostCard({ post }) {
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

  const linkUrl = post.link_url;
  const linkLabel = post.link_label || (linkUrl ? new URL(linkUrl).hostname : '');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full max-h-72 object-cover" loading="lazy" />
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

        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-[12px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Link className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{linkLabel}</span>
          </a>
        )}

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
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    setUploading(false);
  };

  const reset = () => {
    setOpen(false);
    setBody('');
    setImageUrl('');
    setLinkUrl('');
    setShowImageInput(false);
    setShowLinkInput(false);
  };

  const submit = async () => {
    if (!body.trim() && !imageUrl) return;
    if (linkUrl && !isValidUrl(linkUrl)) { toast.error('Please enter a valid URL (include https://)'); return; }
    setSubmitting(true);
    const post = await base44.entities.CommunityPost.create({
      community_id: community.id,
      author_name: currentUser?.display_name || currentUser?.full_name || 'Anonymous',
      author_user_id: currentUser?.id || 'guest',
      body: body.trim(),
      image_url: imageUrl || undefined,
      link_url: linkUrl || undefined,
      likes_count: 0,
      comments_count: 0,
    });
    onNewPost(post);
    reset();
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
          Share something with {community?.name}…
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-slate-800">New Post</p>
            <button onClick={reset}><X className="w-4 h-4 text-slate-400" /></button>
          </div>

          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none outline-none focus:ring-2 focus:ring-blue-300"
          />

          {/* Image preview */}
          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="preview" className="w-full rounded-xl max-h-48 object-cover" />
              <button onClick={() => setImageUrl('')} className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}

          {/* Image URL/upload input */}
          {showImageInput && !imageUrl && (
            <div className="space-y-1.5">
              <input
                placeholder="Paste image URL…"
                className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                onBlur={e => { if (isValidUrl(e.target.value)) setImageUrl(e.target.value); }}
              />
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>or</span>
                <label className="cursor-pointer text-blue-600 font-semibold hover:underline">
                  {uploading ? 'Uploading…' : 'Upload from device'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} disabled={uploading} />
                </label>
              </div>
            </div>
          )}

          {/* Link input */}
          {showLinkInput && (
            <input
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="Paste a link (https://…)"
              className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
            />
          )}

          {/* Toolbar + actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setShowImageInput(v => !v); setShowLinkInput(false); }}
                className={`p-2 rounded-full transition-colors ${showImageInput ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
                title="Add image"
              >
                <Image className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setShowLinkInput(v => !v); setShowImageInput(false); }}
                className={`p-2 rounded-full transition-colors ${showLinkInput ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
                title="Add link"
              >
                <Link className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={reset} className="px-4 py-2 text-[12px] font-semibold text-slate-500 rounded-full border border-slate-200">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting || (!body.trim() && !imageUrl)}
                className="px-5 py-2 text-[12px] font-bold text-white bg-blue-600 rounded-full disabled:opacity-50 active:scale-95 transition-all"
              >
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'popular', label: 'Most Popular' },
  { key: 'discussed', label: 'Most Discussed' },
];

export default function CommunityFeedTab({ posts, prompts = [], community, currentUser, onNewPost }) {
  const [sort, setSort] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortedPosts = [...posts].sort((a, b) => {
    if (sort === 'newest') return new Date(b.created_date) - new Date(a.created_date);
    if (sort === 'popular') return (b.likes_count || 0) - (a.likes_count || 0);
    if (sort === 'discussed') return (b.comments_count || 0) - (a.comments_count || 0);
    return 0;
  });

  // Interleave prompts every 3 posts (only when sorting by newest)
  const feed = [];
  sortedPosts.forEach((p, i) => {
    feed.push({ ...p, _type: 'post' });
    if (sort === 'newest' && (i + 1) % 3 === 0 && prompts[Math.floor(i / 3)]) {
      feed.push({ ...prompts[Math.floor(i / 3)], _type: 'prompt' });
    }
  });
  if (sort === 'newest' && prompts.length > 0 && sortedPosts.length < 3) {
    prompts.forEach(p => feed.push({ ...p, _type: 'prompt' }));
  }

  const activeSortLabel = SORT_OPTIONS.find(o => o.key === sort)?.label;

  return (
    <div className="space-y-3 pb-4 pt-4">
      <NewPostComposer community={community} currentUser={currentUser} onNewPost={onNewPost} />

      {/* Sort bar */}
      <div className="flex items-center justify-end relative">
        <button
          onClick={() => setShowSortMenu(v => !v)}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-full px-3 py-1.5 transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {activeSortLabel}
        </button>
        {showSortMenu && (
          <div className="absolute top-8 right-0 z-20 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden min-w-[160px]">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => { setSort(opt.key); setShowSortMenu(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors ${sort === opt.key ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

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