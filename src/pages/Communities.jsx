import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Plus, Search, ChevronRight, CheckCircle2, MapPin, Users, Globe, Star, BookOpen, Flame, Heart, Calendar, Coffee, Baby, UserCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProfileSetup from '@/components/profile/ProfileSetup';
import CommunityDetailView from '@/components/communities/CommunityDetailView';
import CommunityLogo from '@/components/communities/CommunityLogo';
import GroupCard from '@/components/groups/GroupCard';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import CreateCommunityModal from '@/components/communities/CreateCommunityModal';
import CommunityGroupPage from '@/components/communities/CommunityGroupPage';
import { toast } from 'sonner';

const TABS = ['My Communities', 'Schools', 'Shuls', 'Discover'];

const CATEGORY_CONFIG = {
  'Torah Learning': { emoji: '📚', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Shabbat':        { emoji: '🕯️', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Chesed':         { emoji: '🤝', color: 'bg-green-50 text-green-700 border-green-200' },
  'Events':         { emoji: '🎉', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Youth':          { emoji: '👦', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  'Families':       { emoji: '👨‍👩‍👧', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  'Seniors':        { emoji: '👴', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  'General':        { emoji: '💬', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const COMMUNITY_TYPE_FILTERS = ['All', 'Shul', 'School', 'Yeshiva', 'Seminary', 'Camp'];

export default function Communities() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('My Communities');
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [membershipSet, setMembershipSet] = useState(new Set());
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [search, setSearch] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const [typeFilter, setTypeFilter] = useState('All');
  const [createForm, setCreateForm] = useState({ name: '', description: '', category: 'General', location: '' });
  const [creating, setCreating] = useState(false);
  const [pendingRequestSet, setPendingRequestSet] = useState(new Set());
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      base44.entities.GroupMember.filter({ user_id: user.id }).then(memberships => {
        setMembershipSet(new Set(memberships.map(m => m.group_id)));
      });
      base44.entities.GroupJoinRequest.filter({ user_id: user.id, status: 'pending' }).then(reqs => {
        setPendingRequestSet(new Set(reqs.map(r => r.group_id)));
      });
    });
  }, []);

  const { data: allCommunities = [], isLoading: communitiesLoading } = useQuery({
    queryKey: ['communities-list'],
    queryFn: () => base44.entities.Community.list('-follower_count', 3000),
    enabled: !!currentUser,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: groups = [], refetch: refetchGroups } = useQuery({
    queryKey: ['community-groups'],
    queryFn: () => base44.entities.CommunityGroup.list('-created_date', 100),
    staleTime: 60000,
    enabled: !!currentUser,
  });

  const { data: userMemberships = [], isLoading: membershipsLoading, refetch: refetchMemberships } = useQuery({
    queryKey: ['user-communities', currentUser?.id],
    queryFn: () => base44.entities.UserCommunity.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const joinedIds = useMemo(() => new Set(userMemberships.map(m => m.community_id)), [userMemberships]);
  const joinedCommunities = useMemo(() => allCommunities.filter(c => joinedIds.has(c.id)), [allCommunities, joinedIds]);

  const filteredCommunities = useMemo(() => {
    let list = typeFilter === 'All' ? allCommunities : allCommunities.filter(c => c.type === typeFilter);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.neighborhood?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  }, [allCommunities, search, typeFilter]);

  const featuredCommunities = useMemo(() => allCommunities.filter(c => c.is_featured).slice(0, 5), [allCommunities]);
  const suggestedCommunities = useMemo(() => filteredCommunities.filter(c => !joinedIds.has(c.id)).slice(0, 20), [filteredCommunities, joinedIds]);
  const myGroups = useMemo(() => groups.filter(g => membershipSet.has(g.id)), [groups, membershipSet]);
  const suggestedGroups = useMemo(() => groups.filter(g => !membershipSet.has(g.id)).slice(0, 12), [groups, membershipSet]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
      </div>
    );
  }

  if (!currentUser.is_profile_complete) {
    return <ProfileSetup user={currentUser} onComplete={() => base44.auth.me().then(setCurrentUser)} />;
  }

  if (selectedCommunityId) {
    return (
      <CommunityDetailView
        communityId={selectedCommunityId}
        currentUser={currentUser}
        onBack={() => setSelectedCommunityId(null)}
      />
    );
  }

  if (selectedGroup) {
    return (
      <CommunityGroupPage
        group={selectedGroup}
        currentUser={currentUser}
        isMember={membershipSet.has(selectedGroup.id)}
        isPendingRequest={pendingRequestSet.has(selectedGroup.id)}
        onJoin={handleGroupJoin}
        onLeave={handleGroupLeave}
        onBack={() => setSelectedGroup(null)}
        onMemberApproved={(groupId) => {
          setMembershipSet(prev => new Set([...prev, groupId]));
          queryClient.invalidateQueries({ queryKey: ['community-groups'] });
        }}
      />
    );
  }

  const handleJoinChange = () => {
    refetchMemberships();
    queryClient.invalidateQueries({ queryKey: ['communities-list'] });
  };

  const handleJoin = async (e, community) => {
    e.stopPropagation();
    const isJoined = joinedIds.has(community.id);
    setJoiningId(community.id);
    try {
      if (isJoined) {
        const records = await base44.entities.UserCommunity.filter({ user_id: currentUser.id, community_id: community.id });
        if (records[0]) await base44.entities.UserCommunity.delete(records[0].id);
        await base44.entities.Community.update(community.id, { follower_count: Math.max(0, (community.follower_count || 0) - 1) });
        toast.success('Left community');
      } else {
        await base44.entities.UserCommunity.create({ user_id: currentUser.id, community_id: community.id, role: 'Member' });
        await base44.entities.Community.update(community.id, { follower_count: (community.follower_count || 0) + 1 });
        toast.success('Joined!');
      }
      handleJoinChange();
    } catch {
      toast.error('Something went wrong');
    }
    setJoiningId(null);
  };

  const handleGroupJoin = async (group) => {
    if (group.is_private) {
      // Check if already requested
      if (pendingRequestSet.has(group.id)) return;
      await base44.entities.GroupJoinRequest.create({
        group_id: group.id,
        group_name: group.name,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        status: 'pending',
      });
      setPendingRequestSet(prev => new Set([...prev, group.id]));
      toast.success('Request sent! Waiting for admin approval.');
    } else {
      await base44.entities.GroupMember.create({ group_id: group.id, user_id: currentUser.id, user_name: currentUser.full_name, role: 'member' });
      await base44.entities.CommunityGroup.update(group.id, { member_count: (group.member_count || 0) + 1 });
      setMembershipSet(prev => new Set([...prev, group.id]));
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      toast.success(`Joined ${group.name}!`);
    }
  };

  const handleGroupLeave = async (group) => {
    const memberships = await base44.entities.GroupMember.filter({ group_id: group.id, user_id: currentUser.id });
    if (memberships[0]) await base44.entities.GroupMember.delete(memberships[0].id);
    await base44.entities.CommunityGroup.update(group.id, { member_count: Math.max(0, (group.member_count || 1) - 1) });
    setMembershipSet(prev => { const s = new Set(prev); s.delete(group.id); return s; });
    queryClient.invalidateQueries({ queryKey: ['community-groups'] });
    toast.success(`Left ${group.name}`);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return toast.error('Community name is required');
    setCreating(true);
    try {
      await base44.entities.CommunityGroup.create({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        category: createForm.category,
        location: createForm.location.trim() || undefined,
        created_by_user_id: currentUser.id,
        created_by_name: currentUser.full_name,
        member_count: 1,
      });
      toast.success('Community created!');
      setCreateForm({ name: '', description: '', category: 'General', location: '' });
      refetchGroups();
      setActiveTab('Discover');
    } catch {
      toast.error('Something went wrong');
    }
    setCreating(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F7FB]">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-[20px] font-bold text-slate-900 leading-tight">Communities</h1>
              <p className="text-[12px] text-slate-400 mt-0.5">Discover Jewish communities worldwide</p>
            </div>
            <button
              onClick={() => setShowCreateCommunity(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold text-white"
              style={{ background: '#2563EB', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Create
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-0">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearch(''); setTypeFilter('All'); }}
                className={`flex-1 py-2.5 text-[12px] font-semibold transition-all border-b-2 ${
                  activeTab === tab
                    ? 'text-[#2563EB] border-[#2563EB]'
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto pb-28 scrollbar-hide">
        <div className="max-w-2xl mx-auto px-4 pt-4 space-y-5">

          {/* ══ Tab 1: My Communities ══ */}
          {activeTab === 'My Communities' && (
            <MyCommunititiesTab
              joinedCommunities={joinedCommunities}
              myGroups={myGroups}
              loading={communitiesLoading || membershipsLoading}
              onViewCommunity={setSelectedCommunityId}
              onViewGroup={setSelectedGroup}
              onDiscover={() => setActiveTab('Discover')}
            />
          )}

          {/* ══ Tab 2: Schools ══ */}
          {activeTab === 'Schools' && (
            <FilteredCommunitiesTab
              search={search}
              setSearch={setSearch}
              communities={allCommunities}
              typeFilter="School"
              joinedIds={joinedIds}
              joiningId={joiningId}
              loading={communitiesLoading}
              onJoin={handleJoin}
              onView={setSelectedCommunityId}
              emptyEmoji="🏫"
              emptyLabel="No schools listed yet"
            />
          )}

          {/* ══ Tab 3: Shuls ══ */}
          {activeTab === 'Shuls' && (
            <FilteredCommunitiesTab
              search={search}
              setSearch={setSearch}
              communities={allCommunities}
              typeFilter="Shul"
              joinedIds={joinedIds}
              joiningId={joiningId}
              loading={communitiesLoading}
              onJoin={handleJoin}
              onView={setSelectedCommunityId}
              emptyEmoji="🕍"
              emptyLabel="No shuls listed yet"
            />
          )}

          {/* ══ Tab 4: Discover ══ */}
          {activeTab === 'Discover' && (
            <DiscoverTab
              search={search}
              setSearch={setSearch}
              groups={groups}
              allCommunities={allCommunities}
              membershipSet={membershipSet}
              pendingRequestSet={pendingRequestSet}
              joinedIds={joinedIds}
              joiningId={joiningId}
              loading={communitiesLoading || membershipsLoading}
              onJoinGroup={handleGroupJoin}
              onLeaveGroup={handleGroupLeave}
              onViewGroup={setSelectedGroup}
              onJoinCommunity={handleJoin}
              onViewCommunity={setSelectedCommunityId}
            />
          )}

        </div>
      </div>

      <CreateGroupModal
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        currentUser={currentUser}
        onCreated={refetchGroups}
      />

      <CreateCommunityModal
        open={showCreateCommunity}
        onOpenChange={setShowCreateCommunity}
        currentUser={currentUser}
        onCreated={refetchGroups}
      />
    </div>
  );
}

/* ─── My Communities Tab ─── */
function MyCommunititiesTab({ joinedCommunities, myGroups, loading, onViewCommunity, onViewGroup, onDiscover }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3">
            <div className="skeleton w-11 h-11 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-36 rounded" />
              <div className="skeleton h-2.5 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (joinedCommunities.length === 0 && myGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-5">
          <Globe className="w-9 h-9 text-[#2563EB]" />
        </div>
        <h3 className="text-[16px] font-bold text-slate-800 mb-1.5">No communities yet</h3>
        <p className="text-[13px] text-slate-400 mb-6 max-w-xs">Find shuls, schools, and groups to be part of the Jewish community network.</p>
        <button
          onClick={onDiscover}
          className="text-[14px] font-semibold text-white px-6 py-2.5 rounded-full"
          style={{ background: '#2563EB' }}
        >
          Explore Communities
        </button>
      </div>
    );
  }

  return (
    <>
      {joinedCommunities.length > 0 && (
        <section>
          <SectionHeader title="My Shuls & Organizations" count={joinedCommunities.length} />
          <div className="space-y-2.5">
            {joinedCommunities.map(c => (
              <CommunityRow key={c.id} community={c} onClick={() => onViewCommunity(c.id)} />
            ))}
          </div>
        </section>
      )}

      {myGroups.length > 0 && (
        <section>
          <SectionHeader title="My Groups" count={myGroups.length} />
          <div className="space-y-2.5">
            {myGroups.map(g => (
              <GroupRow key={g.id} group={g} onClick={() => onViewGroup(g)} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ─── Filtered Communities Tab (Schools / Shuls) ─── */
function FilteredCommunitiesTab({ search, setSearch, communities, typeFilter, joinedIds, joiningId, loading, onJoin, onView, emptyEmoji, emptyLabel }) {
  const filtered = useMemo(() => {
    let list = communities.filter(c => c.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.neighborhood?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [communities, typeFilter, search]);

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${typeFilter.toLowerCase()}s…`}
          className="w-full pl-10 pr-4 py-3 text-[14px] bg-white border border-slate-200 rounded-[14px] outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400"
          style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
        />
      </div>

      <section>
        <SectionHeader title={search ? `Results for "${search}"` : `All ${typeFilter}s`} count={filtered.length} />
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-40 rounded" />
                  <div className="skeleton h-2.5 w-24 rounded" />
                </div>
                <div className="skeleton h-8 w-14 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="text-4xl mb-3">{emptyEmoji}</div>
            <p className="text-[13px] text-slate-400">{search ? `No results for "${search}"` : emptyLabel}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(c => {
              const CardComponent = typeFilter === 'School' ? SchoolCard : typeFilter === 'Shul' ? ShulCard : DiscoverCommunityCard;
              return (
                <CardComponent
                  key={c.id}
                  community={c}
                  joined={joinedIds.has(c.id)}
                  loading={joiningId === c.id}
                  onJoin={onJoin}
                  onView={onView}
                />
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

/* ─── Interest Group Card (Discover) ─── */
function InterestGroupCard({ group, isMember, isPending, onJoin, onLeave, onView }) {
  const cfg = CATEGORY_CONFIG[group.category] || CATEGORY_CONFIG['General'];

  const btnLabel = isMember ? 'Joined' : isPending ? '⏳ Pending' : group.is_private ? '🔒 Request' : 'Join';
  const btnStyle = isMember
    ? 'bg-slate-100 text-slate-600'
    : isPending
    ? 'bg-amber-50 text-amber-700'
    : 'text-white';

  return (
    <div
      onClick={() => onView(group)}
      className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-slate-50 flex items-center justify-center border border-slate-100 text-2xl flex-none">
        {cfg.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-bold text-slate-900 text-[15px] truncate">{group.name}</p>
          {group.is_private && <span className="text-[10px] text-slate-400">🔒</span>}
        </div>
        {group.description && (
          <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed mb-1.5">{group.description}</p>
        )}
        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
          <Users className="w-3 h-3" />
          {group.member_count || 0} members
        </span>
      </div>
      <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); if (!isPending) { isMember ? onLeave(group) : onJoin(group); } }}>
        <button
          className={`text-[13px] font-semibold h-8 px-3 rounded-full transition-colors ${btnStyle}`}
          style={!isMember && !isPending ? { background: '#16A34A' } : {}}
        >
          {btnLabel}
        </button>
      </div>
    </div>
  );
}

/* ─── Category config for discover ─── */
const DISCOVER_CATEGORIES = [
  { id: 'schools',    label: 'Schools',               emoji: '🏫', color: 'bg-indigo-50 border-indigo-100',   accent: '#4F46E5' },
  { id: 'shuls',      label: 'Shuls',                 emoji: '🕍', color: 'bg-amber-50 border-amber-100',     accent: '#D97706' },
  { id: 'cities',     label: 'Cities',                emoji: '🌆', color: 'bg-cyan-50 border-cyan-100',       accent: '#0891B2' },
  { id: 'travelers',  label: 'Travelers',             emoji: '✈️', color: 'bg-sky-50 border-sky-100',        accent: '#0284C7' },
  { id: 'interest',   label: 'Interest Groups',       emoji: '✨', color: 'bg-purple-50 border-purple-100',   accent: '#7C3AED' },
  { id: 'help',       label: 'Help Networks',         emoji: '🤝', color: 'bg-green-50 border-green-100',     accent: '#16A34A' },
];

const LOCATION_KEYWORDS = ['nyc', 'new york', 'miami', 'israel', 'france', 'brooklyn', 'manhattan', 'queens', 'bronx', 'jersey', 'chicago', 'los angeles', 'london', 'toronto', 'five towns', 'cedarhurst', 'lawrence', 'woodmere', 'hewlett', 'inwood'];
const HELP_KEYWORDS = ['help', 'chesed', 'bikur', 'charity', 'tzedakah', 'volunteer', 'meal', 'ride', 'errand'];
const EVENT_KEYWORDS = ['event', 'social', 'party', 'gathering', 'meetup', 'wedding', 'shabbat', 'holiday', 'yom tov'];

function categorizeGroup(group) {
  const text = `${group.name} ${group.description || ''} ${group.category || ''} ${group.location || ''}`.toLowerCase();
  if (LOCATION_KEYWORDS.some(k => text.includes(k))) return 'location';
  if (HELP_KEYWORDS.some(k => text.includes(k))) return 'help';
  if (EVENT_KEYWORDS.some(k => text.includes(k))) return 'events';
  return 'interest';
}

/* ─── Discover Tab ─── */
function DiscoverTab({ search, setSearch, groups, allCommunities, membershipSet, pendingRequestSet, joinedIds, joiningId, loading, onJoinGroup, onLeaveGroup, onViewGroup, onJoinCommunity, onViewCommunity }) {
  const [expandedCategories, setExpandedCategories] = useState({});

  const schools = useMemo(() => allCommunities.filter(c => c.type === 'School' || c.type === 'Yeshiva' || c.type === 'Seminary'), [allCommunities]);
  const shuls = useMemo(() => allCommunities.filter(c => c.type === 'Shul'), [allCommunities]);
  const locationGroups = useMemo(() => groups.filter(g => categorizeGroup(g) === 'location'), [groups]);
  const helpGroups = useMemo(() => groups.filter(g => categorizeGroup(g) === 'help'), [groups]);
  const eventGroups = useMemo(() => groups.filter(g => categorizeGroup(g) === 'events'), [groups]);
  const interestGroups = useMemo(() => groups.filter(g => !['location','help','events'].includes(categorizeGroup(g))), [groups]);

  const getCategoryItems = (id) => {
    switch(id) {
      case 'schools':  return schools;
      case 'shuls':    return shuls;
      case 'location': return locationGroups;
      case 'interest': return interestGroups;
      case 'help':     return helpGroups;
      case 'events':   return eventGroups;
      default: return [];
    }
  };

  const isCommunity = (id) => id === 'schools' || id === 'shuls';
  const PREVIEW_COUNT = 3;
  const toggleExpand = (id) => setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));

  // Search mode
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const matchedGroups = groups.filter(g => g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
    const matchedCommunities = allCommunities.filter(c => c.name?.toLowerCase().includes(q) || c.neighborhood?.toLowerCase().includes(q));
    return { groups: matchedGroups, communities: matchedCommunities };
  }, [search, groups, allCommunities]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-40 rounded" />
              <div className="skeleton h-2.5 w-56 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search all communities…"
          className="w-full pl-10 pr-4 py-3 text-[14px] bg-white border border-slate-200 rounded-[14px] outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400"
          style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
        />
      </div>

      {/* Search Results */}
      {searchResults ? (
        <div className="space-y-2.5">
          {searchResults.communities.length === 0 && searchResults.groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-[13px] text-slate-400">No communities match "{search}"</p>
            </div>
          ) : (
            <>
              {searchResults.communities.map(c => (
                <ShulCard key={c.id} community={c} joined={joinedIds.has(c.id)} loading={joiningId === c.id} onJoin={onJoinCommunity} onView={onViewCommunity} />
              ))}
              {searchResults.groups.map(g => (
                <InterestGroupCard key={g.id} group={g} isMember={membershipSet.has(g.id)} isPending={pendingRequestSet?.has(g.id)} onJoin={onJoinGroup} onLeave={onLeaveGroup} onView={onViewGroup} />
              ))}
            </>
          )}
        </div>
      ) : (
        /* Category Sections - always open, show 3 then "see more" */
        <div className="space-y-6">
          {DISCOVER_CATEGORIES.map(cat => {
            const allItems = getCategoryItems(cat.id);
            if (allItems.length === 0) return null;
            const isExpanded = expandedCategories[cat.id];
            const items = isExpanded ? allItems : allItems.slice(0, PREVIEW_COUNT);
            const useCommunity = isCommunity(cat.id);
            return (
              <section key={cat.id}>
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-xl">{cat.emoji}</span>
                  <h2 className="text-[16px] font-bold text-slate-900 flex-1">{cat.label}</h2>
                  <span className="text-[12px] text-slate-400 font-medium">{allItems.length}</span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {useCommunity ? (
                    items.map(c => (
                      <div
                        key={c.id}
                        onClick={() => onViewCommunity(c.id)}
                        className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
                        style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                      >
                        <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100" style={{ background: cat.accent + '15' }}>
                          {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-lg" style={{ color: cat.accent }}>{c.name?.charAt(0)}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[14px] text-slate-900 truncate">{c.name}</p>
                          <p className="text-[11px] text-slate-400">{c.neighborhood || c.address?.split(',')[0] || c.type}</p>
                        </div>
                        <div onClick={e => { e.stopPropagation(); onJoinCommunity(e, c); }}>
                          <button
                            className={`text-[12px] font-semibold h-7 px-3.5 rounded-full ${joinedIds.has(c.id) ? 'bg-slate-100 text-slate-600' : 'text-white'}`}
                            style={!joinedIds.has(c.id) ? { background: cat.accent } : {}}
                          >
                            {joiningId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : joinedIds.has(c.id) ? '✓ Joined' : 'Join'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    items.map(g => {
                      const isMem = membershipSet.has(g.id);
                      const isPending = pendingRequestSet?.has(g.id);
                      return (
                        <div
                          key={g.id}
                          onClick={() => onViewGroup(g)}
                          className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
                          style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                        >
                          <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-xl border border-slate-100" style={{ background: cat.accent + '15' }}>
                            {CATEGORY_CONFIG[g.category]?.emoji || '💬'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[14px] text-slate-900 truncate">{g.name}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{g.description || `${g.member_count || 0} members`}</p>
                          </div>
                          <div onClick={e => { e.stopPropagation(); if (!isPending) { isMem ? onLeaveGroup(g) : onJoinGroup(g); } }}>
                            <button
                              className={`text-[12px] font-semibold h-7 px-3.5 rounded-full ${isMem ? 'bg-slate-100 text-slate-600' : isPending ? 'bg-amber-50 text-amber-700' : 'text-white'}`}
                              style={!isMem && !isPending ? { background: cat.accent } : {}}
                            >
                              {isMem ? '✓ Joined' : isPending ? 'Pending' : 'Join'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Show more / less */}
                {allItems.length > PREVIEW_COUNT && (
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="mt-2 w-full py-2.5 text-[13px] font-semibold rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    {isExpanded ? 'Show less' : `See all ${allItems.length} →`}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Groups Tab ─── */
function GroupsTab({ myGroups, suggestedGroups, membershipSet, onJoin, onLeave, onView, onCreateNew }) {
  return (
    <>
      {/* Create CTA */}
      <button
        onClick={onCreateNew}
        className="w-full flex items-center gap-3 bg-white border border-dashed border-[#2563EB] rounded-2xl p-4 text-left transition-colors hover:bg-blue-50"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Plus className="w-5 h-5 text-[#2563EB]" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#2563EB]">Start a new group</p>
          <p className="text-[12px] text-slate-400">Torah study, Shabbat prep, chesed & more</p>
        </div>
      </button>

      {myGroups.length > 0 && (
        <section>
          <SectionHeader title="My Groups" count={myGroups.length} />
          <div className="grid grid-cols-2 gap-2.5">
            {myGroups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                isMember={true}
                onJoin={onJoin}
                onLeave={onLeave}
                onClick={() => onView(g)}
              />
            ))}
          </div>
        </section>
      )}

      {suggestedGroups.length > 0 && (
        <section>
          <SectionHeader title="Groups to Explore" count={suggestedGroups.length} />
          <div className="grid grid-cols-2 gap-2.5">
            {suggestedGroups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                isMember={false}
                onJoin={onJoin}
                onLeave={onLeave}
                onClick={() => onView(g)}
              />
            ))}
          </div>
        </section>
      )}

      {myGroups.length === 0 && suggestedGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="text-4xl mb-4">🤝</div>
          <p className="text-[14px] font-semibold text-slate-700">No groups yet</p>
          <p className="text-[12px] text-slate-400 mt-1">Be the first to create one!</p>
        </div>
      )}
    </>
  );
}

/* ─── Create Tab ─── */
function CreateTab({ form, setForm, onSubmit, creating }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <span className="text-xl">🏘️</span>
        <div>
          <p className="text-[13px] font-semibold text-blue-800">Starting a community group</p>
          <p className="text-[12px] text-blue-600 mt-0.5">Create a group for Torah learning, Shabbat prep, chesed projects, or any Jewish community interest.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div>
          <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Group Name *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Daf Yomi Study Group"
            className="w-full px-4 py-3 text-[14px] bg-slate-50 border border-slate-200 rounded-[12px] outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What is this group about? Who is it for?"
            rows={3}
            className="w-full px-4 py-3 text-[14px] bg-slate-50 border border-slate-200 rounded-[12px] outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400 resize-none"
          />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-slate-700 block mb-2">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-[10px] border text-left transition-all ${
                  form.category === cat
                    ? 'border-[#2563EB] bg-blue-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">{cfg.emoji}</span>
                <span className={`text-[12px] font-semibold ${form.category === cat ? 'text-[#2563EB]' : 'text-slate-600'}`}>{cat}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Location <span className="font-normal text-slate-400">(optional)</span></label>
          <input
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Cedarhurst, Five Towns"
            className="w-full px-4 py-3 text-[14px] bg-slate-50 border border-slate-200 rounded-[12px] outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={creating}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-white text-[14px] font-bold active:scale-[0.98] transition-all disabled:opacity-60"
        style={{ background: '#16A34A', boxShadow: '0 4px 12px rgba(22,163,74,0.25)' }}
      >
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {creating ? 'Creating…' : 'Create Group'}
      </button>
    </form>
  );
}

/* ─── Shared sub-components ─── */

function SectionHeader({ title, count }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
      {count !== undefined && count > 0 && (
        <span className="text-[12px] font-semibold text-slate-400">{count}</span>
      )}
    </div>
  );
}

function CommunityRow({ community, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-3.5 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-blue-50 flex items-center justify-center overflow-hidden border border-slate-100">
        {community.logo_url
          ? <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-blue-600 font-bold text-lg">{community.name?.charAt(0)}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-bold text-slate-900 text-[15px] truncate">{community.name}</p>
          {community.is_claimed && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
        </div>
        {(community.description_short || community.description_long) && (
          <p className="text-[12px] text-slate-500 line-clamp-2 mb-1.5 leading-relaxed">
            {community.description_short || community.description_long}
          </p>
        )}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <Users className="w-3 h-3" />
            {community.follower_count || 0} members
          </span>
          {(community.neighborhood || community.address) && (
            <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3" />
              {community.neighborhood || community.address?.split(',')[0]}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
    </div>
  );
}

function GroupRow({ group, onClick }) {
  const cfg = CATEGORY_CONFIG[group.category] || CATEGORY_CONFIG['General'];
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-3.5 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-slate-50 flex items-center justify-center border border-slate-100 text-2xl">
        {cfg.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-[15px] truncate mb-0.5">{group.name}</p>
        {group.description && (
          <p className="text-[12px] text-slate-500 line-clamp-2 mb-1.5 leading-relaxed">{group.description}</p>
        )}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <Users className="w-3 h-3" />
            {group.member_count || 0} members
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>{group.category}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
    </div>
  );
}

function FeaturedCard({ community, joined, loading, onJoin, onView }) {
  return (
    <div
      onClick={() => onView(community.id)}
      className="flex-shrink-0 w-44 bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <div className="h-20 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden">
        {community.cover_image_url
          ? <img src={community.cover_image_url} alt="" className="w-full h-full object-cover" />
          : community.logo_url
          ? <img src={community.logo_url} alt="" className="w-12 h-12 object-contain rounded-xl" />
          : <span className="text-white font-bold text-2xl">{community.name?.charAt(0)}</span>
        }
      </div>
      <div className="p-3">
        <p className="font-semibold text-slate-900 text-[12px] truncate">{community.name}</p>
        {community.neighborhood && (
          <p className="text-[10px] text-slate-400 truncate mt-0.5">{community.neighborhood}</p>
        )}
        <button
          onClick={e => { e.stopPropagation(); onJoin(e, community); }}
          disabled={loading}
          className={`mt-2 w-full text-[11px] font-semibold py-1.5 rounded-full transition-colors ${
            joined ? 'bg-slate-100 text-slate-600' : 'text-white'
          }`}
          style={!joined ? { background: '#2563EB' } : {}}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : joined ? 'Joined' : 'Follow'}
        </button>
      </div>
    </div>
  );
}

function ShulCard({ community, joined, loading, onJoin, onView }) {
  return (
    <div
      onClick={() => onView(community.id)}
      className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden border border-amber-100 bg-amber-50" style={{width:52,height:52}}>
        {community.logo_url
          ? <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-amber-600 font-bold text-xl">{community.name?.charAt(0)}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-bold text-slate-900 text-[15px] truncate">{community.name}</p>
          {community.is_claimed && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" title="Verified Shul" />}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {(community.neighborhood || community.address) && (
            <span className="flex items-center gap-0.5 text-[12px] text-slate-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {community.neighborhood || community.address?.split(',')[0]}
            </span>
          )}
          <span className="flex items-center gap-1 text-[12px] text-slate-400">
            <Users className="w-3.5 h-3.5" />
            {community.follower_count || 0} members
          </span>
        </div>
      </div>
      <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); onJoin(e, community); }}>
        <button
          disabled={loading}
          className={`text-[13px] font-semibold h-8 px-4 rounded-full transition-colors ${
            joined ? 'bg-slate-100 text-slate-600' : 'text-white'
          }`}
          style={!joined ? { background: '#D97706' } : {}}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : joined ? 'Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
}

function SchoolCard({ community, joined, loading, onJoin, onView }) {
  return (
    <div
      onClick={() => onView(community.id)}
      className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="w-13 h-13 rounded-xl flex-shrink-0 bg-indigo-50 flex items-center justify-center overflow-hidden border border-indigo-100" style={{width:52,height:52}}>
        {community.logo_url
          ? <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-indigo-600 font-bold text-xl">{community.name?.charAt(0)}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-bold text-slate-900 text-[15px] truncate">{community.name}</p>
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" title="Verified School" />
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[12px] text-slate-500 font-medium">
            <Users className="w-3.5 h-3.5" />
            {community.follower_count || 0} student members
          </span>
          {community.neighborhood && (
            <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3" />
              {community.neighborhood}
            </span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); onJoin(e, community); }}>
        <button
          disabled={loading}
          className={`text-[13px] font-semibold h-8 px-4 rounded-full transition-colors ${
            joined ? 'bg-slate-100 text-slate-600' : 'text-white'
          }`}
          style={!joined ? { background: '#2563EB' } : {}}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : joined ? 'Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
}

function DiscoverCommunityCard({ community, joined, loading, onJoin, onView }) {
  return (
    <div
      onClick={() => onView(community.id)}
      className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="flex-shrink-0">
        <CommunityLogo community={community} size="md" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-semibold text-slate-900 text-[14px] truncate">{community.name}</span>
          {community.is_claimed && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {community.type && (
            <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">{community.type}</span>
          )}
          {(community.neighborhood || community.address) && (
            <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[110px]">{community.neighborhood || community.address?.split(',')[0]}</span>
            </span>
          )}
        </div>
        {community.description_short && (
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{community.description_short}</p>
        )}
      </div>
      <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); onJoin(e, community); }}>
        <button
          disabled={loading}
          className={`text-[13px] font-semibold h-8 px-4 rounded-full transition-colors ${
            joined ? 'bg-slate-100 text-slate-600' : 'text-white'
          }`}
          style={!joined ? { background: '#16A34A' } : {}}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : joined ? 'Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
}