import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Loader2, Plus, Search, ChevronRight, CheckCircle2, MapPin, Users, Globe, Star, BookOpen, Flame, Heart, Calendar, Coffee, Baby, UserCheck, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import ProfileSetup from '@/components/profile/ProfileSetup';
import CommunityDetailView from '@/components/communities/CommunityDetailView';
import CommunityLogo from '@/components/communities/CommunityLogo';
import GroupCard from '@/components/groups/GroupCard';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import CreateCommunityModal from '@/components/communities/CreateCommunityModal';
import CommunityGroupPage from '@/components/communities/CommunityGroupPage';
import ShulCommunityPage from '@/components/shul/ShulCommunityPage';
import { toast } from 'sonner';

const TABS = ['My Communities', 'Discover'];

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

const FEATURED_SHULS = [
  "Young Israel Woodmere",
  "Chabad of Woodmere",
  "Beth Shalom",
  "Shaaray Tefila"
];

export default function Communities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('My Communities');
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
  const [detailError, setDetailError] = useState(null);
  const [queriesReady, setQueriesReady] = useState(false);
  const [membershipsReady, setMembershipsReady] = useState(false);
  const queryClient = useQueryClient();

  const selectedCommunityId = searchParams.get('communityId') || null;

  const AUTO_JOIN_NAMES = ['Five Towns Alerts', 'Mitzvah Map Volunteers', 'Young Israel Woodmere Members', 'Pickup Basketball', 'Young Adults Hangouts', 'Daf Yomi Chat'];

  const FALLBACK_AUTO_JOIN = ['Five Towns Alerts', 'Mitzvah Map Volunteers', 'Young Israel Woodmere Members', 'Pickup Basketball', 'Daf Yomi Chat'];
  const MIN_COMMUNITIES = 3;

  useEffect(() => {
    base44.auth.me().then(async user => {
      setCurrentUser(user);

      // Load memberships first (immediate), then enable community queries after
      const memberships = await base44.entities.GroupMember.filter({ user_id: user.id });
      const joinedGroupIds = new Set(memberships.map(m => m.group_id));
      setMembershipSet(joinedGroupIds);
      setMembershipsReady(true);

      // Defer community/group queries to avoid burst with Feed queries
      setTimeout(() => setQueriesReady(true), 1500);

      // Defer pending requests further
      setTimeout(async () => {
        const reqs = await base44.entities.GroupJoinRequest.filter({ user_id: user.id, status: 'pending' });
        setPendingRequestSet(new Set(reqs.map(r => r.group_id)));
      }, 3000);

      // Auto-join: only once per session and only if user has few communities
      const autoJoinKey = `auto_joined_${user.id}`;
      if (sessionStorage.getItem(autoJoinKey)) return;
      if (joinedGroupIds.size >= MIN_COMMUNITIES) {
        sessionStorage.setItem(autoJoinKey, '1');
        return;
      }
      sessionStorage.setItem(autoJoinKey, '1');

      // Delay auto-join to avoid rate limit burst on page load
      setTimeout(async () => {
        const allGroups = await base44.entities.CommunityGroup.list();
        const groupsToJoin = allGroups.filter(g =>
          (AUTO_JOIN_NAMES.includes(g.name) || FALLBACK_AUTO_JOIN.includes(g.name)) &&
          !joinedGroupIds.has(g.id)
        ).slice(0, 4);

        for (const g of groupsToJoin) {
          await base44.entities.GroupMember.create({ group_id: g.id, user_id: user.id, user_name: user.full_name, role: 'member' });
          joinedGroupIds.add(g.id);
        }
        if (groupsToJoin.length > 0) {
          setMembershipSet(new Set(joinedGroupIds));
        }
      }, 3000);
    });
  }, []);

  const retryWithBackoff = (failureCount, error) => {
    if (error?.message?.includes('429') || error?.status === 429) {
      return failureCount < 2; // 2 retries for rate limit
    }
    return false;
  };

  const retryDelay = (attempt) => Math.min(2000 * 2 ** attempt, 10000);

  const { data: userMemberships = [], isLoading: membershipsLoading, refetch: refetchMemberships } = useQuery({
    queryKey: ['user-communities', currentUser?.id],
    queryFn: () => base44.entities.UserCommunity.filter({ user_id: currentUser.id }),
    enabled: !!currentUser && membershipsReady,
    staleTime: Infinity,
    gcTime: 7200000,
    refetchOnWindowFocus: false,
    retry: retryWithBackoff,
    retryDelay,
    placeholderData: keepPreviousData,
  });

  const { data: allCommunities = [], isLoading: communitiesLoading, isError: communitiesError, error: communitiesQueryError } = useQuery({
    queryKey: ['communities-list'],
    queryFn: () => base44.entities.Community.list('-follower_count', 100),
    enabled: !!currentUser && queriesReady,
    staleTime: Infinity,
    gcTime: 7200000,
    refetchOnWindowFocus: false,
    retry: retryWithBackoff,
    retryDelay,
    placeholderData: keepPreviousData,
  });

  const { data: groups = [], refetch: refetchGroups } = useQuery({
    queryKey: ['community-groups'],
    queryFn: () => base44.entities.CommunityGroup.list('-created_date', 50),
    staleTime: Infinity,
    gcTime: 7200000,
    enabled: !!currentUser && queriesReady,
    retry: retryWithBackoff,
    retryDelay,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['community-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 100),
    staleTime: Infinity,
    gcTime: 7200000,
    enabled: !!currentUser && queriesReady,
    retry: retryWithBackoff,
    retryDelay,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const isRateLimited = communitiesError && (communitiesQueryError?.message?.includes('429') || String(communitiesQueryError).includes('429'));

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
  
  const trendingCommunities = useMemo(() => {
    const postCounts = {};
    posts.forEach(p => {
      postCounts[p.community_id] = (postCounts[p.community_id] || 0) + 1;
    });
    
    return [...allCommunities]
      .map(c => ({
        ...c,
        postCount: postCounts[c.id] || 0,
        activityScore: (postCounts[c.id] || 0) * 3 + (c.follower_count || 0),
      }))
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 6);
  }, [allCommunities, posts]);

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

  const handleViewCommunity = (id) => {
    if (!id) return;
    setDetailError(null);
    setSearchParams({ communityId: String(id) });
  };

  const handleBackFromDetail = () => {
    setDetailError(null);
    setSearchParams({});
  };

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

  if (selectedCommunityId) {
    const selectedCommunity = allCommunities.find(c => c.id === selectedCommunityId);

    if (detailError) {
      return (
        <div className="flex flex-col h-full bg-[#F5F7FB]">
          <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-3">
            <button onClick={handleBackFromDetail} className="text-[#2563EB] font-semibold text-[14px]">← Back</button>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl border border-red-100 p-6 text-center max-w-sm">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-800 mb-1">Could not load community</p>
              <p className="text-[13px] text-slate-500 mb-4">{detailError}</p>
              <button onClick={handleBackFromDetail} className="px-4 py-2 rounded-full text-white text-[13px] font-semibold" style={{ background: '#2563EB' }}>Go Back</button>
            </div>
          </div>
        </div>
      );
    }

    if (!selectedCommunity && communitiesLoading) {
      return (
        <div className="flex flex-col h-full bg-[#F5F7FB]">
          <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-3">
            <button onClick={handleBackFromDetail} className="text-[#2563EB] font-semibold text-[14px]">← Back</button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
          </div>
        </div>
      );
    }

    if (!selectedCommunity && !communitiesLoading) {
      // Community not found — clear the param and fall through to show communities list
      // Use setTimeout to avoid setState-during-render
      setTimeout(() => handleBackFromDetail(), 0);
      return null;
    }

    const isFeaturedShul = selectedCommunity && FEATURED_SHULS.some(name =>
      selectedCommunity.name?.toLowerCase().includes(name.toLowerCase())
    );

    if (isFeaturedShul && selectedCommunity.type === 'Shul') {
      return (
        <ShulCommunityPage
          community={selectedCommunity}
          currentUser={currentUser}
          onBack={handleBackFromDetail}
        />
      );
    }

    return (
      <CommunityDetailView
        communityId={selectedCommunityId}
        currentUser={currentUser}
        onBack={handleBackFromDetail}
      />
    );
  }

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
            <MyCommunitiesTab
              joinedCommunities={joinedCommunities}
              myGroups={myGroups}
              allGroups={groups}
              loading={communitiesLoading || membershipsLoading}
              onViewCommunity={handleViewCommunity}
              onViewGroup={setSelectedGroup}
              onDiscover={() => setActiveTab('Discover')}
              onAutoJoin={handleGroupJoin}
            />
          )}

          {/* ══ Tab 2: Discover ══ */}
          {activeTab === 'Discover' && (
            <DiscoverTab
              search={search}
              setSearch={setSearch}
              groups={groups}
              allCommunities={allCommunities}
              trendingCommunities={trendingCommunities}
              membershipSet={membershipSet}
              pendingRequestSet={pendingRequestSet}
              joinedIds={joinedIds}
              joiningId={joiningId}
              loading={communitiesLoading || membershipsLoading}
              onJoinGroup={handleGroupJoin}
              onLeaveGroup={handleGroupLeave}
              onViewGroup={setSelectedGroup}
              onJoinCommunity={handleJoin}
              onViewCommunity={handleViewCommunity}
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
function MyCommunitiesTab({ joinedCommunities, myGroups, loading, onViewCommunity, onViewGroup, onDiscover, allGroups, onAutoJoin }) {
  const EXPLORE_CATEGORIES = [
    { label: 'Local',        emoji: '📍', filter: g => g.category === 'Local Life' || g.category === 'Local' },
    { label: 'Chessed',      emoji: '❤️', filter: g => g.category === 'Chessed' },
    { label: 'Social',       emoji: '🏀', filter: g => g.category === 'Social' },
    { label: 'Learning',     emoji: '📚', filter: g => g.category === 'Learning' },
    { label: 'Institutions', emoji: '🏛️', filter: g => g.category === 'Institutional' || g.subcategory === 'School' || g.subcategory === 'Shul' || g.subcategory === 'Camp' },
  ];

  // Trending: sort by activityScore = likes + comments * 2 (using post_count + member_count as proxy)
  const activityScore = (g) => (g.post_count || 0) + (g.member_count || 0) * 2;
  const trending = useMemo(() => [...(allGroups || [])].sort((a, b) => activityScore(b) - activityScore(a)).slice(0, 5), [allGroups]);

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

  return (
    <div className="space-y-5">

      {/* 🔥 Trending Now — horizontal scroll */}
      {trending.length > 0 && (
        <section>
          <SectionHeader title="🔥 Trending Now" />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {trending.map(g => (
              <TrendingGroupCard key={g.id} group={g} onClick={() => onViewGroup(g)} />
            ))}
          </div>
        </section>
      )}

      {/* Your Communities */}
      {(joinedCommunities.length > 0 || myGroups.length > 0) ? (
        <section>
          <SectionHeader title="Your Communities" count={joinedCommunities.length + myGroups.length} />
          <div className="space-y-2.5">
            {joinedCommunities.map(c => (
              <CommunityRow key={c.id} community={c} onClick={() => onViewCommunity(c.id)} />
            ))}
            {myGroups.map(g => (
              <GroupRowRich key={g.id} group={g} onClick={() => onViewGroup(g)} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyMyCommunitiesState allGroups={allGroups} onAutoJoin={onAutoJoin} onDiscover={onDiscover} />
      )}

      {/* Explore Categories grid */}
      <section>
        <SectionHeader title="Explore Communities" />
        <div className="grid grid-cols-3 gap-2.5">
          {EXPLORE_CATEGORIES.map(cat => {
            const count = (allGroups || []).filter(cat.filter).length;
            return (
              <button
                key={cat.label}
                onClick={onDiscover}
                className="bg-white rounded-2xl border border-slate-100 p-3.5 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-transform"
                style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[12px] font-bold text-slate-800">{cat.label}</span>
                {count > 0 && <span className="text-[10px] text-slate-400">{count} groups</span>}
              </button>
            );
          })}
        </div>
      </section>

    </div>
  );
}

/* ─── Empty My Communities state with auto-join suggestions ─── */
function EmptyMyCommunitiesState({ allGroups, onAutoJoin, onDiscover }) {
  const AUTO_JOIN_NAMES = ['Five Towns Alerts', 'Mitzvah Map Volunteers', 'Young Israel Woodmere Members', 'Pickup Basketball', 'Young Adults Hangouts', 'Daf Yomi Chat'];
  const suggested = (allGroups || []).filter(g => AUTO_JOIN_NAMES.includes(g.name)).slice(0, 4);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoinAll = async () => {
    setJoining(true);
    await Promise.allSettled(suggested.map(g => onAutoJoin(g)));
    setJoining(false);
    setJoined(true);
  };

  return (
    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
      <div className="text-center mb-4">
        <Globe className="w-8 h-8 text-blue-400 mx-auto mb-2" />
        <p className="font-semibold text-slate-800 text-[14px] mb-1">No communities yet</p>
        <p className="text-[12px] text-slate-500">Join some popular groups to get started</p>
      </div>
      {suggested.length > 0 && !joined && (
        <div className="space-y-2 mb-3">
          {suggested.map(g => {
            const cfg = CATEGORY_CONFIG[g.category] || CATEGORY_CONFIG['General'];
            return (
              <div key={g.id} className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-2.5 border border-slate-100">
                <span className="text-lg">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px] text-slate-800 truncate">{g.name}</p>
                  <p className="text-[11px] text-slate-400">{g.member_count || 0} members</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {joined ? (
        <p className="text-center text-[13px] font-semibold text-green-600 mb-2">✓ Joined! Scroll up to see your communities.</p>
      ) : (
        <button
          onClick={handleJoinAll}
          disabled={joining || suggested.length === 0}
          className="w-full py-2.5 rounded-full text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: '#2563EB' }}
        >
          {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : `Join ${suggested.length} suggested groups`}
        </button>
      )}
      <button onClick={onDiscover} className="w-full mt-2 py-2 text-[12px] font-semibold text-slate-500">
        Browse all communities →
      </button>
    </div>
  );
}

/* ─── Trending group card (horizontal) ─── */
function TrendingGroupCard({ group, onClick }) {
  const cfg = CATEGORY_CONFIG[group.category] || CATEGORY_CONFIG['General'];
  const score = (group.post_count || 0) + (group.member_count || 0) * 2;
  const isTrending = score > 20;
  const isChessed = group.category === 'Chessed';
  const isRecentlyActive = group.post_count > 0;

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-36 bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <div className="h-16 flex items-center justify-center text-3xl relative" style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' }}>
        {cfg.emoji}
        {isTrending && (
          <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white">🔥</span>
        )}
      </div>
      <div className="p-2.5">
        <p className="font-bold text-slate-900 text-[12px] leading-tight line-clamp-2 mb-1">{group.name}</p>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-slate-400">{group.member_count || 0} members</span>
          {isChessed && <span className="text-[10px] font-bold text-red-400">❤️</span>}
          {isRecentlyActive && !isTrending && <span className="text-[10px] font-bold text-green-500">🟢</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── Rich group row for My Communities ─── */
function GroupRowRich({ group, onClick }) {
  const cfg = CATEGORY_CONFIG[group.category] || CATEGORY_CONFIG['General'];
  const score = (group.post_count || 0) + (group.member_count || 0) * 2;
  const isTrending = score > 20;
  const isChessed = group.category === 'Chessed';
  const hasRecentPosts = group.post_count > 0;

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
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <p className="font-bold text-slate-900 text-[14px] truncate">{group.name}</p>
          {isTrending && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-200">🔥 Trending</span>}
          {hasRecentPosts && !isTrending && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">🟢 Active</span>}
          {isChessed && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">❤️ Help Needed</span>}
        </div>
        {group.description && (
          <p className="text-[11px] text-slate-500 line-clamp-1 mb-1">{group.description}</p>
        )}
        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
          <Users className="w-3 h-3" />
          {group.member_count || 0} members
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
    </div>
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
  { id: 'local',        label: 'Local',        emoji: '📍', accent: '#2563EB',  isCommunity: false },
  { id: 'chessed',      label: 'Chessed',      emoji: '❤️', accent: '#16A34A',  isCommunity: false },
  { id: 'social',       label: 'Social',       emoji: '🏀', accent: '#7C3AED',  isCommunity: false },
  { id: 'learning',     label: 'Learning',     emoji: '📚', accent: '#D97706',  isCommunity: false },
  { id: 'institutions', label: 'Institutions', emoji: '🏛️', accent: '#4F46E5', isCommunity: true  },
];



const LOCATION_KEYWORDS = ['nyc', 'new york', 'miami', 'israel', 'france', 'brooklyn', 'manhattan', 'queens', 'bronx', 'jersey', 'chicago', 'los angeles', 'london', 'toronto', 'five towns', 'cedarhurst', 'lawrence', 'woodmere', 'hewlett', 'inwood', 'city', 'neighborhood', 'community', 'city guide'];
const TRAVELERS_KEYWORDS = ['travel', 'trip', 'backpack', 'hostel', 'digital nomad', 'abroad', 'expat', 'diaspora', 'aliyah', 'visitor', 'tourist'];
const HELP_KEYWORDS = ['help', 'chesed', 'bikur', 'charity', 'tzedakah', 'volunteer', 'meal', 'ride', 'errand'];
const INTEREST_KEYWORDS = ['hobby', 'sports', 'games', 'music', 'art', 'tech', 'book', 'career', 'business', 'dating', 'parents', 'singles', 'alumni'];

function categorizeGroup(group) {
  const text = `${group.name} ${group.description || ''} ${group.category || ''} ${group.location || ''}`.toLowerCase();
  if (TRAVELERS_KEYWORDS.some(k => text.includes(k))) return 'travelers';
  if (LOCATION_KEYWORDS.some(k => text.includes(k))) return 'cities';
  if (HELP_KEYWORDS.some(k => text.includes(k))) return 'help';
  if (INTEREST_KEYWORDS.some(k => text.includes(k))) return 'interest';
  return 'interest';
}

/* ─── Discover Tab ─── */
function DiscoverTab({ search, setSearch, groups, allCommunities, trendingCommunities, membershipSet, pendingRequestSet, joinedIds, joiningId, loading, onJoinGroup, onLeaveGroup, onViewGroup, onJoinCommunity, onViewCommunity }) {
  const [expandedCategories, setExpandedCategories] = useState({});

  const institutions = useMemo(() => allCommunities.filter(c => ['School', 'Yeshiva', 'Seminary', 'Camp', 'Shul', 'Other'].includes(c.type)), [allCommunities]);
  const localGroups    = useMemo(() => groups.filter(g => g.category === 'Local Life' || g.category === 'Local'), [groups]);
  const chessedGroups  = useMemo(() => groups.filter(g => g.category === 'Chessed'), [groups]);
  const socialGroups   = useMemo(() => groups.filter(g => g.category === 'Social'), [groups]);
  const learningGroups = useMemo(() => groups.filter(g => g.category === 'Learning'), [groups]);

  const getCategoryItems = (id) => {
    switch(id) {
      case 'local':        return localGroups;
      case 'chessed':      return chessedGroups;
      case 'social':       return socialGroups;
      case 'learning':     return learningGroups;
      case 'institutions': return institutions;
      default: return [];
    }
  };

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

  const featuredShuls = useMemo(() => institutions.filter(s => s.type === 'Shul' && FEATURED_SHULS.some(name => s.name?.toLowerCase().includes(name.toLowerCase()))), [institutions]);

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
        <div className="space-y-6">
           {/* Featured Shuls - Five Towns */}
           {featuredShuls.length > 0 && (
             <section>
               <div className="flex items-center gap-2 mb-3">
                 <span className="text-xl">⭐</span>
                 <h2 className="text-[16px] font-bold text-slate-900 flex-1">Featured Shuls</h2>
                 <span className="text-[12px] text-slate-400 font-medium">{featuredShuls.length}</span>
               </div>
               <div className="space-y-2.5">
                 {featuredShuls.map(c => (
                   <div key={c.id} onClick={() => onViewCommunity(c.id)} className="cursor-pointer">
                     <ShulCard
                       community={c}
                       joined={joinedIds.has(c.id)}
                       loading={joiningId === c.id}
                       onJoin={onJoinCommunity}
                       onView={onViewCommunity}
                     />
                   </div>
                 ))}
               </div>
             </section>
           )}

           {/* Trending Communities */}
           {trendingCommunities.length > 0 && (
             <section>
               <div className="flex items-center gap-2 mb-3">
                 <span className="text-xl">🔥</span>
                 <h2 className="text-[16px] font-bold text-slate-900 flex-1">Trending Communities</h2>
               </div>
               <div className="space-y-2.5">
                 {trendingCommunities.map((c, idx) => (
                   <div
                     key={c.id}
                     onClick={() => onViewCommunity(c.id)}
                     className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
                     style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                   >
                     <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: '#FF6B6B15', color: '#FF6B6B' }}>
                       #{idx + 1}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-semibold text-[14px] text-slate-900 truncate">{c.name}</p>
                       <p className="text-[12px] text-slate-400">{c.follower_count || 0} members</p>
                     </div>
                     <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); onJoinCommunity(e, c); }}>
                       <button
                         className={`text-[12px] font-semibold h-7 px-3.5 rounded-full ${joinedIds.has(c.id) ? 'bg-slate-100 text-slate-600' : 'text-white'}`}
                         style={!joinedIds.has(c.id) ? { background: '#2563EB' } : {}}
                       >
                         {joiningId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : joinedIds.has(c.id) ? '✓ Joined' : 'Join'}
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             </section>
           )}

           {DISCOVER_CATEGORIES.map(cat => {
            const allItems = getCategoryItems(cat.id);
            if (allItems.length === 0) return null;
            const isExpanded = expandedCategories[cat.id];
            const items = isExpanded ? allItems : allItems.slice(0, PREVIEW_COUNT);
            const useCommunity = cat.isCommunity;
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
        <p className="font-bold text-slate-900 text-[15px] truncate mb-1">{community.name}</p>
        <div className="flex items-center gap-3 flex-wrap">
          {(community.neighborhood || community.address) && (
            <span className="flex items-center gap-0.5 text-[13px] text-slate-500 font-medium">
              <MapPin className="w-4 h-4" />
              {community.neighborhood || community.address?.split(',')[0]}
            </span>
          )}
          <span className="flex items-center gap-1 text-[13px] text-slate-500 font-medium">
            <Users className="w-4 h-4" />
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
        <p className="font-bold text-slate-900 text-[15px] truncate mb-1">{community.name}</p>
        <span className="flex items-center gap-1 text-[13px] text-slate-500 font-medium">
          <Users className="w-4 h-4" />
          {community.follower_count || 0} student members
        </span>
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

/* ─── Global Search Results ─── */
function GlobalSearchResults({ search, communities, groups, joinedIds, membershipSet, pendingRequestSet, joiningId, loading, onJoinCommunity, onViewCommunity, onJoinGroup, onLeaveGroup, onViewGroup }) {
  const hasResults = communities.length > 0 || groups.length > 0;

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-[13px] text-slate-400">No communities found for "{search}"</p>
        <p className="text-[11px] text-slate-300 mt-1">Try searching by name, city, or topic</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {communities.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏢</span>
            <h2 className="text-[15px] font-bold text-slate-900">Communities</h2>
            <span className="text-[12px] text-slate-400 font-medium ml-auto">{communities.length}</span>
          </div>
          <div className="space-y-2.5">
            {communities.map(c => (
              <DiscoverCommunityCard
                key={c.id}
                community={c}
                joined={joinedIds.has(c.id)}
                loading={joiningId === c.id}
                onJoin={onJoinCommunity}
                onView={onViewCommunity}
              />
            ))}
          </div>
        </section>
      )}

      {groups.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✨</span>
            <h2 className="text-[15px] font-bold text-slate-900">Groups</h2>
            <span className="text-[12px] text-slate-400 font-medium ml-auto">{groups.length}</span>
          </div>
          <div className="space-y-2.5">
            {groups.map(g => (
              <InterestGroupCard
                key={g.id}
                group={g}
                isMember={membershipSet.has(g.id)}
                isPending={pendingRequestSet?.has(g.id)}
                onJoin={onJoinGroup}
                onLeave={onLeaveGroup}
                onView={onViewGroup}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}