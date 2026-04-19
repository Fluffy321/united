import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { MessageSquare, Send, X, Image, Link, ArrowUp, MoreHorizontal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const AVATAR_COLORS = ['#2563EB','#7C3AED','#16A34A','#F59E0B','#EC4899','#0891B2'];

function Avatar({ name = '?', size = 'md' }) {
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-[13px]';
  return (
    <div className={`${sz} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`} style={{ background: color }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ── Reaction bar ──────────────────────────────────────────────────────────────
const REACTIONS = ['❤️','👏','🙏','🎉','🔥'];

function ReactionBar({ postId, currentUser, initialCounts = {} }) {
  const [counts, setCounts] = useState(initialCounts);
  const [myReaction, setMyReaction] = useState(null);
  const [pickerOpen, setPicker] = useState(false);
  const timerRef = useRef(null);

  const react = async (emoji) => {
    if (!currentUser) { base44.auth.redirectToLogin(); return; }
    setPicker(false);
    if (myReaction === emoji) {
      // un-react
      setMyReaction(null);
      setCounts(prev => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] || 1) - 1) }));
    } else {
      if (myReaction) setCounts(prev => ({ ...prev, [myReaction]: Math.max(0, (prev[myReaction] || 1) - 1) }));
      setMyReaction(emoji);
      setCounts(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      if (navigator.vibrate) navigator.vibrate(20);
    }
    // Persist via Reaction entity
    try {
      const existing = await base44.entities.Reaction.filter({ post_id: postId, user_id: currentUser.id });
      for (const r of existing) await base44.entities.Reaction.delete(r.id);
      if (myReaction !== emoji) {
        await base44.entities.Reaction.create({ post_id: postId, user_id: currentUser.id, emoji });
      }
    } catch {}
  };

  const handlePress = () => {
    timerRef.current = setTimeout(() => setPicker(true), 400);
  };
  const handleRelease = () => {
    clearTimeout(timerRef.current);
    if (!pickerOpen) react(REACTIONS[0]);
  };

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);
  const topEmoji = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="relative flex items-center gap-2">
      <button
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        onPointerLeave={() => clearTimeout(timerRef.current)}
        className={`flex items-center gap-1 text-[12px] font-medium transition-colors select-none ${myReaction ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}
      >
        <span>{myReaction || topEmoji || '❤️'}</span>
        {totalReactions > 0 && <span>{totalReactions}</span>}
      </button>
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-8 left-0 z-30 bg-white rounded-2xl shadow-xl border border-slate-100 flex gap-1 px-2 py-1.5"
          >
            {REACTIONS.map(em => (
              <button key={em} onClick={() => react(em)} className="text-xl hover:scale-125 transition-transform p-0.5 active:scale-110">
                {em}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Comment thread ────────────────────────────────────────────────────────────
function CommentThread({ postId, currentUser, members = [] }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mention, setMention] = useState(null); // {word, start}
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    base44.entities.Comment.filter({ post_id: postId }, 'created_date', 30)
      .then(setComments).catch(() => {}).finally(() => setLoading(false));
  }, [postId]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    // @mention detection
    const match = val.slice(0, e.target.selectionStart).match(/@(\w*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      setSuggestions(members.filter(m => (m.user_name || '').toLowerCase().includes(query)).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const insertMention = (name) => {
    const pos = text.lastIndexOf('@');
    setText(text.slice(0, pos) + `@${name} `);
    setSuggestions([]);
  };

  const submit = async () => {
    if (!text.trim() || !currentUser) return;
    setSubmitting(true);
    const c = await base44.entities.Comment.create({
      post_id: postId,
      author_id: currentUser.id,
      author_name: currentUser.display_name || currentUser.full_name || 'Member',
      body: text.trim(),
    });
    setComments(prev => [...prev, c]);
    setText('');
    setSubmitting(false);
  };

  return (
    <div className="mt-3 border-t border-slate-50 pt-3 space-y-2">
      {loading ? (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="h-8 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-slate-400 text-center py-1">No replies yet — be first!</p>
      ) : (
        comments.map(c => (
          <div key={c.id} className="flex gap-2 items-start">
            <Avatar name={c.author_name || '?'} size="sm" />
            <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
              <span className="text-[11px] font-semibold text-slate-700">{c.author_name || 'Member'} </span>
              <span className="text-[12px] text-slate-600">{c.body}</span>
            </div>
          </div>
        ))
      )}

      {/* @mention suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {suggestions.map(m => (
            <button key={m.id} onClick={() => insertMention(m.user_name)} className="w-full text-left px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <Avatar name={m.user_name || '?'} size="sm" />
              {m.user_name}
            </button>
          ))}
        </div>
      )}

      {currentUser && (
        <div className="flex gap-2 mt-1">
          <input
            value={text}
            onChange={handleTextChange}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submit()}
            placeholder="Reply… (@mention)"
            className="flex-1 text-[13px] bg-slate-50 rounded-full px-4 py-2 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button onClick={submit} disabled={submitting || !text.trim()} className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white active:scale-90 transition-transform disabled:opacity-50">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, members = [], isAdmin }) {
  const [showComments, setShowComments] = useState(false);
  const name = post.author_name || post.user_name || 'Community';
  const isAnnouncement = post.type === 'announcement' || post.post_type === 'announcement';

  const timeAgo = post.created_date
    ? formatDistanceToNow(parseISO(post.created_date), { addSuffix: true })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isAnnouncement ? 'border-amber-200' : 'border-slate-100'}`}
    >
      {isAnnouncement && <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />}
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full max-h-64 object-cover" loading="lazy" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-2">
          <Avatar name={name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-slate-900">{name}</p>
              {isAnnouncement && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">📢 Admin</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">{timeAgo}</p>
          </div>
          {post.category && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 flex-shrink-0">{post.category}</span>
          )}
        </div>

        {post.title && <p className="text-[15px] font-bold text-slate-900 mb-1 leading-snug">{post.title}</p>}
        {post.body && <p className="text-[13px] text-slate-600 leading-relaxed">{post.body}</p>}

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
          <ReactionBar postId={post.id} currentUser={currentUser} initialCounts={{ '❤️': post.likes_count || 0 }} />
          <button
            onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-blue-500 transition-colors font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            {post.comments_count > 0 ? post.comments_count : 'Reply'}
          </button>
          {isAdmin && isAnnouncement && post.seen_count !== undefined && (
            <span className="ml-auto text-[11px] text-slate-400">
              👁 Seen by {post.seen_count || 0}
            </span>
          )}
        </div>

        {showComments && (
          <CommentThread postId={post.id} currentUser={currentUser} members={members} />
        )}
      </div>
    </motion.div>
  );
}

