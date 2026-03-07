import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Plus, Search, ChevronRight, CheckCircle2, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProfileSetup from '@/components/profile/ProfileSetup';
import CommunityDetailView from '@/components/communities/CommunityDetailView';
import CommunityLogo from '@/components/communities/CommunityLogo';
import GroupCard from '@/components/groups/GroupCard';
import GroupDetailSheet from '@/components/groups/GroupDetailSheet';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import { toast } from 'sonner';

export default function Communities() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [membershipSet, setMembershipSet] = useState(new Set());
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [search, setSearch] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      base44.entities.GroupMember.filter({ user_id: user.id }).then(memberships => {
        setMembershipSet(new Set(memberships.map(m => m.group_id)));
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

  const communities = allCommunities.filter(c => c.type === 'Shul');

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
  const joinedCommunities = useMemo(() => communities.filter(c => joinedIds.has(c.id)), [communities, joinedIds]);

  const filteredCommunities = useMemo(() => {
    if (!search.trim()) return communities;
    const q = search.toLowerCase();
    return communities.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.neighborhood?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  }, [communities, search]);

  const suggestedCommunities = useMemo(() => filteredCommunities.filter(c => !joinedIds.has(c.id)).slice(0, 10), [filteredCommunities, joinedIds]);
  const myGroups = useMemo(() => groups.filter(g => membershipSet.has(g.id)), [groups, membershipSet]);
  const suggestedGroups = useMemo(() => groups.filter(g => !membershipSet.has(g.id)).slice(0, 6), [groups, membershipSet]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    await base44.entities.GroupMember.create({ group_id: group.id, user_id: currentUser.id, user_name: currentUser.full_name, role: 'member' });
    await base44.entities.CommunityGroup.update(group.id, { member_count: (group.member_count || 0) + 1 });
    setMembershipSet(prev => new Set([...prev, group.id]));
    queryClient.invalidateQueries({ queryKey: ['community-groups'] });
    toast.success(`Joined ${group.name}!`);
  };

  const handleGroupLeave = async (group) => {
    const memberships = await base44.entities.GroupMember.filter({ group_id: group.id, user_id: currentUser.id });
    if (memberships[0]) await base44.entities.GroupMember.delete(memberships[0].id);
    await base44.entities.CommunityGroup.update(group.id, { member_count: Math.max(0, (group.member_count || 1) - 1) });
    setMembershipSet(prev => { const s = new Set(prev); s.delete(group.id); return s; });
    queryClient.invalidateQueries({ queryKey: ['community-groups'] });
    toast.success(`Left ${group.name}`);
  };



  return (
    <div className="flex flex-col h-full bg-[#F8FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center">
          <span className="font-bold text-slate-900 text-base">Communities</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-2xl mx-auto px-4 pt-4 space-y-5">

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search communities…"
              className="w-full pl-10 pr-4 py-3 text-[14px] bg-white border border-slate-200 rounded-[14px] outline-none focus:border-[#2563EB] transition-colors placeholder:text-slate-400"
              style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
            />
          </div>

          {/* Create Community Button */}
          {!search && (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[14px] text-white text-[14px] font-bold active:scale-[0.98] transition-all"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 12px rgba(22,163,74,0.25)' }}
            >
              <Plus className="w-4 h-4" />
              Create Community
            </button>
          )}

          {/* My Communities — always shown (with empty state) */}
          {!search && (
            <section>
              <h2 className="text-[15px] font-bold text-slate-900 mb-3">My Communities</h2>
              {communitiesLoading ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3">
                      <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-32 rounded" />
                        <div className="skeleton h-2.5 w-20 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : joinedCommunities.length === 0 && myGroups.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <p className="text-2xl mb-2">🏘️</p>
                  <p className="text-[13px] font-semibold text-slate-600">You haven't joined any communities yet</p>
                  <p className="text-[12px] text-slate-400 mt-1">Browse suggested communities below to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {joinedCommunities.map(community => (
                    <MyCommunityRow
                      key={community.id}
                      community={community}
                      onClick={() => setSelectedCommunityId(community.id)}
                    />
                  ))}
                  {myGroups.map(group => (
                    <MyGroupRow
                      key={group.id}
                      group={group}
                      onClick={() => { setSelectedGroup(group); setShowGroupDetail(true); }}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Suggested Communities */}
          <section>
            <h2 className="text-[15px] font-bold text-slate-900 mb-3">
              {search ? 'Search Results' : 'Suggested Communities'}
            </h2>

            {communitiesLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
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
            ) : suggestedCommunities.length === 0 && !search ? (
              <p className="text-sm text-slate-400 text-center py-6">You've joined all available communities!</p>
            ) : filteredCommunities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No communities found for "{search}"</p>
            ) : (
              <div className="space-y-3">
                {suggestedCommunities.map(community => (
                  <SuggestedCommunityCard
                    key={community.id}
                    community={community}
                    joined={joinedIds.has(community.id)}
                    loading={joiningId === community.id}
                    onJoin={handleJoin}
                    onView={setSelectedCommunityId}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Suggested Groups */}
          {!search && suggestedGroups.length > 0 && (
            <section>
              <h2 className="text-[15px] font-bold text-slate-900 mb-3">Groups You May Like</h2>
              <div className="grid grid-cols-2 gap-3">
                {suggestedGroups.map(g => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    isMember={false}
                    onJoin={handleGroupJoin}
                    onLeave={handleGroupLeave}
                    onClick={() => { setSelectedGroup(g); setShowGroupDetail(true); }}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      </div>

      <GroupDetailSheet
        group={selectedGroup}
        open={showGroupDetail}
        onOpenChange={setShowGroupDetail}
        currentUser={currentUser}
        isMember={selectedGroup ? membershipSet.has(selectedGroup.id) : false}
        onJoin={handleGroupJoin}
        onLeave={handleGroupLeave}
      />

      <CreateGroupModal
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        currentUser={currentUser}
        onCreated={refetchGroups}
      />
    </div>
  );
}

function SuggestedCommunityCard({ community, joined, loading, onJoin, onView }) {
  return (
    <div
      onClick={() => onView(community.id)}
      className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <CommunityLogo community={community} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-semibold text-slate-900 text-[14px] truncate">{community.name}</span>
          {community.is_claimed && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(community.neighborhood || community.address) && (
            <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[120px]">{community.neighborhood || community.address?.split(',')[0]}</span>
            </span>
          )}
          {community.follower_count > 0 && (
            <span className="text-[11px] text-slate-400">{community.follower_count} members</span>
          )}
        </div>
        {community.description_short && (
          <p className="text-[12px] text-slate-500 line-clamp-1 mt-0.5">{community.description_short}</p>
        )}
      </div>
      <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); onJoin(e, community); }}>
        <button
          disabled={loading}
          className={`text-[13px] font-semibold h-8 px-4 rounded-full transition-colors ${
            joined ? 'bg-slate-100 text-slate-700' : 'text-white'
          }`}
          style={!joined ? { background: 'var(--primary)' } : {}}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : joined ? 'Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
}

function MyCommunityRow({ community, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-blue-50 flex items-center justify-center overflow-hidden border border-slate-100">
        {community.logo_url
          ? <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-blue-600 font-bold text-base">{community.name?.charAt(0)}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-[13px] truncate">{community.name}</p>
        {community.neighborhood && (
          <p className="text-[11px] text-slate-400 truncate">{community.neighborhood}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[11px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">Member</span>
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </div>
    </div>
  );
}

function MyGroupRow({ group, onClick }) {
  const CATEGORY_EMOJI = {
    'Torah Learning': '📚', 'Shabbat': '🕯️', 'Chesed': '🤝',
    'Events': '🎉', 'Youth': '👦', 'Families': '👨‍👩‍👧', 'Seniors': '👴', 'General': '💬',
  };
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-slate-50 flex items-center justify-center border border-slate-100 text-xl">
        {CATEGORY_EMOJI[group.category] || '💬'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-[13px] truncate">{group.name}</p>
        <p className="text-[11px] text-slate-400">{group.member_count || 0} members · {group.category}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[11px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">Member</span>
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </div>
    </div>
  );
}