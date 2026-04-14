import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Users, Bell, Settings, Check, Plus, Pin, 
  Heart, MessageCircle, Share2, Send, Image, HelpCircle, 
  Calendar, Megaphone, MoreHorizontal, MapPin, Info,
  BookOpen, Star, Loader2, Camera, X, ChevronRight
} from 'lucide-react';
import { formatDistanceToNow, parseISO, format, isFuture } from 'date-fns';
import { toast } from 'sonner';

// ── Shared helpers ────────────────────────────────────────────
const AVATAR_COLORS = ['#2563EB','#7C3AED','#16A34A','#D97706','#EC4899','#0891B2','#DC2626','#059669'];
function avatarColor(name = '') { return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]; }
function getInitials(name = '') { return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?'; }

function Avatar({ name = '?', url, size = 36 }) {
  if (url) return <img src={url} alt={name} className="rounded-full object-cover flex-shrink-0" style={{width:size,height:size}} />;
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width:size, height:size, background: avatarColor(name), fontSize: size * 0.36 }}>
      {getInitials(name)}
    </div>
  );
}

const GRADIENT_MAP = {
  School:'from-sky-500 to-blue-600', Shul:'from-violet-500 to-purple-600',
  Neighborhood:'from-teal-500 to-emerald-600', 'Young Professionals':'from-indigo-500 to-blue-600',
  Parenting:'from-pink-500 to-rose-500', Jobs:'from-orange-500 to-amber-500',
  Chessed:'from-green-500 to-emerald-600', 'Learning & Torah':'from-amber-500 to-orange-500',
  Food:'from-red-400 to-orange-400', Events:'from-purple-500 to-fuchsia-500',
  'Israel / Travel':'from-blue-400 to-cyan-500', 'Local Interest Groups':'from-slate-500 to-slate-700',
  Other:'from-blue-500 to-indigo-600',
};

function getGradient(community) {
  return GRADIENT_MAP[community.category] || GRADIENT_MAP[community.type] || 'from-blue-600 to-indigo-600';
}

// ── Post Composer ─────────────────────────────────────────────
const POST_TYPES = [
  { key: 'discussion', label: 'Discussion', icon: MessageCircle, color: 'text-blue-600' },
  { key: 'question', label: 'Question', icon: HelpCircle, color: 'text-amber-600' },
  { key: 'photo', label: 'Photo', icon: Image, color: 'text-green-600' },
  { key: 'help', label: 'Help Needed', icon: HelpCircle, color: 'text-orange-600' },
  { key: 'recommendation', label: 'Recommend', icon: Star, color: 'text-purple-600' },
];

