import React, { useState, useEffect } from 'react';
import { MapPin, MessageCircle, Loader2, ArrowLeft, Heart, Users, HandHeart, Calendar, FileText } from 'lucide-react';
import { dataService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import UserAvatar from '@/components/common/UserAvatar';

// ── Avatar color helper ───────────────────────────────────────────────────────
const AVATAR_COLORS = ['#2563EB','#7C3AED','#16A34A','#F59E0B','#EC4899','#0891B2'];
function AvatarFallback({ name = '?', size = 80 }) {
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}
      className="rounded-full flex items-center justify-center text-white font-extrabold flex-shrink-0"
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ── Post type label ───────────────────────────────────────────────────────────
const POST_TYPE_LABELS = {
  feed: { label: 'Post', color: 'bg-slate-100 text-slate-600' },
  help: { label: '🤝 Chesed', color: 'bg-amber-100 text-amber-700' },
  event: { label: '📅 Event', color: 'bg-green-100 text-green-700' },
  job: { label: '💼 Job', color: 'bg-blue-100 text-blue-700' },
  housing: { label: '🏠 Housing', color: 'bg-sky-100 text-sky-700' },
  news: { label: '📰 News', color: 'bg-slate-100 text-slate-600' },
  prompt_reply: { label: '💭 Prompt', color: 'bg-purple-100 text-purple-700' },
};

// ── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({ icon: Icon, value, label, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
  };
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl px-4 py-3 flex-1 ${colors[color]}`}>
      <Icon className="w-4 h-4 mb-1 opacity-70" />
      <span className="text-[20px] font-extrabold leading-none">{value}</span>
      <span className="text-[10px] font-semibold opacity-70 mt-0.5">{label}</span>
    </div>
  );
}

// ── Sub-group badge strip ─────────────────────────────────────────────────────
function SubGroupStrip({ userId }) {
  const [subgroups, setSubgroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    dataService.entities.SubGroupMember.filter({ user_id: userId, status: 'approved' })
      .then(async (memberships) => {
        if (!memberships.length) { setLoading(false); return; }
        const ids = memberships.map(m => m.subgroup_id);
        const all = await Promise.allSettled(ids.map(id => dataService.entities.SubGroup.get(id)));
        setSubgroups(all.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading || subgroups.length === 0) return null;

  return (
    <div className="px-4 py-4 border-t border-slate-100">
      <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" /> Sub-groups
      </p>
      <div className="flex flex-wrap gap-2">
        {subgroups.map(sg => (
          <div
            key={sg.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[12px] font-semibold"
          >
            <span>{sg.emoji || '👥'}</span>
            <span>{sg.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post, navigate }) {
  const typeConfig = POST_TYPE_LABELS[post.type] || POST_TYPE_LABELS.feed;
  const timeAgo = post.created_date
    ? formatDistanceToNow(parseISO(post.created_date), { addSuffix: true })
    : '';

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => navigate(`/PostDetail?id=${post.id}`)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${typeConfig.color}`}>
          {typeConfig.label}
        </span>
        <span className="text-[11px] text-slate-400">{timeAgo}</span>
      </div>
      {post.title && (
        <h3 className="font-bold text-[14px] text-slate-900 mb-1 leading-snug">{post.title}</h3>
      )}
      <p className="text-[13px] text-slate-600 line-clamp-3 leading-relaxed">{post.body}</p>
      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400">
          {post.likes_count > 0 && <span>❤️ {post.likes_count}</span>}
          {post.comments_count > 0 && <span>💬 {post.comments_count}</span>}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PublicProfile() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [mitzvahCount, setMitzvahCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const fetchAll = async () => {
      const [usersRes, postsRes, mitzvahRes] = await Promise.allSettled([
        dataService.entities.User.filter({ id: userId }),
        dataService.entities.UnifiedPost.filter({ user_id: userId }, '-created_date', 20),
        dataService.entities.MitzvahLog.filter({ user_id: userId }, '-created_date', 100),
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value[0]) {
        setProfileUser(usersRes.value[0]);
      }
      if (postsRes.status === 'fulfilled') {
        setPosts(postsRes.value.filter(p => p.type !== 'dating' && !p.is_anonymous));
      }
      if (mitzvahRes.status === 'fulfilled') {
        setMitzvahCount(mitzvahRes.value.length);
      }
      setLoading(false);
    };

    fetchAll();
  }, [userId]);

  const handleMessage = async () => {
    if (!currentUser) { dataService.auth.redirectToLogin(); return; }
    setMessagingLoading(true);
    try {
      const allConvs = await dataService.entities.Conversation.list('-updated_date', 100);
      const existing = allConvs.find(c =>
        c.participant_ids?.includes(currentUser.id) &&
        c.participant_ids?.includes(profileUser.id) &&
        c.participant_ids?.length === 2
      );
      if (existing) {
        navigate(`/Messages?conversation=${existing.id}`);
        return;
      }
      const conv = await dataService.entities.Conversation.create({
        participant_ids: [currentUser.id, profileUser.id],
        participant_names: [
          currentUser.display_name || currentUser.full_name?.split(' ')[0] || 'You',
          profileUser.display_name || profileUser.full_name?.split(' ')[0] || 'User',
        ],
        participant_ages: [currentUser.age_range || '18+', profileUser.age_range || '18+'],
        unread_count: {},
        request_type: 'general',
      });
      navigate(`/Messages?conversation=${conv.id}`);
    } catch {
      // silently handle
    } finally {
      setMessagingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="text-5xl">🙈</div>
        <p className="text-[16px] font-bold text-slate-700">Profile not found</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 font-semibold text-sm">Go back</button>
      </div>
    );
  }

  const displayName = profileUser.display_name || profileUser.full_name?.split(' ')[0] || 'User';
  const memberSince = profileUser.created_date ? format(parseISO(profileUser.created_date), 'MMM yyyy') : null;
  const totalLikes = posts.reduce((s, p) => s + (p.likes_count || 0), 0);
  const isMe = currentUser?.id === profileUser.id;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      {/* Top nav */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-900 text-[15px] truncate">{displayName}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Hero card */}
        <div className="bg-white border-b border-slate-100">
          {/* Cover gradient */}
          <div className="h-28 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="px-4 pb-5 relative">
            {/* Avatar */}
            <div className="-mt-10 mb-3 flex items-end justify-between">
              <div className="border-4 border-white rounded-full shadow-md">
                <UserAvatar
                  user={{ ...profileUser, display_name: displayName }}
                  name={displayName}
                  size="xl"
                />
              </div>
              {!isMe && currentUser && (
                <button
                  onClick={handleMessage}
                  disabled={messagingLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 transition-colors disabled:opacity-60 active:scale-95"
                >
                  {messagingLoading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <MessageCircle className="w-3.5 h-3.5" />}
                  Message
                </button>
              )}
              {!isMe && !currentUser && (
                <button
                  onClick={() => dataService.auth.redirectToLogin()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white text-[13px] font-bold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Message
                </button>
              )}
            </div>

            {/* Name + meta */}
            <h1 className="text-[22px] font-extrabold text-slate-900 leading-tight">{displayName}</h1>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
              {(profileUser.city || profileUser.cityPreset) && (
                <span className="flex items-center gap-1 text-[12px] text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {profileUser.city || profileUser.cityPreset}
                </span>
              )}
              {memberSince && (
                <span className="flex items-center gap-1 text-[12px] text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {memberSince}
                </span>
              )}
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <p className="mt-3 text-[14px] text-slate-700 leading-relaxed">{profileUser.bio}</p>
            )}

            {/* Interests */}
            {profileUser.interests?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profileUser.interests.map((interest, i) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-full border border-blue-100">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Contribution stats */}
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <StatChip icon={FileText} value={posts.length} label="Posts" color="blue" />
              <StatChip icon={Heart} value={totalLikes} label="Likes" color="purple" />
              <StatChip icon={HandHeart} value={mitzvahCount} label="Mitzvahs" color="amber" />
            </div>
          </div>

          {/* Sub-group memberships */}
          <SubGroupStrip userId={profileUser.id} />
        </div>

        {/* Posts */}
        <div className="px-4 pt-5">
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">
            {isMe ? 'Your posts' : `Posts by ${displayName}`}
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <div className="text-4xl mb-2">✍️</div>
              <p className="text-[14px] font-semibold text-slate-600">No public posts yet</p>
              <p className="text-[12px] text-slate-400 mt-1">Posts will appear here once shared</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <PostCard key={post.id} post={post} navigate={navigate} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}