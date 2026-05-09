import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dataService, incrementCounter } from '@/services';
import { ArrowLeft, Loader2, Pin, MapPin, Users, MessageCircle, Heart } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'sonner';

// ── Helpers ───────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }); } catch { return ''; }
}

const TYPE_CONFIG = {
  discussion:    { label: 'Discussion',    bg: 'bg-slate-100',    text: 'text-slate-600' },
  question:      { label: 'Question',      bg: 'bg-blue-100',     text: 'text-blue-700' },
  help:          { label: 'Help',          bg: 'bg-orange-100',   text: 'text-orange-700' },
  announcement:  { label: 'Announcement', bg: 'bg-purple-100',   text: 'text-purple-700' },
  recommendation:{ label: 'Recommend',    bg: 'bg-emerald-100',  text: 'text-emerald-700' },
  event:         { label: 'Event',         bg: 'bg-green-100',    text: 'text-green-700' },
  general:       { label: 'Update',        bg: 'bg-slate-100',    text: 'text-slate-600' },
};

const POST_TYPES = ['question', 'help', 'discussion', 'announcement', 'recommendation'];

const CATEGORY_GRADIENTS = {
  School: 'from-sky-600 to-blue-700',
  Yeshiva: 'from-sky-600 to-indigo-700',
  Seminary: 'from-pink-500 to-rose-600',
  Shul: 'from-violet-600 to-purple-700',
  Camp: 'from-amber-500 to-orange-500',
  Other: 'from-blue-600 via-indigo-600 to-violet-600',
};

function getGradient(community) {
  return CATEGORY_GRADIENTS[community.category] || CATEGORY_GRADIENTS[community.type] || CATEGORY_GRADIENTS.Other;
}