function PostComposer({ community, currentUser, onPosted }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [postType, setPostType] = useState('discussion');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();
  const name = currentUser?.display_name || currentUser?.full_name || 'You';

  const handleImage = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    let image_url;
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = file_url;
    }
    await base44.entities.CommunityPost.create({
      community_id: community.id,
      author_name: name,
      author_user_id: currentUser?.id || 'guest',
      author_avatar_url: currentUser?.avatar_url,
      body: body.trim(),
      post_type: postType,
      image_url,
      likes_count: 0,
      comments_count: 0,
    });
    setBody(''); setImageFile(null); setImagePreview(null); setPostType('discussion'); setOpen(false);
    setSubmitting(false);
    toast.success('Posted!');
    onPosted?.();
  };

  if (!open) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-3 mb-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar name={name} url={currentUser?.avatar_url} size={38} />
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-left text-[13px] text-slate-400 bg-slate-50 rounded-full px-4 py-2.5 border border-slate-200 hover:border-blue-300 transition-colors"
          >
            Share something with {community.name}…
          </button>
        </div>
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
          {POST_TYPES.slice(0,4).map(pt => {
            const Icon = pt.icon;
            return (
              <button key={pt.key} onClick={() => { setPostType(pt.key); setOpen(true); }}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-slate-50 text-[11px] font-semibold text-slate-500 transition-colors">
                <Icon className={`w-3.5 h-3.5 ${pt.color}`} />
                {pt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Avatar name={name} url={currentUser?.avatar_url} size={36} />
          <div>
            <p className="text-[13px] font-semibold text-slate-900">{name}</p>
            <p className="text-[11px] text-slate-400">Posting to {community.name}</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Type picker */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
        {POST_TYPES.map(pt => (
          <button key={pt.key} onClick={() => setPostType(pt.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
              postType === pt.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}>
            {pt.label}
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={
          postType === 'question' ? 'Ask the community a question…' :
          postType === 'help' ? 'Describe what you need help with…' :
          postType === 'recommendation' ? 'What are you recommending?' :
          "What's on your mind?"
        }
        rows={3}
        className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-all"
        autoFocus
      />

      {imagePreview && (
        <div className="relative mt-2 rounded-xl overflow-hidden">
          <img src={imagePreview} alt="" className="w-full max-h-40 object-cover" />
          <button onClick={() => { setImageFile(null); setImagePreview(null); }}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50">
          <Camera className="w-4 h-4" /> Photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        <div className="flex gap-2">
          <button onClick={() => setOpen(false)} className="px-4 py-1.5 text-[12px] font-semibold text-slate-500 rounded-full border border-slate-200 hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={submitting || !body.trim()}
            className="px-5 py-1.5 text-[12px] font-bold text-white bg-blue-600 rounded-full disabled:opacity-50 active:scale-95 transition-all flex items-center gap-1.5">
            {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Community Post Card ───────────────────────────────────────
const POST_TYPE_BADGES = {
  discussion: { label: 'Discussion', bg: 'bg-blue-50', text: 'text-blue-600' },
  question:   { label: 'Question',   bg: 'bg-amber-50', text: 'text-amber-600' },
  photo:      { label: 'Photo',      bg: 'bg-green-50', text: 'text-green-600' },
  help:       { label: 'Help',       bg: 'bg-orange-50', text: 'text-orange-600' },
  recommendation: { label: 'Recommend', bg: 'bg-purple-50', text: 'text-purple-600' },
  announcement: { label: '📢 Pinned', bg: 'bg-amber-50', text: 'text-amber-700' },
};

function CommunityPostCard({ post, currentUser, isPinned }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const name = post.author_name || 'Community Member';
  const badge = POST_TYPE_BADGES[post.post_type] || POST_TYPE_BADGES.discussion;

  const toggleLike = () => { setLiked(l => !l); setLikes(n => liked ? n-1 : n+1); };

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    setLoadingComments(true);
    const result = await base44.entities.Comment.filter({ post_id: post.id }, 'created_date', 30);
    setComments(result);
    setLoadingComments(false);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    const authorName = currentUser?.display_name || currentUser?.full_name || 'Member';
    const c = await base44.entities.Comment.create({
      post_id: post.id,
      author_id: currentUser?.id || 'guest',
      author_name: authorName,
      author_avatar_url: currentUser?.avatar_url,
      body: commentText.trim(),
    });
    setComments(prev => [...prev, c]);
    setCommentText('');
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isPinned ? 'border-amber-200' : 'border-slate-100'}`}>
      {isPinned && <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />}
      {post.image_url && <img src={post.image_url} alt="" className="w-full object-cover max-h-64" loading="lazy" />}
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-2">
          <Avatar name={name} url={post.author_avatar_url} size={36} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-slate-900 truncate">{name}</p>
              {isPinned && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                  <Pin className="w-2.5 h-2.5" /> Pinned
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {post.created_date ? formatDistanceToNow(parseISO(post.created_date), { addSuffix: true }) : ''}
            </p>
          </div>
          {badge && !isPinned && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          )}
        </div>
        {post.title && <p className="text-[15px] font-bold text-slate-900 mb-1 leading-snug">{post.title}</p>}
        {post.body && <p className="text-[14px] text-slate-700 leading-relaxed">{post.body}</p>}

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
          <button onClick={toggleLike}
            className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}>
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
            {likes > 0 && <span>{likes}</span>}
          </button>
          <button onClick={loadComments}
            className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-blue-500 transition-colors">
            <MessageCircle className="w-4 h-4" />
            {post.comments_count > 0 ? post.comments_count : 'Comment'}
          </button>
          <button className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-slate-600 transition-colors ml-auto">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>

        {showComments && (
          <div className="mt-3 pt-3 border-t border-slate-50 space-y-2">
            {loadingComments ? (
              <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
            ) : comments.length === 0 ? (
              <p className="text-[12px] text-slate-400 text-center py-1">No comments yet — be first!</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <Avatar name={c.author_name || '?'} url={c.author_avatar_url} size={28} />
                  <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
                    <p className="text-[11px] font-semibold text-slate-700">{c.author_name || 'Member'}</p>
                    <p className="text-[12px] text-slate-600">{c.body}</p>
                  </div>
                </div>
              ))
            )}
            <div className="flex gap-2 mt-2">
              <Avatar name={currentUser?.display_name || currentUser?.full_name || 'You'} url={currentUser?.avatar_url} size={28} />
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()}
                placeholder="Write a comment…"
                className="flex-1 text-[13px] bg-slate-50 rounded-full px-4 py-2 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button onClick={submitComment} className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white active:scale-90 transition-transform">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { key: 'feed',    label: '🏠 Feed' },
  { key: 'events',  label: '📅 Events' },
  { key: 'members', label: '👥 Members' },
  { key: 'about',   label: 'ℹ️ About' },
];

// ── Feed Tab ──────────────────────────────────────────────────
function FeedTab({ community, currentUser, posts, isLoading, onRefresh }) {
  // Pinned + announcements show at top, then regular posts newest-first
  const pinned = posts.filter(p => p.is_pinned || p.post_type === 'announcement')
    .sort((a,b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
  const regular = posts
    .filter(p => !p.is_pinned && p.post_type !== 'announcement')
    .sort((a,b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="space-y-3">
      <PostComposer community={community} currentUser={currentUser} onPosted={onRefresh} />
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
      ) : (
        <>
          {pinned.map(p => <CommunityPostCard key={p.id} post={p} currentUser={currentUser} isPinned={p.is_pinned} />)}
          {regular.length === 0 && pinned.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <div className="text-4xl mb-3">✍️</div>
              <p className="font-bold text-slate-900">No posts yet</p>
              <p className="text-[13px] text-slate-500 mt-1">Be the first to share something with this community!</p>
            </div>
          )}
          {regular.map(p => <CommunityPostCard key={p.id} post={p} currentUser={currentUser} />)}
        </>
      )}
    </div>
  );
}

// ── Announcements Tab ─────────────────────────────────────────
function AnnouncementsTab({ community, currentUser, posts, isLoading, onRefresh }) {
  const [showComposer, setShowComposer] = useState(false);
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [pinIt, setPinIt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  const announcements = posts.filter(p => p.post_type === 'announcement' || p.is_pinned).sort((a,b)=>{
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_date)-new Date(a.created_date);
  });

  const submitAnnouncement = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    await base44.entities.CommunityPost.create({
      community_id: community.id,
      author_name: currentUser?.display_name || currentUser?.full_name || 'Admin',
      author_user_id: currentUser?.id,
      author_avatar_url: currentUser?.avatar_url,
      title: title.trim() || undefined,
      body: body.trim(),
      post_type: 'announcement',
      is_pinned: pinIt,
      likes_count: 0,
      comments_count: 0,
    });
    setBody(''); setTitle(''); setPinIt(false); setShowComposer(false);
    setSubmitting(false);
    toast.success('Announcement posted!');
    onRefresh();
  };

  return (
    <div className="space-y-3">
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
          {!showComposer ? (
            <button onClick={() => setShowComposer(true)}
              className="w-full flex items-center gap-2 text-[13px] text-slate-400 hover:text-blue-600 transition-colors py-1">
              <Megaphone className="w-4 h-4" /> Post an announcement…
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] font-bold text-slate-800 flex items-center gap-2"><Megaphone className="w-4 h-4" /> New Announcement</p>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)"
                className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300" />
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your announcement…" rows={3}
                className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none outline-none focus:ring-2 focus:ring-blue-300" autoFocus />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={pinIt} onChange={e => setPinIt(e.target.checked)} className="rounded" />
                  <Pin className="w-3.5 h-3.5 text-amber-500" /> Pin this
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setShowComposer(false)} className="px-3 py-1.5 text-[12px] text-slate-500 rounded-full border border-slate-200">Cancel</button>
                  <button onClick={submitAnnouncement} disabled={submitting || !body.trim()}
                    className="px-4 py-1.5 text-[12px] font-bold text-white bg-blue-600 rounded-full disabled:opacity-50">
                    {submitting ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <div className="text-4xl mb-3">📢</div>
          <p className="font-bold text-slate-900">No announcements yet</p>
          <p className="text-[13px] text-slate-500 mt-1">Community updates from admins will appear here.</p>
        </div>
      ) : (
        announcements.map(p => <CommunityPostCard key={p.id} post={p} currentUser={currentUser} isPinned={p.is_pinned} />)
      )}
    </div>
  );
}

// ── Events Tab ────────────────────────────────────────────────
function EventsTab({ community, currentUser, events, isLoading, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', event_date:'', event_time:'', location:'' });
  const [submitting, setSubmitting] = useState(false);
  const [rsvpIds, setRsvpIds] = useState(new Set());

  const upcoming = events.filter(e => !e.event_date || isFuture(new Date(e.event_date))).sort((a,b)=>new Date(a.event_date)-new Date(b.event_date));
  const past = events.filter(e => e.event_date && !isFuture(new Date(e.event_date))).sort((a,b)=>new Date(b.event_date)-new Date(a.event_date));

  const submitEvent = async () => {
    if (!form.title.trim() || !form.event_date) return toast.error('Title and date required');
    setSubmitting(true);
    await base44.entities.CommunityEvent.create({
      community_id: community.id,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      event_date: form.event_date,
      event_time: form.event_time || undefined,
      location: form.location.trim() || undefined,
      organizer_id: currentUser?.id,
      organizer_name: currentUser?.display_name || currentUser?.full_name,
      rsvp_count: 0,
    });
    setForm({ title:'', description:'', event_date:'', event_time:'', location:'' });
    setShowForm(false);
    setSubmitting(false);
    toast.success('Event created!');
    onRefresh();
  };

  const rsvp = async (eventId) => {
    if (!currentUser) return toast.error('Sign in to RSVP');
    if (rsvpIds.has(eventId)) return;
    setRsvpIds(prev => new Set([...prev, eventId]));
    const ev = events.find(e=>e.id===eventId);
    await base44.entities.CommunityEventRSVP.create({ event_id: eventId, user_id: currentUser.id, user_name: currentUser?.display_name || currentUser?.full_name }).catch(()=>{});
    await base44.entities.CommunityEvent.update(eventId, { rsvp_count: (ev?.rsvp_count||0)+1 }).catch(()=>{});
    toast.success("You're going! 🎉");
  };

  const EventCard = ({ ev }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="bg-blue-50 rounded-xl p-2 text-center min-w-[52px] flex-shrink-0">
          <p className="text-[10px] font-bold text-blue-400 uppercase">
            {ev.event_date ? format(new Date(ev.event_date), 'MMM') : '—'}
          </p>
          <p className="text-[20px] font-black text-blue-700 leading-none">
            {ev.event_date ? format(new Date(ev.event_date), 'd') : '?'}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[14px] text-slate-900 leading-snug">{ev.title}</p>
          {ev.description && <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{ev.description}</p>}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500">
            {ev.event_time && <span>🕐 {ev.event_time}</span>}
            {ev.location && <span>📍 {ev.location}</span>}
            {ev.rsvp_count > 0 && <span>👥 {ev.rsvp_count} going</span>}
          </div>
        </div>
        <button onClick={() => rsvp(ev.id)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 ${
            rsvpIds.has(ev.id) ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}>
          {rsvpIds.has(ev.id) ? '✓ Going' : 'RSVP'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <button onClick={() => setShowForm(v=>!v)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-dashed border-blue-300 rounded-2xl text-[13px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors">
        <Plus className="w-4 h-4" /> Create Event
      </button>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <p className="font-bold text-[14px] text-slate-900 flex items-center gap-2"><Calendar className="w-4 h-4" /> New Event</p>
          <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Event name *"
            className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-300" />
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description (optional)" rows={2}
            className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none outline-none focus:ring-2 focus:ring-blue-300" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.event_date} onChange={e=>setForm(f=>({...f,event_date:e.target.value}))}
              className="text-[12px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-300" />
            <input type="time" value={form.event_time} onChange={e=>setForm(f=>({...f,event_time:e.target.value}))}
              className="text-[12px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Location (optional)"
            className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-300" />
          <div className="flex gap-2 justify-end">
            <button onClick={()=>setShowForm(false)} className="px-4 py-1.5 text-[12px] text-slate-500 rounded-full border border-slate-200">Cancel</button>
            <button onClick={submitEvent} disabled={submitting}
              className="px-5 py-1.5 text-[12px] font-bold text-white bg-blue-600 rounded-full disabled:opacity-50">{submitting?'Creating…':'Create'}</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
      ) : (
        <>
          {upcoming.length === 0 && past.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <div className="text-4xl mb-3">📅</div>
              <p className="font-bold text-slate-900">No events yet</p>
              <p className="text-[13px] text-slate-500 mt-1">Create the first event for this community!</p>
            </div>
          )}
          {upcoming.length > 0 && (
            <>
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Upcoming</p>
              {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </>
          )}
          {past.length > 0 && (
            <>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide mt-4">Past Events</p>
              {past.slice(0,3).map(ev => (
                <div key={ev.id} className="opacity-60"><EventCard ev={ev} /></div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Members Tab ───────────────────────────────────────────────
function MembersTab({ communityId }) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => base44.entities.UserCommunity.filter({ community_id: communityId }, '-created_date', 100),
    enabled: !!communityId,
    staleTime: 60000,
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[13px] font-bold text-slate-700">{members.length} members</p>
      </div>
      {members.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="text-3xl mb-2">👥</div>
          <p className="font-bold text-slate-900">No members yet</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2">
        {members.map((m, i) => (
          <div key={m.id} className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3">
            <Avatar name={m.user_name || m.display_name || 'Member'} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate">{m.user_name || m.display_name || 'Community Member'}</p>
              <p className="text-[11px] text-slate-400">{m.role || 'Member'}</p>
            </div>
            {i < 3 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── About Tab ─────────────────────────────────────────────────
function AboutTab({ community }) {
  const rows = [
    { icon: BookOpen, label: 'Category', value: community.category || community.type },
    { icon: MapPin, label: 'Location', value: community.location || community.neighborhood || community.city },
    { icon: Users, label: 'Members', value: community.follower_count ? `${community.follower_count.toLocaleString()} members` : null },
    { icon: Info, label: 'Who it\'s for', value: community.who_its_for },
  ];

  return (
    <div className="space-y-4">
      {community.description && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">About</p>
          <p className="text-[14px] text-slate-700 leading-relaxed">{community.description}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Details</p>
        {rows.filter(r=>r.value).map(r => {
          const Icon = r.icon;
          return (
            <div key={r.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">{r.label}</p>
                <p className="text-[13px] font-semibold text-slate-900">{r.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {community.rules && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-[12px] font-bold text-amber-700 uppercase tracking-wide mb-2">📋 Community Rules</p>
          <p className="text-[13px] text-amber-800 leading-relaxed">{community.rules}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function CommunityNetworkView({ communityId, currentUser, onBack }) {
  const [activeTab, setActiveTab] = useState('feed');
  const queryClient = useQueryClient();

  const { data: community, isLoading: loadingCommunity } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(r=>r[0]),
    enabled: !!communityId,
  });

  const { data: membership = [] } = useQuery({
    queryKey: ['community-membership', communityId, currentUser?.id],
    queryFn: () => base44.entities.UserCommunity.filter({ community_id: communityId, user_id: currentUser.id }),
    enabled: !!currentUser,
  });

  const { data: posts = [], isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ['community-posts-v2', communityId],
    queryFn: () => base44.entities.CommunityPost.filter({ community_id: communityId }, '-created_date', 60),
    enabled: !!communityId,
    staleTime: 30000,
  });

  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['community-events-v2', communityId],
    queryFn: () => base44.entities.CommunityEvent.filter({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId,
    staleTime: 60000,
  });

  const isMember = membership.length > 0;

  const handleJoin = async () => {
    if (!currentUser) return toast.error('Sign in to join');
    if (isMember) {
      await base44.entities.UserCommunity.delete(membership[0].id);
      if (community) await base44.entities.Community.update(communityId, { follower_count: Math.max(0,(community.follower_count||1)-1) });
      toast.success('Left community');
    } else {
      await base44.entities.UserCommunity.create({ user_id: currentUser.id, community_id: communityId, role: 'Member' });
      if (community) await base44.entities.Community.update(communityId, { follower_count: (community.follower_count||0)+1 });
      toast.success('Joined! 🎉');
    }
    queryClient.invalidateQueries({ queryKey: ['community-membership', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community', communityId] });
  };

  if (loadingCommunity || !community) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  const gradient = getGradient(community);
  const initials = getInitials(community.name);
  const eventCount = events.filter(e => !e.event_date || isFuture(new Date(e.event_date))).length;

  const tabsWithCounts = TABS.map(t => ({
    ...t,
    count: t.key === 'events' ? eventCount : 0
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cover + Header */}
      <div className={`relative h-40 bg-gradient-to-br ${gradient}`}>
        {community.logo_url && <img src={community.logo_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <button onClick={onBack} className="absolute top-4 left-4 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Profile section */}
      <div className="bg-white px-4 pb-4 border-b border-slate-100 shadow-sm">
        <div className="flex items-end justify-between -mt-10 mb-3">
          <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
            {community.logo_url ? (
              <img src={community.logo_url} alt={community.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-[22px]`}>
                {initials}
              </div>
            )}
          </div>
          <button onClick={handleJoin}
            className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 ${
              isMember ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
            }`}>
            {isMember ? '✓ Joined' : '+ Join'}
          </button>
        </div>

        <h1 className="text-[20px] font-black text-slate-900 leading-tight">{community.name}</h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {community.is_verified && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">✅ Verified</span>}
          {(community.category || community.type) && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{community.category || community.type}</span>
          )}
          {(community.location || community.neighborhood) && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{community.location || community.neighborhood}</span>
          )}
        </div>
        {community.description_short && (
          <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{community.description_short}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-[12px] text-slate-500">
          <span className="font-bold text-slate-900">{(community.follower_count||0).toLocaleString()}</span> members
          <span>·</span>
          <span className="font-bold text-slate-900">{posts.length}</span> posts
          {eventCount > 0 && <><span>·</span><span className="font-bold text-blue-600">{eventCount}</span> upcoming events</>}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-2">
            {tabsWithCounts.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors relative ${
                  activeTab === tab.key ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 font-bold">{tab.count}</span>
                )}
                {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-2xl mx-auto px-4 py-4 pb-28">
        {activeTab === 'feed' && (
          <FeedTab community={community} currentUser={currentUser} posts={posts} isLoading={postsLoading} onRefresh={refetchPosts} />
        )}
        {activeTab === 'events' && (
          <EventsTab community={community} currentUser={currentUser} events={events} isLoading={eventsLoading} onRefresh={refetchEvents} />
        )}
        {activeTab === 'members' && <MembersTab communityId={communityId} />}
        {activeTab === 'about' && <AboutTab community={community} />}
      </div>
    </div>
  );
}