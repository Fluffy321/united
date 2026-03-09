import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, MapPin, Send, Calendar, HandHeart, UserCheck, Loader2, Check, X, Clock, Megaphone, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import InviteLinkButton from './InviteLinkButton';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'sonner';
import GroupEventsTab from '@/components/groups/GroupEventsTab';
import GroupHelpTab from '@/components/groups/GroupHelpTab';

const CATEGORY_EMOJIS = {
  'Torah Learning': '📚', Shabbat: '🕯️', Chesed: '🤝', Events: '🎉',
  Youth: '👦', Families: '👨‍👩‍👧', Seniors: '👴', General: '💬',
  School: '🏫', Shul: '🕍', Sports: '⚽', Travel: '✈️',
  Business: '💼', Learning: '📚', Social: '🎉', Other: '🌍',
};

const TABS = [
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'posts', label: 'Posts', icon: Send },
  { id: 'members', label: 'Members', icon: UserPlus },
  { id: 'announcements', label: 'Announce', icon: Megaphone },
];

export default function CommunityGroupPage({ group, currentUser, isMember, isPendingRequest, onJoin, onLeave, onBack, onMemberApproved }) {
  const [tab, setTab] = useState('events');
  const [posts, setPosts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [posting, setPosting] = useState(false);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [processingRequest, setProcessingRequest] = useState(null);

  useEffect(() => {
    if (!group) return;
    setLoading(true);
    const isAdmin = group.created_by_user_id === currentUser?.id;
    Promise.all([
      base44.entities.GroupPost.filter({ group_id: group.id, post_type: 'post' }, '-created_date', 30),
      base44.entities.GroupPost.filter({ group_id: group.id, post_type: 'announcement' }, '-created_date', 30),
      base44.entities.GroupMember.filter({ group_id: group.id }, '-created_date', 100),
      isAdmin ? base44.entities.GroupJoinRequest.filter({ group_id: group.id, status: 'pending' }) : Promise.resolve([]),
    ]).then(([p, a, m, r]) => {
      setPosts(p);
      setAnnouncements(a);
      setMembers(m);
      setJoinRequests(r);
      setLoading(false);
    });
  }, [group]);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    const post = await base44.entities.GroupPost.create({
      group_id: group.id,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      body: newPost.trim(),
      post_type: 'post',
    });
    await base44.entities.CommunityGroup.update(group.id, { post_count: (group.post_count || 0) + 1 });
    setPosts(prev => [post, ...prev]);
    setNewPost('');
    setPosting(false);
    toast.success('Posted!');
  };

  const handleApprove = async (req) => {
    setProcessingRequest(req.id);
    await base44.entities.GroupMember.create({ group_id: group.id, user_id: req.user_id, user_name: req.user_name, role: 'member' });
    await base44.entities.GroupJoinRequest.update(req.id, { status: 'approved' });
    await base44.entities.CommunityGroup.update(group.id, { member_count: (group.member_count || 0) + 1 });
    setJoinRequests(prev => prev.filter(r => r.id !== req.id));
    setMembers(prev => [...prev, { id: req.id, user_id: req.user_id, user_name: req.user_name, role: 'member' }]);
    onMemberApproved?.(group.id);
    setProcessingRequest(null);
    toast.success(`${req.user_name} approved!`);
  };

  const handleAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    setPostingAnnouncement(true);
    const ann = await base44.entities.GroupPost.create({
      group_id: group.id,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      body: newAnnouncement.trim(),
      post_type: 'announcement',
    });
    setAnnouncements(prev => [ann, ...prev]);
    setNewAnnouncement('');
    setPostingAnnouncement(false);
    toast.success('Announcement posted!');
  };

  const handleDeny = async (req) => {
    setProcessingRequest(req.id);
    await base44.entities.GroupJoinRequest.update(req.id, { status: 'denied' });
    setJoinRequests(prev => prev.filter(r => r.id !== req.id));
    setProcessingRequest(null);
    toast.success('Request denied');
  };

  if (!group) return null;

  const emoji = CATEGORY_EMOJIS[group.category] || '🌍';

  return (
    <div className="flex flex-col h-full bg-[#F5F7FB]">

      {/* ── Hero Header ── */}
      <div className="flex-shrink-0 relative" style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
        {group.cover_image_url && (
          <img src={group.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="relative px-4 pt-12 pb-5">
          <button onClick={onBack} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-end justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl border border-white/30">
                {emoji}
              </div>
              <div>
                <h1 className="text-white font-bold text-[20px] leading-tight">{group.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-white/70 text-[12px]">
                    <Users className="w-3 h-3" />
                    {group.member_count || 0} members
                  </span>
                  {group.location && (
                    <span className="flex items-center gap-1 text-white/70 text-[12px]">
                      <MapPin className="w-3 h-3" />
                      {group.location}
                    </span>
                  )}
                  <span className="text-white/70 text-[12px]">
                    {group.is_private ? '🔒 Private' : '🌍 Public'}
                  </span>
                </div>
              </div>
            </div>
            <InviteLinkButton type="group" id={group.id} name={group.name} className="!border-white/30 !text-white !bg-white/10 hover:!bg-white/20" />
            {isPendingRequest && !isMember ? (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-bold" style={{ background: 'rgba(251,191,36,0.2)', color: '#FCD34D', border: '1px solid rgba(251,191,36,0.3)' }}>
                <Clock className="w-3.5 h-3.5" /> Pending
              </div>
            ) : (
              <button
                onClick={() => isMember ? onLeave(group) : onJoin(group)}
                className="flex-shrink-0 px-4 py-2 rounded-full font-bold text-[13px] transition-all active:scale-95"
                style={isMember
                  ? { background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }
                  : { background: 'white', color: '#2563EB' }
                }
              >
                {isMember ? '✓ Joined' : group.is_private ? '🔒 Request' : '+ Join'}
              </button>
            )}
          </div>

          {group.description && (
            <p className="text-white/70 text-[13px] mt-3 leading-relaxed">{group.description}</p>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100">
        <div className="flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-[12px] font-semibold transition-all border-b-2 ${
                tab === t.id ? 'text-[#2563EB] border-[#2563EB]' : 'text-slate-400 border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto pb-28 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
          </div>
        ) : (
          <>
            {/* Events Tab */}
            {tab === 'events' && (
              <GroupEventsTab group={group} currentUser={currentUser} isMember={isMember} />
            )}

            {/* Posts Tab */}
            {tab === 'posts' && (
              <div className="p-4 space-y-3">
                {isMember && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-3.5 flex gap-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[13px] font-bold text-blue-600 flex-shrink-0">
                      {currentUser.full_name?.[0]}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <textarea
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[14px] resize-none outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400"
                        rows={2}
                        placeholder="Share something with the community…"
                        value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                      />
                      <button
                        onClick={handlePost}
                        disabled={posting || !newPost.trim()}
                        className="self-end w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all active:scale-95"
                        style={{ background: '#2563EB' }}
                      >
                        {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {posts.length === 0 ? (
                  <EmptyState emoji="💬" text="No posts yet" sub={isMember ? "Be the first to post!" : "Join to start posting"} />
                ) : (
                  posts.map(post => (
                    <div key={post.id} className="bg-white rounded-2xl border border-slate-100 p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[12px] font-bold text-blue-600">
                          {post.user_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-[13px] text-slate-900">{post.user_name}</p>
                          <p className="text-[11px] text-slate-400">
                            {formatDistanceToNow(parseISO(post.created_date), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <p className="text-[14px] text-slate-700 leading-relaxed">{post.body}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Members Tab */}
            {tab === 'members' && (
              <div className="p-4 space-y-2">
                {/* Admin: Pending Requests */}
                {group.created_by_user_id === currentUser?.id && joinRequests.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[12px] font-bold text-amber-600 uppercase tracking-wide mb-2">
                      ⏳ Join Requests ({joinRequests.length})
                    </p>
                    {joinRequests.map(req => (
                      <div key={req.id} className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-[14px] font-bold text-amber-700 flex-shrink-0">
                          {req.user_name?.[0] || '?'}
                        </div>
                        <p className="flex-1 text-[14px] font-semibold text-slate-900">{req.user_name}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={processingRequest === req.id}
                            className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white active:scale-95 transition-all"
                          >
                            {processingRequest === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDeny(req)}
                            disabled={processingRequest === req.id}
                            className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 active:scale-95 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[12px] font-semibold text-slate-400 mb-3">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                {members.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[14px] font-bold text-blue-600 flex-shrink-0">
                      {m.user_name?.[0] || '?'}
                    </div>
                    <p className="flex-1 text-[14px] font-semibold text-slate-900">{m.user_name}</p>
                    {m.role === 'admin' && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">Admin</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

            {/* Announcements Tab */}
            {tab === 'announcements' && (
              <div className="p-4 space-y-3">
                {group.created_by_user_id === currentUser?.id && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-3.5 flex gap-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 flex gap-2">
                      <textarea
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[14px] resize-none outline-none focus:border-amber-400 transition-colors placeholder:text-slate-400"
                        rows={2}
                        placeholder="Post an announcement to the group…"
                        value={newAnnouncement}
                        onChange={e => setNewAnnouncement(e.target.value)}
                      />
                      <button
                        onClick={handleAnnouncement}
                        disabled={postingAnnouncement || !newAnnouncement.trim()}
                        className="self-end w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all active:scale-95"
                        style={{ background: '#F59E0B' }}
                      >
                        {postingAnnouncement ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                {announcements.length === 0 ? (
                  <EmptyState emoji="📢" text="No announcements yet" sub="Admins can post announcements here" />
                ) : (
                  announcements.map(ann => (
                    <div key={ann.id} className="bg-amber-50 rounded-2xl border border-amber-100 p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                          <Megaphone className="w-3.5 h-3.5 text-amber-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-[13px] text-slate-900">{ann.user_name}</p>
                          <p className="text-[11px] text-slate-400">
                            {formatDistanceToNow(parseISO(ann.created_date), { addSuffix: true })}
                          </p>
                        </div>
                        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">📢 Announcement</span>
                      </div>
                      <p className="text-[14px] text-slate-700 leading-relaxed">{ann.body}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ emoji, text, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{emoji}</div>
      <p className="text-[14px] font-semibold text-slate-700">{text}</p>
      {sub && <p className="text-[12px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}