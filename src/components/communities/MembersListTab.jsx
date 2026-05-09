import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Users, MessageCircle, Search, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO, subDays, format } from 'date-fns';
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

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'name', label: 'Name A–Z' },
];

const SEGMENT_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: '🆕 New this week' },
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
  const joinedDate = member.created_date
    ? format(parseISO(member.created_date), 'MMM d, yyyy')
    : null;
  const isNew = member.created_date && new Date(member.created_date) > subDays(new Date(), 7);
  const isOnline = member.last_active && new Date(member.last_active) > new Date(Date.now() - 10 * 60 * 1000);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3.5 flex items-center gap-3 hover:border-blue-200 hover:shadow-sm transition-all">
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
              {role === 'Admin' ? '👑' : '🛡️'} {role}
            </span>
          )}
          {isNew && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">New</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {joinedAgo && (
            <p className="text-[11px] text-slate-400" title={joinedDate}>Joined {joinedAgo}</p>
          )}
          {isOnline && <span className="text-[10px] text-green-600 font-bold">● Online now</span>}
          {/* Sub-group badges */}
          {member._subgroups?.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {member._subgroups.slice(0, 2).map(sg => (
                <span key={sg.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold">
                  {sg.emoji || '👥'} {sg.name}
                </span>
              ))}
              {member._subgroups.length > 2 && (
                <span className="text-[10px] text-slate-400 font-medium">+{member._subgroups.length - 2} more</span>
              )}
            </div>
          )}
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
              {messagingId === member.user_id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <MessageCircle className="w-3.5 h-3.5" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function MembersListTab({ communityId }) {
  const [members, setMembers] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [sgMemberships, setSgMemberships] = useState([]); // SubGroupMember records
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const [messagingId, setMessagingId] = useState(null);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const [sortKey, setSortKey] = useState('newest');
  const [selectedSubgroup, setSelectedSubgroup] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!communityId) return;
    setLoading(true);
    Promise.all([
      dataService.entities.UserCommunity.filter({ community_id: communityId }, '-created_date', 200),
      dataService.entities.SubGroup.filter({ community_id: communityId, is_active: true }),
      dataService.entities.SubGroupMember.filter({ community_id: communityId, status: 'approved' }),
    ])
      .then(([mem, sg, sgm]) => {
        setMembers(mem);
        setSubgroups(sg);
        setSgMemberships(sgm);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [communityId]);

  // Annotate members with their sub-groups
  const membersWithSubgroups = useMemo(() => {
    const sgById = Object.fromEntries(subgroups.map(sg => [sg.id, sg]));
    const memberSgMap = {}; // user_id -> [subgroup objects]
    for (const sgm of sgMemberships) {
      if (!memberSgMap[sgm.user_id]) memberSgMap[sgm.user_id] = [];
      if (sgById[sgm.subgroup_id]) memberSgMap[sgm.user_id].push(sgById[sgm.subgroup_id]);
    }
    return members.map(m => ({ ...m, _subgroups: memberSgMap[m.user_id] || [] }));
  }, [members, subgroups, sgMemberships]);

  const filtered = useMemo(() => {
    let list = membersWithSubgroups;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => (m.user_name || m.display_name || '').toLowerCase().includes(q));
    }

    // Segment
    if (segment === 'new') list = list.filter(m => m.created_date && new Date(m.created_date) > subDays(new Date(), 7));
    if (segment === 'admins') list = list.filter(m => m.role === 'Admin' || m.role === 'Mod');

    // Sub-group filter
    if (selectedSubgroup !== 'all') {
      list = list.filter(m => m._subgroups.some(sg => sg.id === selectedSubgroup));
    }

    // Sort
    if (sortKey === 'newest') list = [...list].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    if (sortKey === 'oldest') list = [...list].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    if (sortKey === 'name') list = [...list].sort((a, b) => (a.user_name || '').localeCompare(b.user_name || ''));

    return list;
  }, [membersWithSubgroups, search, segment, selectedSubgroup, sortKey]);

  const startConversation = async (member) => {
    if (!currentUser) { dataService.auth.redirectToLogin(); return; }
    setMessagingId(member.user_id);
    try {
      const allConvs = await dataService.entities.Conversation.list('-updated_date', 100);
      const existing = allConvs.find(c =>
        c.participant_ids?.includes(currentUser.id) &&
        c.participant_ids?.includes(member.user_id) &&
        c.participant_ids?.length === 2
      );
      if (existing) { navigate(`/Messages?conversation=${existing.id}`); return; }
      const conv = await dataService.entities.Conversation.create({
        participant_ids: [currentUser.id, member.user_id],
        participant_names: [currentUser.full_name || 'You', member.user_name || 'Member'],
        last_message: null, unread_count: {}, request_type: 'general',
      });
      navigate(`/Messages?conversation=${conv.id}`);
    } catch { toast.error('Could not start conversation'); }
    setMessagingId(null);
  };

  const adminCount = members.filter(m => m.role === 'Admin' || m.role === 'Mod').length;
  const newCount = members.filter(m => m.created_date && new Date(m.created_date) > subDays(new Date(), 7)).length;
  const hasActiveFilters = search || segment !== 'all' || selectedSubgroup !== 'all' || sortKey !== 'newest';

  const clearAll = () => { setSearch(''); setSegment('all'); setSelectedSubgroup('all'); setSortKey('newest'); };

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
      {/* Stats row */}
      <div className="flex gap-2">
        <div className="bg-blue-50 rounded-xl px-3 py-2 text-center flex-1">
          <div className="text-[18px] font-extrabold text-blue-700">{members.length}</div>
          <div className="text-[10px] text-blue-500 font-medium">Total</div>
        </div>
        {newCount > 0 && (
          <div className="bg-green-50 rounded-xl px-3 py-2 text-center flex-1">
            <div className="text-[18px] font-extrabold text-green-700">+{newCount}</div>
            <div className="text-[10px] text-green-500 font-medium">This week</div>
          </div>
        )}
        {adminCount > 0 && (
          <div className="bg-amber-50 rounded-xl px-3 py-2 text-center flex-1">
            <div className="text-[18px] font-extrabold text-amber-700">{adminCount}</div>
            <div className="text-[10px] text-amber-500 font-medium">Admins</div>
          </div>
        )}
        {subgroups.length > 0 && (
          <div className="bg-indigo-50 rounded-xl px-3 py-2 text-center flex-1">
            <div className="text-[18px] font-extrabold text-indigo-700">{subgroups.length}</div>
            <div className="text-[10px] text-indigo-500 font-medium">Sub-groups</div>
          </div>
        )}
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members by name…"
            className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[13px] font-semibold transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          Filters
          {hasActiveFilters && !showFilters && (
            <span className="w-2 h-2 rounded-full bg-white/80 ml-0.5" />
          )}
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          {/* Segment */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Filter</p>
            <div className="flex gap-1.5 flex-wrap">
              {SEGMENT_OPTIONS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSegment(s.key)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                    segment === s.key
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-group filter */}
          {subgroups.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Sub-group</p>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedSubgroup('all')}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                    selectedSubgroup === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  All groups
                </button>
                {subgroups.map(sg => (
                  <button
                    key={sg.id}
                    onClick={() => setSelectedSubgroup(sg.id)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                      selectedSubgroup === sg.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {sg.emoji || '👥'} {sg.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Sort by join date</p>
            <div className="flex gap-1.5 flex-wrap">
              {SORT_OPTIONS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortKey(s.key)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                    sortKey === s.key
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={clearAll} className="text-[12px] font-semibold text-red-500 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Result count */}
      {hasActiveFilters && (
        <p className="text-[12px] text-slate-500 font-medium">
          Showing {filtered.length} of {members.length} members
        </p>
      )}

      {/* Member list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-[13px]">
          <p>No members match your filters.</p>
          <button onClick={clearAll} className="text-blue-600 font-semibold mt-2 text-[13px]">Clear filters</button>
        </div>
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