// ── Post type pills ───────────────────────────────────────────────────────────
const POST_TYPES = [
  { key: 'text', label: '📝 Text' },
  { key: 'photo', label: '📸 Photo' },
  { key: 'ask', label: '❓ Ask' },
  { key: 'event', label: '📅 Event' },
  { key: 'poll', label: '📊 Poll' },
  { key: 'chesed', label: '🤝 Chesed' },
  { key: 'mazel_tov', label: '🎊 Mazel Tov' },
  { key: 'refuah', label: '🙏 Refuah' },
];

const ADMIN_TYPES = [{ key: 'announcement', label: '📢 Announce' }];

// ── Composer ──────────────────────────────────────────────────────────────────
function NewPostComposer({ community, currentUser, onNewPost, members, isAdmin }) {
  const [open, setOpen] = useState(false);
  const [postType, setPostType] = useState('text');
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const types = isAdmin ? [...POST_TYPES, ...ADMIN_TYPES] : POST_TYPES;

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const reset = () => {
    setOpen(false); setBody(''); setTitle(''); setImageUrl(''); setPostType('text');
  };

  const submit = async () => {
    if (!body.trim() && !imageUrl) return;
    if (!currentUser) { base44.auth.redirectToLogin(); return; }
    setSubmitting(true);
    const post = await base44.entities.CommunityPost.create({
      community_id: community.id,
      author_name: currentUser.display_name || currentUser.full_name || 'Member',
      author_user_id: currentUser.id,
      title: title.trim() || undefined,
      body: body.trim(),
      image_url: imageUrl || undefined,
      type: postType,
      post_type: postType,
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
        <button onClick={() => { if (!currentUser) { base44.auth.redirectToLogin(); return; } setOpen(true); }}
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

          {/* Post type pills */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {types.map(t => (
              <button
                key={t.key}
                onClick={() => setPostType(t.key)}
                className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${
                  postType === t.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {(postType === 'event' || postType === 'ask' || postType === 'announcement') && (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title…"
              className="w-full text-[14px] font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
            />
          )}

          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={
              postType === 'ask' ? 'What would you like to ask?' :
              postType === 'chesed' ? 'Describe how the community can help…' :
              postType === 'mazel_tov' ? 'Share the good news! 🎊' :
              postType === 'refuah' ? 'Asking for a refuah shleima for… 🙏' :
              postType === 'announcement' ? 'Important update for the community…' :
              'What\'s on your mind?'
            }
            rows={3}
            className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none outline-none focus:ring-2 focus:ring-blue-200"
          />

          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="" className="w-full rounded-xl max-h-40 object-cover" />
              <button onClick={() => setImageUrl('')} className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className={`cursor-pointer p-2 rounded-full transition-colors ${imageUrl ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}>
              {uploading ? <span className="text-[11px]">Uploading…</span> : <Image className="w-4 h-4" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} disabled={uploading} />
            </label>
            <div className="flex items-center gap-2">
              <button onClick={reset} className="px-4 py-1.5 text-[12px] font-semibold text-slate-500 rounded-full border border-slate-200">Cancel</button>
              <button
                onClick={submit}
                disabled={submitting || (!body.trim() && !imageUrl)}
                className="px-5 py-1.5 text-[12px] font-bold text-white bg-blue-600 rounded-full disabled:opacity-50 active:scale-95 transition-all"
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

// ── Filter chips ──────────────────────────────────────────────────────────────
const FILTER_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'announcement', label: '📢 Announcements' },
  { key: 'ask', label: '❓ Questions' },
  { key: 'event', label: '📅 Events' },
  { key: 'photo', label: '📸 Photos' },
  { key: 'chesed', label: '🤝 Chesed' },
  { key: 'mazel_tov', label: '🎊 Mazel Tov' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'trending', label: 'Trending' },
  { key: 'top', label: 'Top' },
];

// ── Main export ───────────────────────────────────────────────────────────────
export default function CommunityFeedTab({ posts: initialPosts, community, currentUser, onNewPost, members = [], isAdmin }) {
  const [posts, setPosts] = useState(initialPosts || []);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [newPostsBanner, setNewPostsBanner] = useState(0);
  const [displayedIds, setDisplayedIds] = useState(new Set((initialPosts || []).map(p => p.id)));
  const topRef = useRef(null);

  // Sync when initialPosts changes from parent
  useEffect(() => {
    const newOnes = (initialPosts || []).filter(p => !displayedIds.has(p.id));
    if (newOnes.length > 0 && displayedIds.size > 0) {
      setNewPostsBanner(prev => prev + newOnes.length);
    } else {
      setPosts(initialPosts || []);
      setDisplayedIds(new Set((initialPosts || []).map(p => p.id)));
    }
  }, [initialPosts]);

  const handleNewPost = (post) => {
    setPosts(prev => [post, ...prev]);
    setDisplayedIds(prev => new Set([...prev, post.id]));
    onNewPost?.(post);
  };

  const showNewPosts = () => {
    setPosts(initialPosts || []);
    setDisplayedIds(new Set((initialPosts || []).map(p => p.id)));
    setNewPostsBanner(0);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filtered = posts.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'photo') return !!p.image_url;
    const type = p.type || p.post_type || '';
    return type === filter || p.category === filter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'newest') return new Date(b.created_date) - new Date(a.created_date);
    if (sort === 'trending') {
      const ageA = (Date.now() - new Date(a.created_date).getTime()) / 3600000;
      const ageB = (Date.now() - new Date(b.created_date).getTime()) / 3600000;
      const scoreA = ((a.likes_count || 0) + (a.comments_count || 0) * 2) / Math.max(1, ageA);
      const scoreB = ((b.likes_count || 0) + (b.comments_count || 0) * 2) / Math.max(1, ageB);
      return scoreB - scoreA;
    }
    if (sort === 'top') return ((b.likes_count || 0) + (b.comments_count || 0)) - ((a.likes_count || 0) + (a.comments_count || 0));
    return 0;
  });

  return (
    <div className="space-y-3 pb-4 pt-4" ref={topRef}>
      {/* New posts banner */}
      <AnimatePresence>
        {newPostsBanner > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={showNewPosts}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-blue-600 text-white rounded-full px-4 py-2 text-[13px] font-bold shadow-lg active:scale-95 transition-all"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            {newPostsBanner} new post{newPostsBanner !== 1 ? 's' : ''}
          </motion.button>
        )}
      </AnimatePresence>

      <NewPostComposer
        community={community}
        currentUser={currentUser}
        onNewPost={handleNewPost}
        members={members}
        isAdmin={isAdmin}
      />

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            className={`flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filter === chip.key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Sort bar */}
      <div className="flex items-center justify-end relative">
        <button
          onClick={() => setShowSortMenu(v => !v)}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1.5"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          {SORT_OPTIONS.find(o => o.key === sort)?.label}
        </button>
        {showSortMenu && (
          <div className="absolute top-8 right-0 z-20 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden min-w-[140px]">
            {SORT_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => { setSort(opt.key); setShowSortMenu(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors ${sort === opt.key ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-100 p-10 text-center">
          <div className="text-4xl mb-3">✍️</div>
          <p className="text-[15px] font-bold text-slate-900">No posts yet</p>
          <p className="text-[13px] text-slate-500 mt-1">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(post => (
            <PostCard key={post.id} post={post} currentUser={currentUser} members={members} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}