import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Plus, Search, X, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProfileSetup from '@/components/profile/ProfileSetup';
import CommunityDetailView from '@/components/communities/CommunityDetailView';
import CommunityGroupPage from '@/components/communities/CommunityGroupPage';
import ShulCommunityPage from '@/components/shul/ShulCommunityPage';
import CreateCommunityModal from '@/components/communities/CreateCommunityModal';
import { FeaturedHeroCard, RichCommunityCard, MyRichCommunityCard } from '@/components/communities/RichCommunityCard';
import { toast } from 'sonner';

const FEATURED_SHULS = ["Young Israel Woodmere", "Chabad of Woodmere", "Beth Shalom", "Shaaray Tefila"];

function getActivityIndicator(community) {
  if (!community.updated_date) return 'No recent activity';
  const lastUpdate = new Date(community.updated_date);
  const now = new Date();
  const hours = Math.floor((now - lastUpdate) / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (hours < 1) return 'Active now';
  if (hours === 1) return '1 new post';
  if (hours < 24) return `${hours} new posts`;
  if (days === 1) return 'Active today';
  if (days < 7) return `Active ${days}d ago`;
  return 'Inactive';
}

function getSuggestedCommunities(allCommunities, userCommunityIds, currentUser) {
  const notJoined = allCommunities.filter(c => !userCommunityIds.has(c.id));
  const userInterests = new Set(currentUser.interests || []);
  const userCity = currentUser.cityPreset || currentUser.city || '';
  
  return notJoined.sort((a, b) => {
    let scoreA = 0, scoreB = 0;
    
    // Location match
    if (userCity && a.neighborhood?.toLowerCase().includes(userCity.toLowerCase())) scoreA += 50;
    if (userCity && b.neighborhood?.toLowerCase().includes(userCity.toLowerCase())) scoreB += 50;
    
    // Category match to interests
    userInterests.forEach(interest => {
      if ((a.description_long || a.description_short || '').toLowerCase().includes(interest.toLowerCase())) scoreA += 10;
      if ((b.description_long || b.description_short || '').toLowerCase().includes(interest.toLowerCase())) scoreB += 10;
    });
    
    // Higher follower count
    scoreA += (a.follower_count || 0) * 0.1;
    scoreB += (b.follower_count || 0) * 0.1;
    
    return scoreB - scoreA;
  }).slice(0, 5);
}

export default function Communities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('mine');
  const [allCommunities, setAllCommunities] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [userCommunityIds, setUserCommunityIds] = useState(new Set());
  const [memberGroupIds, setMemberGroupIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedCommunityIds, setPinnedCommunityIds] = useState(new Set());
  const [leavingId, setLeavingId] = useState(null);
  const [leaveConfirm, setLeaveConfirm] = useState(null);

  const selectedCommunityId = searchParams.get('communityId') || null;

  useEffect(() => {
    base44.auth.me()
      .then(user => {
        setCurrentUser(user);
        loadData(user);
      })
      .catch(() => {
        // Not logged in — load public data without user-specific filters
        loadData(null);
      });
  }, []);

  async function loadData(user) {
    setLoading(true);
    try {
      const queries = [
        base44.entities.Community.list('-follower_count', 80),
        base44.entities.CommunityGroup.list('-member_count', 50),
        user ? base44.entities.UserCommunity.filter({ user_id: user.id }) : Promise.resolve([]),
        user ? base44.entities.GroupMember.filter({ user_id: user.id }) : Promise.resolve([]),
      ];
      const [communities, groups, memberships, groupMembers] = await Promise.allSettled(queries);

      if (communities.status === 'fulfilled') setAllCommunities(communities.value || []);
      if (groups.status === 'fulfilled') setAllGroups(groups.value || []);
      if (memberships.status === 'fulfilled') setUserCommunityIds(new Set(memberships.value.map(m => m.community_id)));
      if (groupMembers.status === 'fulfilled') setMemberGroupIds(new Set(groupMembers.value.map(m => m.group_id)));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const myCommunities = useMemo(() => allCommunities.filter(c => userCommunityIds.has(c.id)), [allCommunities, userCommunityIds]);
  const myGroups = useMemo(() => allGroups.filter(g => memberGroupIds.has(g.id)), [allGroups, memberGroupIds]);
  const discoverCommunities = useMemo(() => allCommunities.filter(c => !userCommunityIds.has(c.id)), [allCommunities, userCommunityIds]);
  const discoverGroups = useMemo(() => allGroups.filter(g => !memberGroupIds.has(g.id)), [allGroups, memberGroupIds]);

  const [selectedCategory, setSelectedCategory] = useState(null);

  const filterByQuery = (items) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q));
  };

  const groupByType = (items) => {
    const grouped = {};
    items.forEach(item => {
      const type = item.type || item.category || 'Other';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(item);
    });
    return grouped;
  };

  const filterByCategory = (items, category) => {
    if (!category) return items;
    return items.filter(c => (c.type || c.category) === category);
  };

  const getTrendingCommunities = (items) => {
    return [...items].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0)).slice(0, 5);
  };

  if (currentUser?.is_profile_complete === false) {
    return <ProfileSetup user={currentUser} onComplete={() => base44.auth.me().then(setCurrentUser)} />;
  }

  async function joinCommunity(community) {
    setJoiningId(community.id);
    try {
      await base44.entities.UserCommunity.create({ user_id: currentUser.id, community_id: community.id, role: 'Member' });
      await base44.entities.Community.update(community.id, { follower_count: (community.follower_count || 0) + 1 });
      setUserCommunityIds(prev => new Set([...prev, community.id]));
      toast.success(`Joined ${community.name}!`);
    } catch { toast.error('Something went wrong'); }
    setJoiningId(null);
  }

  async function joinGroup(group) {
    try {
      await base44.entities.GroupMember.create({ group_id: group.id, user_id: currentUser.id, user_name: currentUser.full_name, role: 'member' });
      await base44.entities.CommunityGroup.update(group.id, { member_count: (group.member_count || 0) + 1 });
      setMemberGroupIds(prev => new Set([...prev, group.id]));
      toast.success(`Joined ${group.name}!`);
    } catch { toast.error('Something went wrong'); }
  }

  async function leaveGroup(group) {
    try {
      const members = await base44.entities.GroupMember.filter({ group_id: group.id, user_id: currentUser.id });
      if (members[0]) await base44.entities.GroupMember.delete(members[0].id);
      setMemberGroupIds(prev => { const s = new Set(prev); s.delete(group.id); return s; });
      toast.success(`Left ${group.name}`);
    } catch { toast.error('Something went wrong'); }
  }

  async function leaveCommunity(community) {
    setLeavingId(community.id);
    try {
      const memberships = await base44.entities.UserCommunity.filter({ user_id: currentUser.id, community_id: community.id });
      if (memberships[0]) await base44.entities.UserCommunity.delete(memberships[0].id);
      await base44.entities.Community.update(community.id, { follower_count: Math.max(0, (community.follower_count || 0) - 1) });
      setUserCommunityIds(prev => { const s = new Set(prev); s.delete(community.id); return s; });
      toast.success(`Left ${community.name}`);
    } catch { toast.error('Something went wrong'); }
    setLeavingId(null);
    setLeaveConfirm(null);
  }

  function togglePin(communityId) {
    setPinnedCommunityIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(communityId)) newSet.delete(communityId);
      else newSet.add(communityId);
      return newSet;
    });
  }

  function openCommunity(id) {
    setSearchParams({ communityId: String(id) });
  }

  function backToList() {
    setSearchParams({});
  }

  // Selected group page
  if (selectedGroup) {
    return (
      <CommunityGroupPage
        group={selectedGroup}
        currentUser={currentUser}
        isMember={memberGroupIds.has(selectedGroup.id)}
        isPendingRequest={false}
        onJoin={joinGroup}
        onLeave={leaveGroup}
        onBack={() => setSelectedGroup(null)}
        onMemberApproved={(groupId) => setMemberGroupIds(prev => new Set([...prev, groupId]))}
      />
    );
  }

  // Community detail page
  if (selectedCommunityId) {
    const community = allCommunities.find(c => c.id === selectedCommunityId);

    if (!community && loading) {
      return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    if (!community && !loading) {
      setTimeout(() => backToList(), 0);
      return null;
    }

    const isFeaturedShul = community && FEATURED_SHULS.some(name => community.name?.toLowerCase().includes(name.toLowerCase()));
    if (isFeaturedShul && community.type === 'Shul') {
      return <ShulCommunityPage community={community} currentUser={currentUser} onBack={backToList} />;
    }

    return <CommunityDetailView communityId={selectedCommunityId} currentUser={currentUser} onBack={backToList} />;
  }

  const EXPLORE_CATEGORIES = [
    { label: 'Local', emoji: '📍' },
    { label: 'Chessed', emoji: '❤️' },
    { label: 'Social', emoji: '🏀' },
    { label: 'Learning', emoji: '📚' },
    { label: 'Institutions', emoji: '🏛️' },
  ];

  const featuredCommunity = useMemo(() => {
    return [...allCommunities].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0))[0] || null;
  }, [allCommunities]);

  return (
    <div className="min-h-screen bg-[#F0F4FB] flex flex-col h-full">

      {/* Header */}
      <div className="bg-white border-b border-slate-100 flex-shrink-0 px-5 pt-5 pb-0" style={{ boxShadow: '0 1px 8px rgba(15,23,42,0.05)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[22px] font-bold text-slate-900">Communities</h1>
              <p className="text-[13px] text-slate-400">Discover & connect with your community</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-full text-[13px] font-bold shadow-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search communities…"
              className="w-full pl-9 pr-9 py-2.5 bg-slate-100 rounded-full text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex">
            {[{ id: 'mine', label: 'My Communities' }, { id: 'discover', label: 'Discover' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 text-[13px] font-bold border-b-2 transition-all ${
                  activeTab === tab.id ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-28 scrollbar-hide">
        <div className="max-w-2xl mx-auto px-4 pt-5">

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div className="skeleton w-11 h-11 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-36 rounded" />
                    <div className="skeleton h-3 w-48 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'mine' ? (
            <div className="space-y-6">
              {myCommunities.length === 0 && myGroups.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 4px 20px rgba(15,23,42,0.08)' }}>
                  <div className="text-5xl mb-4">🌍</div>
                  <div className="text-[18px] font-bold text-slate-900 mb-2">No communities yet</div>
                  <div className="text-[13px] text-slate-500 mb-5">Join some communities to get started</div>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="bg-blue-600 text-white rounded-full px-6 py-2.5 text-[13px] font-bold shadow-md"
                  >
                    Browse Communities
                  </button>
                </div>
              ) : (
                <>
                  {myCommunities.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[16px] font-bold text-slate-900">Your Communities</h2>
                        <span className="text-[12px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{myCommunities.length}</span>
                      </div>
                      <div className="space-y-2.5">
                        {filterByQuery(myCommunities).map(c => (
                          <MyRichCommunityCard
                            key={c.id}
                            community={c}
                            onOpen={openCommunity}
                            activity={getActivityIndicator(c)}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {myGroups.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[16px] font-bold text-slate-900">Your Groups</h2>
                        <span className="text-[12px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{myGroups.length}</span>
                      </div>
                      <div className="space-y-2.5">
                        {filterByQuery(myGroups).map(g => (
                          <div key={g.id} onClick={() => setSelectedGroup(g)} className="bg-white rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-all flex items-center gap-3" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)', border: '1px solid rgba(226,232,240,0.8)' }}>
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-black text-[12px]">{g.name?.slice(0,2).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-[14px] text-slate-900 truncate">{g.name}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{g.member_count || 0} members</div>
                            </div>
                            <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Group</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Discover Tab */
            <div className="space-y-6">
              {/* Featured Hero */}
              {!searchQuery && featuredCommunity && (
                <section>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h2 className="text-[14px] font-bold text-slate-700">Trending Community</h2>
                  </div>
                  <FeaturedHeroCard
                    community={featuredCommunity}
                    onOpen={openCommunity}
                    onJoin={joinCommunity}
                    isJoined={userCommunityIds.has(featuredCommunity.id)}
                    isJoining={joiningId === featuredCommunity.id}
                  />
                </section>
              )}

              {/* Category Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    !selectedCategory ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  All
                </button>
                {['Shul', 'School', 'Yeshiva', 'Seminary', 'Camp', 'Other'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                      selectedCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Community List */}
              {(() => {
                const filtered = filterByQuery(discoverCommunities);
                const byCategory = filterByCategory(filtered, selectedCategory);
                const sorted = [...byCategory].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));

                return sorted.length > 0 ? (
                  <section>
                    <h2 className="text-[16px] font-bold text-slate-900 mb-3">
                      {selectedCategory ? `${selectedCategory} Communities` : '🔥 All Communities'}
                    </h2>
                    <div className="space-y-3">
                      {sorted.map(c => (
                        <RichCommunityCard
                          key={c.id}
                          community={c}
                          onOpen={openCommunity}
                          onJoin={joinCommunity}
                          isJoined={userCommunityIds.has(c.id)}
                          isJoining={joiningId === c.id}
                          activity={getActivityIndicator(c)}
                        />
                      ))}
                    </div>
                  </section>
                ) : (
                  <div className="bg-white rounded-2xl p-8 text-center">
                    <p className="font-bold text-slate-900">No communities found</p>
                    <p className="text-[12px] text-slate-400 mt-1">Try a different filter</p>
                  </div>
                );
              })()}

              {/* Groups */}
              {discoverGroups.length > 0 && !selectedCategory && (
                <section>
                  <h2 className="text-[16px] font-bold text-slate-900 mb-3">👥 Groups</h2>
                  <div className="space-y-2.5">
                    {filterByQuery(discoverGroups).slice(0, 10).map(g => (
                      <div key={g.id} onClick={() => setSelectedGroup(g)} className="bg-white rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-all flex items-center gap-3" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)', border: '1px solid rgba(226,232,240,0.8)' }}>
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-black text-[12px]">{g.name?.slice(0,2).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[14px] text-slate-900 truncate">{g.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{g.description || `${g.member_count || 0} members`}</div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); joinGroup(g); }}
                          className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold bg-blue-600 text-white"
                        >
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Create CTA */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-6 text-center border border-blue-100">
                <div className="text-3xl mb-2">🏛️</div>
                <h3 className="text-[16px] font-bold text-slate-900 mb-1">Start a Community</h3>
                <p className="text-[12px] text-slate-500 mb-4">Bring your shul, school, or group online</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white rounded-full px-6 py-2.5 text-[13px] font-bold shadow-md hover:bg-blue-700 transition-colors"
                >
                  Create Community
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateCommunityModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        currentUser={currentUser}
        onCreated={() => loadData(currentUser)}
      />

      {/* Leave Community Confirmation */}
      {leaveConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-slate-900">Leave {leaveConfirm.name}?</h2>
            <p className="text-[14px] text-slate-600">You'll be removed from this community and can rejoin anytime.</p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setLeaveConfirm(null)}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 active:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => leaveCommunity(leaveConfirm)}
                disabled={leavingId === leaveConfirm.id}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold active:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center"
              >
                {leavingId === leaveConfirm.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}