// ── Post Composer ─────────────────────────────────────────────
function PostComposer({ community, currentUser, onPosted }) {
  const [body, setBody] = useState('');
  const [postType, setPostType] = useState('question');
  const [submitting, setSubmitting] = useState(false);
  const name = currentUser?.display_name || currentUser?.full_name || 'You';

  const submit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await dataService.entities.CommunityPost.create({
        community_id: community.id,
        author_name: name,
        author_user_id: currentUser?.id || 'guest',
        author_avatar_url: currentUser?.avatar_url,
        body: body.trim(),
        post_type: postType,
        likes_count: 0,
        comments_count: 0,
        is_pinned: false,
      });
      setBody('');
      toast.success('Posted!');
      onPosted?.();
    } catch {
      toast.error('Failed to post');
    }
    setSubmitting(false);
  };

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 font-bold text-white text-sm">
          {initials(name)}
        </div>
        <div className="flex-1">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Ask for help, share an update, or post a question..."
            rows={3}
            className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50 focus:bg-white transition-colors"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.map(t => {
                const cfg = TYPE_CONFIG[t];
                return (
                  <button
                    key={t}
                    onClick={() => setPostType(t)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      postType === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={submit}
              disabled={submitting || !body.trim()}
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 active:scale-95 transition-all"
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Comment Thread ─────────────────────────────────────────────
function CommentThread({ postId, currentUser, initialCount }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['community-post-comments', postId],
    queryFn: () => dataService.entities.Comment.filter({ post_id: postId }, 'created_date', 50),
    enabled: open,
    staleTime: 30000,
  });

  const submitComment = async () => {
    if (!text.trim() || !currentUser) return;
    setSubmitting(true);
    try {
      await dataService.entities.Comment.create({
        post_id: postId,
        author_id: currentUser.id,
        author_name: currentUser.display_name || currentUser.full_name || 'Member',
        body: text.trim(),
      });
      setText('');
      queryClient.invalidateQueries({ queryKey: ['community-post-comments', postId] });
    } catch { toast.error('Could not post reply'); }
    setSubmitting(false);
  };

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <MessageCircle className="w-4 h-4" />
        {open ? 'Hide replies' : `Reply${initialCount > 0 ? ` (${initialCount})` : ''}`}
      </button>

      {open && (
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-1">No replies yet — be the first!</p>
          ) : (
            <div className="space-y-2">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                    {initials(c.author_name || '?')}
                  </div>
                  <div className="bg-white rounded-xl px-3 py-2 flex-1 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-800 mr-1.5">{c.author_name}</span>
                    <span className="text-xs text-slate-600">{c.body}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {currentUser && (
            <div className="flex gap-2 pt-1">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()}
                placeholder="Write a reply…"
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs outline-none focus:border-indigo-400"
              />
              <button
                onClick={submitComment}
                disabled={submitting || !text.trim()}
                className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────
function PostCard({ post, currentUser, onPin, isAdmin }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const cfg = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.general;

  const toggleLike = async () => {
    setLiked(l => !l);
    setLikes(n => liked ? n - 1 : n + 1);
    try {
      await incrementCounter('community_posts', 'likes_count', post.id, liked ? -1 : 1);
    } catch {}
  };

  return (
    <div className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${
      post.is_pinned ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200'
    }`}>
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 border-b border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">
          <Pin className="w-3 h-3" /> Pinned post
        </div>
      )}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
              {post.author_avatar_url
                ? <img src={post.author_avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                : initials(post.author_name || 'M')}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">{post.author_name || 'Community Member'}</span>
                {post.is_official && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">Moderator</span>
                )}
                <span className="text-xs text-slate-400">{timeAgo(post.created_date)}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => onPin(post)}
              title={post.is_pinned ? 'Unpin' : 'Pin'}
              className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
            >
              <Pin className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        {post.title && <h3 className="mt-3 font-bold text-slate-900">{post.title}</h3>}
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{post.body}</p>

        {post.image_url && (
          <img src={post.image_url} alt="" className="mt-3 w-full rounded-2xl object-cover max-h-60" loading="lazy" />
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
            {likes > 0 && <span>{likes}</span>}
          </button>
          <CommentThread postId={post.id} currentUser={currentUser} initialCount={post.comments_count || 0} />
        </div>
      </div>
    </div>
  );
}

// ── Feed Tab ──────────────────────────────────────────────────
function FeedTab({ community, currentUser, isAdmin }) {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['community-posts-main', community.id],
    queryFn: () => dataService.entities.CommunityPost.filter({ community_id: community.id }, '-created_date', 80),
    staleTime: 30000,
  });

  const sortedPosts = useMemo(() => {
    const pinned = posts.filter(p => p.is_pinned);
    const regular = posts.filter(p => !p.is_pinned);
    return [...pinned, ...regular];
  }, [posts]);

  const handlePin = async (post) => {
    await dataService.entities.CommunityPost.update(post.id, { is_pinned: !post.is_pinned });
    queryClient.invalidateQueries({ queryKey: ['community-posts-main', community.id] });
  };

  return (
    <div className="space-y-4">
      <PostComposer
        community={community}
        currentUser={currentUser}
        onPosted={() => queryClient.invalidateQueries({ queryKey: ['community-posts-main', community.id] })}
      />
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
      ) : sortedPosts.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-4xl mb-3">✍️</div>
          <p className="font-bold text-slate-900">No posts yet</p>
          <p className="text-sm text-slate-500 mt-1">Be the first to share something with this community!</p>
        </div>
      ) : (
        sortedPosts.map(post => (
          <PostCard key={post.id} post={post} currentUser={currentUser} onPin={handlePin} isAdmin={isAdmin} />
        ))
      )}
    </div>
  );
}

// ── Members Tab ───────────────────────────────────────────────
function MembersTab({ communityId }) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['community-members-main', communityId],
    queryFn: () => dataService.entities.UserCommunity.filter({ community_id: communityId }, '-created_date', 100),
    staleTime: 60000,
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-lg font-bold text-slate-900 mb-4">{members.length} Members</p>
      {members.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No members yet.</p>
      ) : (
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                  {initials(m.user_name || m.display_name || 'M')}
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{m.user_name || m.display_name || 'Member'}</p>
                  <p className="text-xs text-slate-400">{m.role || 'Member'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── About Tab ─────────────────────────────────────────────────
function AboutTab({ community }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm space-y-4">
      <h2 className="text-lg font-bold text-slate-900">About this community</h2>
      {community.description && (
        <p className="text-sm leading-relaxed text-slate-700">{community.description}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {(community.category || community.type) && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</p>
            <p className="mt-1 font-semibold text-slate-900">{community.category || community.type}</p>
          </div>
        )}
        {(community.location || community.neighborhood) && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
            <p className="mt-1 font-semibold text-slate-900">{community.location || community.neighborhood}</p>
          </div>
        )}
        {community.who_its_for && (
          <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Who it's for</p>
            <p className="mt-1 text-sm text-slate-700">{community.who_its_for}</p>
          </div>
        )}
        {community.rules && (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">📋 Rules</p>
            <p className="mt-1 text-sm text-amber-900">{community.rules}</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 pt-2">
        {[
          { label: 'Members', value: (community.follower_count || 0).toLocaleString() },
          { label: 'Posts', value: community.post_count || 0 },
          { label: 'This Week', value: community.posts_this_week || 0 },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-indigo-50 p-3 text-center">
            <p className="text-lg font-black text-indigo-700">{s.value}</p>
            <p className="text-xs text-indigo-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function CommunityNetworkView({ communityId, currentUser, onBack }) {
  const [activeTab, setActiveTab] = useState('feed');
  const queryClient = useQueryClient();

  const { data: community, isLoading: loadingCommunity } = useQuery({
    queryKey: ['community-detail', communityId],
    queryFn: () => dataService.entities.Community.filter({ id: communityId }).then(r => r[0]),
    enabled: !!communityId,
    staleTime: 60000,
  });

  const { data: membership = [] } = useQuery({
    queryKey: ['community-membership-main', communityId, currentUser?.id],
    queryFn: () => dataService.entities.UserCommunity.filter({ community_id: communityId, user_id: currentUser.id }),
    enabled: !!currentUser?.id,
  });

  const isMember = membership.length > 0;
  const isAdmin = currentUser?.role === 'admin';

  const handleJoinLeave = async () => {
    if (!currentUser) { dataService.auth.redirectToLogin(); return; }
    if (isMember) {
      await dataService.entities.UserCommunity.delete(membership[0].id);
      if (community) await incrementCounter('communities', 'follower_count', communityId, -1);
      toast.success('Left community');
    } else {
      await dataService.entities.UserCommunity.create({ user_id: currentUser.id, community_id: communityId, role: 'Member' });
      if (community) await incrementCounter('communities', 'follower_count', communityId, 1);
      toast.success('Joined! 🎉');
    }
    queryClient.invalidateQueries({ queryKey: ['community-membership-main', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-detail', communityId] });
  };

  if (loadingCommunity || !community) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const gradient = getGradient(community);

  const TABS = [
    { key: 'feed', label: 'Feed' },
    { key: 'members', label: 'Members' },
    { key: 'about', label: 'About' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto max-w-3xl px-4 pt-5">

        {/* Header Card */}
        <div className={`overflow-hidden rounded-[28px] bg-gradient-to-r ${gradient} text-white shadow-lg mb-4`}>
          <div className="p-5">
            <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="mb-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              {community.category || community.type || 'Community'}
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-tight">{community.name}</h1>
                {community.description_short && (
                  <p className="mt-2 text-sm text-white/85 leading-relaxed">{community.description_short}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/90">
                  <span className="rounded-full bg-white/15 px-3 py-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {(community.follower_count || 0).toLocaleString()} members
                  </span>
                  {community.posts_this_week > 0 && (
                    <span className="rounded-full bg-white/15 px-3 py-1">
                      {community.posts_this_week} posts this week
                    </span>
                  )}
                  {(community.neighborhood || community.location) && (
                    <span className="rounded-full bg-white/15 px-3 py-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {community.neighborhood || community.location}
                    </span>
                  )}
                  {community.is_verified && (
                    <span className="rounded-full bg-white/20 px-3 py-1">✅ Verified</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleJoinLeave}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all active:scale-95 ${
                  isMember
                    ? 'bg-white/20 text-white border border-white/40'
                    : 'bg-white text-indigo-700 hover:bg-white/90'
                }`}
              >
                {isMember ? '✓ Joined' : 'Join'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="mb-4 rounded-2xl bg-white p-1 shadow-sm">
          <div className="grid grid-cols-3 gap-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === tab.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'feed' && <FeedTab community={community} currentUser={currentUser} isAdmin={isAdmin} />}
        {activeTab === 'members' && <MembersTab communityId={communityId} />}
        {activeTab === 'about' && <AboutTab community={community} />}
      </div>
    </div>
  );
}