import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Users, MessageCircle, Search, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO, subDays } from 'date-fns';
import { createPageUrl } from '@/utils';

const AVATAR_COLORS = ['#2563EB','#7C3AED','#16A34A','#F59E0B','#EC4899','#0891B2'];

function Avatar({ name = '?', size = 'md' }) {
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const sz = size === 'lg' ? 'w-12 h-12 text-[16px]' : 'w-10 h-10 text-[13px]';
  return (
    <div className={`${sz} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`} style={{ background: color }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

const ROLE_CHIP = {
  Admin: 'bg-amber-100 text-amber-800',
  Mod: 'bg-purple-100 text-purple-700',
  Member: 'bg-slate-100 text-slate-600',
};

const SEGMENTS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: '🆕 New this week' },
  { key: 'active', label: '⭐ Most active' },
  { key: 'admins', label: '👑 Admins' },
];

function MemberCard({ member, currentUser, onMessage, messagingId }) {
  const navigate = useNavigate();
  const isMe = currentUser && member.user_id === currentUser.id;
  const displayName = member.user_name || member.display_name || 'Member';
  const role = member.role || 'Member';
  const joinedAgo = member.created_date
    ? formatDistanceToNow(parseISO(member.created_date), { addSuffix: true })
    : null;
  const isNew = member.created_date && new Date(member.created_date) > subDays(new Date(), 7);
  const isActive = member.last_active && new Date(member.last_active) > subDays(new Date(), 7);
  const isOnline = member.last_active && new Date(member.last_active) > new Date(Date.now() - 10 * 60 * 1000);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
      <div className="relative flex-shrink-0">
        <Avatar name={displayName} />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[14px] font-semibold text-slate-900 truncate">
            {displayName}
            {isMe && <span className="ml-1 text-[11px] text-slate-400 font-normal">(you)</span>}
          </p>
          {role !== 'Member' && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_CHIP[role] || ROLE_CHIP.Member}`}>
              {role === 'Admin' ? '👑' : role === 'Mod' ? '🛡️' : ''} {role}
            </span>
          )}
          {isNew && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">New</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {joinedAgo && <p className="text-[11px] text-slate-400">Joined {joinedAgo}</p>}
          {isActive && !isOnline && <span className="text-[10px] text-emerald-600 font-medium">● Active this week</span>}
          {isOnline && <span className="text-[10px] text-green-600 font-bold">● Online now</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isMe && currentUser && (
          <>
            <button
              onClick={() => navigate(`${createPageUrl('PublicProfile')}?id=${member.user_id}`)}
              className="h-8 px-3 rounded-full text-[12px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Profile
            </button>
            <button
              onClick={() => onMessage(member)}
              disabled={messagingId === member.user_id}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-60"
            >
              {messagingId === member.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function MembersListTab({ communityId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [messagingId, setMessagingId] = useState(null);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!communityId) return;
    setLoading(true);
    base44.entities.UserCommunity.filter({ community_id: communityId }, '-created_date', 200)
      .then(setMembers).catch(() => {}).finally(() => setLoading(false));
  }, [communityId]);

  const startConversation = async (member) => {
    if (!currentUser) { base44.auth.redirectToLogin(); return; }
    setMessagingId(member.user_id);
    try {
      const allConvs = await base44.entities.Conversation.list('-updated_date', 100);
      const existing = allConvs.find(c =>
        c.participant_ids?.includes(currentUser.id) &&
        c.participant_ids?.includes(member.user_id) &&
        c.participant_ids?.length === 2
      );
      if (existing) { navigate(`/Messages?conversation=${existing.id}`); return; }
      const conv = await base44.entities.Conversation.create({
        participant_ids: [currentUser.id, member.user_id],
        participant_names: [currentUser.full_name || 'You', member.user_name || 'Member'],
        last_message: null, unread_count: {}, request_type: 'general',
      });
      navigate(`/Messages?conversation=${conv.id}`);
    } catch { toast.error('Could not start conversation'); }
    setMessagingId(null);
  };

  const filtered = useMemo(() => {
    let list = members;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => (m.user_name || m.display_name || '').toLowerCase().includes(q));
    }
    if (segment === 'new') list = list.filter(m => m.created_date && new Date(m.created_date) > subDays(new Date(), 7));
    if (segment === 'active') list = list.filter(m => m.last_active && new Date(m.last_active) > subDays(new Date(), 7));
    if (segment === 'admins') list = list.filter(m => m.role === 'Admin' || m.role === 'Mod');
    return list;
  }, [members, search, segment]);

  const adminMembers = members.filter(m => m.role === 'Admin' || m.role === 'Mod');
  const newThisWeek = members.filter(m => m.created_date && new Date(m.created_date) > subDays(new Date(), 7));

  if (loading) {
    return (
      <div className="pt-4 space-y-2">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-100 rounded animate-pulse w-32" />
              <div className="h-2.5 bg-slate-100 rounded animate-pulse w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 pt-4">
        <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 text-[14px] font-medium">No members yet</p>
        <p className="text-slate-400 text-[12px] mt-1">Be the first to join!</p>
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-3 pb-8">
      {/* Stats chips */}
      <div className="flex gap-2">
        <div className="bg-blue-50 rounded-xl px-3 py-2 text-center flex-1">
          <div className="text-[18px] font-extrabold text-blue-700">{members.length}</div>
          <div className="text-[10px] text-blue-500 font-medium">Total</div>
        </div>
        {newThisWeek.length > 0 && (
          <div className="bg-green-50 rounded-xl px-3 py-2 text-center flex-1">
            <div className="text-[18px] font-extrabold text-green-700">+{newThisWeek.length}</div>
            <div className="text-[10px] text-green-500 font-medium">This week</div>
          </div>
        )}
        {adminMembers.length > 0 && (
          <div className="bg-amber-50 rounded-xl px-3 py-2 text-center flex-1">
            <div className="text-[18px] font-extrabold text-amber-700">{adminMembers.length}</div>
            <div className="text-[10px] text-amber-500 font-medium">Admins</div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members…"
          className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Segment carousel */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {SEGMENTS.map(seg => (
          <button
            key={seg.key}
            onClick={() => setSegment(seg.key)}
            className={`flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              segment === seg.key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {/* Member list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-[13px]">No members match your filter</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              currentUser={currentUser}
              onMessage={startConversation}
              messagingId={messagingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}