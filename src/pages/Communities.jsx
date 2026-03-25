import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Plus, Search, X, Users, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProfileSetup from '@/components/profile/ProfileSetup';
import CommunityDetailView from '@/components/communities/CommunityDetailView';
import CommunityGroupPage from '@/components/communities/CommunityGroupPage';
import ShulCommunityPage from '@/components/shul/ShulCommunityPage';
import CreateCommunityModal from '@/components/communities/CreateCommunityModal';
import { toast } from 'sonner';

const CACHE_KEY = 'communities_v3_cache';
const FEATURED_SHULS = ["Young Israel Woodmere", "Chabad of Woodmere", "Beth Shalom", "Shaaray Tefila"];

const CATEGORIES = [
  { label: 'All', value: null },
  { label: '🏫 Schools & Yeshivas', value: 'Schools & Yeshivas' },
  { label: '🤝 Chessed & Volunteering', value: 'Chessed & Volunteering' },
  { label: '✈️ Travel', value: 'Travel' },
  { label: '💼 Careers & Networking', value: 'Careers & Networking' },
  { label: '📚 Learning & Torah', value: 'Learning & Torah' },
  { label: '🎉 Social & Events', value: 'Social & Events' },
  { label: '🧒 Programs & Youth', value: 'Programs & Youth' },
  { label: '🏀 Sports & Fitness', value: 'Sports & Fitness' },
  { label: '🍽️ Food & Lifestyle', value: 'Food & Lifestyle' },
  { label: '🌍 Local Communities', value: 'Local Communities' },
];

const TYPE_TO_CATEGORY = {
  School: 'Schools & Yeshivas',
  Yeshiva: 'Schools & Yeshivas',
  Seminary: 'Schools & Yeshivas',
  Shul: 'Local Communities',
  Camp: 'Programs & Youth',
  Other: null,
};

const DEMO_COMMUNITIES = [
  { id: 'demo-1', name: 'Young Israel Woodmere', type: 'Shul', follower_count: 420, description_short: 'Heart of the Five Towns community.', is_verified: true, neighborhood: 'Woodmere' },
  { id: 'demo-2', name: 'HAFTR Day School', type: 'School', follower_count: 310, description_short: 'Leading Jewish day school K–12.', is_verified: true, neighborhood: 'Lawrence' },
  { id: 'demo-3', name: 'Chabad of Woodmere', type: 'Shul', follower_count: 280, description_short: 'Open to everyone. Shabbat & holidays.', neighborhood: 'Woodmere' },
  { id: 'demo-4', name: 'Five Towns Chessed Network', type: 'Other', follower_count: 175, description_short: 'Connecting volunteers with those in need.', neighborhood: 'Five Towns' },
  { id: 'demo-5', name: 'Hebrew Academy Long Beach', type: 'School', follower_count: 195, description_short: 'Torah and academic excellence since 1952.', neighborhood: 'Long Beach' },
  { id: 'demo-6', name: 'Woodmere Minyan', type: 'Shul', follower_count: 140, description_short: 'Multiple daily minyanim.', neighborhood: 'Woodmere' },
];

const TYPE_COLORS = {
  Shul: 'bg-blue-100 text-blue-700',
  School: 'bg-purple-100 text-purple-700',
  Yeshiva: 'bg-indigo-100 text-indigo-700',
  Seminary: 'bg-pink-100 text-pink-700',
  Camp: 'bg-green-100 text-green-700',
  Other: 'bg-orange-100 text-orange-700',
};

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getCached() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch { return []; }
}
function setCache(list) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
}

function CommunityCard({ community, isJoined, isJoining, onOpen, onJoin }) {
  const initials = community.name?.slice(0, 2)?.toUpperCase() || 'CO';
  const categoryLabel = community.category || (TYPE_TO_CATEGORY[community.type] ? community.type : 'Community');
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-3 flex flex-col">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-slate-700 flex-shrink-0">
          {community.logo_url ? (
            <img src={community.logo_url} alt={community.name} className="h-11 w-11 rounded-xl object-cover" />
          ) : initials}
        </div>
        <div className="min-w-0 flex-1">
          <button onClick={() => onOpen(community.id)} className="block w-full text-left">
            <div className="truncate text-sm font-semibold text-slate-900">{community.name}</div>
            <div className="mt-0.5 text-xs text-slate-500">{(community.follower_count || 0).toLocaleString()} members</div>
            {community.description_short && (
              <div className="mt-1 line-clamp-2 text-xs text-slate-400">{community.description_short}</div>
            )}
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] text-slate-400">{categoryLabel}</span>
        {isJoined ? (
          <button className="rounded-full px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700">Joined</button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onJoin(community); }}
            disabled={isJoining}
            className="rounded-full px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-1"
          >
            {isJoining ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Join'}
          </button>
        )}
      </div>
    </div>
  );
}

function GroupCard({ group, isMember, onClick, onJoin }) {
  const initials = getInitials(group.name);
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-3.5 cursor-pointer hover:shadow-md transition-all flex flex-col gap-2"
      style={{ border: '1px solid #E8EDF5', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}
    >
      <div className="flex items-center gap-2.5">
        {group.cover_image_url ? (
          <img src={group.cover_image_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-[11px]">{initials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[13px] text-slate-900 leading-tight truncate">{group.name}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">{group.category || 'Group'}</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Users className="w-3 h-3" />
          <span>{(group.member_count || 0).toLocaleString()}</span>
        </div>
        {isMember ? (
          <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Joined ✓</span>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onJoin(group); }}
            className="text-[11px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors"
          >
            Join
          </button>
        )}
      </div>
    </div>
  );
}

export default function Communities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('mine');
  const [allCommunities, setAllCommunities] = useState(() => getCached());
  const [allGroups, setAllGroups] = useState([]);
  const [userCommunityIds, setUserCommunityIds] = useState(new Set());
  const [memberGroupIds, setMemberGroupIds] = useState(new Set());
  const [loadingPhase, setLoadingPhase] = useState('loading');
  const [joiningId, setJoiningId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const selectedCommunityId = searchParams.get('communityId') || null;

  const loadData = useCallback(async (user) => {
    setLoadingPhase('loading');
    try {
      const results = await Promise.allSettled([
        user ? base44.entities.UserCommunity.filter({ user_id: user.id }) : Promise.resolve([]),
        user ? base44.entities.GroupMember.filter({ user_id: user.id }) : Promise.resolve([]),
        base44.entities.Community.list('-follower_count', 80),
        base44.entities.CommunityGroup.list('-member_count', 50),
      ]);

      const [memberships, groupMembers, comms, groups] = results;

      if (memberships.status === 'fulfilled') setUserCommunityIds(new Set(memberships.value.map(m => m.community_id)));
      if (groupMembers.status === 'fulfilled') setMemberGroupIds(new Set(groupMembers.value.map(m => m.group_id)));

      if (comms.status === 'fulfilled' && comms.value?.length > 0) {
        setAllCommunities(comms.value);
        setCache(comms.value);
        setIsDemo(false);
      } else {
        const cached = getCached();
        if (cached.length === 0) { setAllCommunities(DEMO_COMMUNITIES); setIsDemo(true); }
      }

      if (groups.status === 'fulfilled') setAllGroups(groups.value || []);
    } catch {
      const cached = getCached();
      if (cached.length === 0) { setAllCommunities(DEMO_COMMUNITIES); setIsDemo(true); }
    }
    setLoadingPhase('done');
  }, []);

  useEffect(() => {
    base44.auth.me()
      .then(user => { setCurrentUser(user); loadData(user); })
      .catch(() => loadData(null));
  }, [loadData]);

  const myCommunities = useMemo(() => allCommunities.filter(c => userCommunityIds.has(c.id)), [allCommunities, userCommunityIds]);
  const myGroups = useMemo(() => allGroups.filter(g => memberGroupIds.has(g.id)), [allGroups, memberGroupIds]);
  const discoverCommunities = useMemo(() => allCommunities.filter(c => !userCommunityIds.has(c.id)), [allCommunities, userCommunityIds]);
  const discoverGroups = useMemo(() => allGroups.filter(g => !memberGroupIds.has(g.id)), [allGroups, memberGroupIds]);

  const filterItems = useCallback((items) => {
    let result = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name?.toLowerCase().includes(q) || c.neighborhood?.toLowerCase().includes(q));
    }
    if (selectedCategory) {
      result = result.filter(c => {
        const cat = c.category || TYPE_TO_CATEGORY[c.type] || null;
        return cat === selectedCategory;
      });
    }
    return result;
  }, [searchQuery, selectedCategory]);

  const joinCommunity = async (community) => {
    if (!currentUser) { toast.error('Sign in to join communities'); return; }
    setJoiningId(community.id);
    try {
      await base44.entities.UserCommunity.create({ user_id: currentUser.id, community_id: community.id, role: 'Member' });
      await base44.entities.Community.update(community.id, { follower_count: (community.follower_count || 0) + 1 });
      setUserCommunityIds(prev => new Set([...prev, community.id]));
      toast.success(`Joined ${community.name}!`);
    } catch { toast.error('Something went wrong'); }
    setJoiningId(null);
  };

  const joinGroup = async (group) => {
    if (!currentUser) { toast.error('Sign in to join groups'); return; }
    try {
      await base44.entities.GroupMember.create({ group_id: group.id, user_id: currentUser.id, user_name: currentUser.full_name, role: 'member' });
      await base44.entities.CommunityGroup.update(group.id, { member_count: (group.member_count || 0) + 1 });
      setMemberGroupIds(prev => new Set([...prev, group.id]));
      toast.success(`Joined ${group.name}!`);
    } catch { toast.error('Something went wrong'); }
  };

  const openCommunity = (id) => setSearchParams({ communityId: String(id) });
  const backToList = () => setSearchParams({});

  if (currentUser?.is_profile_complete === false) {
    return <ProfileSetup user={currentUser} onComplete={() => base44.auth.me().then(setCurrentUser)} />;
  }

  if (selectedGroup) {
    return (
      <CommunityGroupPage
        group={selectedGroup}
        currentUser={currentUser}
        isMember={memberGroupIds.has(selectedGroup.id)}
        isPendingRequest={false}
        onJoin={joinGroup}
        onLeave={async (g) => {
          const members = await base44.entities.GroupMember.filter({ group_id: g.id, user_id: currentUser.id });
          if (members[0]) await base44.entities.GroupMember.delete(members[0].id);
          setMemberGroupIds(prev => { const s = new Set(prev); s.delete(g.id); return s; });
        }}
        onBack={() => setSelectedGroup(null)}
        onMemberApproved={(gid) => setMemberGroupIds(prev => new Set([...prev, gid]))}
      />
    );
  }

  if (selectedCommunityId) {
    const community = allCommunities.find(c => c.id === selectedCommunityId);
    if (!community && loadingPhase === 'done') { backToList(); return null; }
    if (!community) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    const isFeaturedShul = FEATURED_SHULS.some(n => community.name?.toLowerCase().includes(n.toLowerCase()));
    if (isFeaturedShul && community.type === 'Shul') {
      return <ShulCommunityPage community={community} currentUser={currentUser} onBack={backToList} />;
    }
    return <CommunityDetailView communityId={selectedCommunityId} currentUser={currentUser} onBack={backToList} />;
  }

  const isLoading = loadingPhase === 'loading' && allCommunities.length === 0;

  return (
    <div className="min-h-screen bg-[#F0F4FB] flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="bg-white flex-shrink-0 px-4 pt-4 pb-0" style={{ borderBottom: '1px solid #E8EDF5', boxShadow: '0 1px 6px rgba(15,23,42,0.04)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[20px] font-bold text-slate-900">Communities</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 bg-blue-600 text-white px-3.5 py-1.5 rounded-full text-[12px] font-bold shadow hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-8 py-2 bg-slate-100 rounded-full text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex">
            {[{ id: 'mine', label: 'My Communities' }, { id: 'discover', label: 'Discover' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 text-[13px] font-bold border-b-2 transition-all ${activeTab === tab.id ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pb-28 scrollbar-hide">
        <div className="max-w-2xl mx-auto px-4 pt-4">
          {isDemo && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 text-[11px] text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> Showing demo data — seed communities to see real data.
            </div>
          )}

          {/* Category filter chips */}
          {activeTab === 'discover' && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 mb-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCategory(prev => prev === cat.value ? null : cat.value)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3 w-20 rounded" />
                      <div className="skeleton h-2.5 w-12 rounded" />
                    </div>
                  </div>
                  <div className="skeleton h-7 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : activeTab === 'mine' ? (
            <MineTab
              myCommunities={filterItems(myCommunities)}
              myGroups={filterItems(myGroups)}
              openCommunity={openCommunity}
              setSelectedGroup={setSelectedGroup}
              setActiveTab={setActiveTab}
              userCommunityIds={userCommunityIds}
              memberGroupIds={memberGroupIds}
              onJoinCommunity={joinCommunity}
              onJoinGroup={joinGroup}
              joiningId={joiningId}
            />
          ) : (
            <DiscoverTabContent
              communities={filterItems(discoverCommunities)}
              groups={filterItems(discoverGroups)}
              openCommunity={openCommunity}
              setSelectedGroup={setSelectedGroup}
              onJoin={joinCommunity}
              onJoinGroup={joinGroup}
              joiningId={joiningId}
              userCommunityIds={userCommunityIds}
              memberGroupIds={memberGroupIds}
              setShowCreateModal={setShowCreateModal}
              hasFilter={!!selectedCategory || !!searchQuery}
            />
          )}
        </div>
      </div>

      <CreateCommunityModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        currentUser={currentUser}
        onCreated={() => loadData(currentUser)}
      />
    </div>
  );
}

function MineTab({ myCommunities, myGroups, openCommunity, setSelectedGroup, setActiveTab, userCommunityIds, memberGroupIds, onJoinCommunity, onJoinGroup, joiningId }) {
  if (myCommunities.length === 0 && myGroups.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #E8EDF5' }}>
        <div className="text-4xl mb-3">🌍</div>
        <div className="text-[16px] font-bold text-slate-900 mb-1">No communities yet</div>
        <div className="text-[12px] text-slate-500 mb-4">Join communities to get started</div>
        <button onClick={() => setActiveTab('discover')} className="bg-blue-600 text-white rounded-full px-5 py-2 text-[12px] font-bold shadow">
          Browse Communities
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {myCommunities.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[14px] font-bold text-slate-700">Your Communities</h2>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{myCommunities.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {myCommunities.map(c => (
              <CommunityCard
                key={c.id}
                community={c}
                isJoined={userCommunityIds.has(c.id)}
                isJoining={joiningId === c.id}
                onOpen={openCommunity}
                onJoin={onJoinCommunity}
              />
            ))}
          </div>
        </section>
      )}
      {myGroups.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[14px] font-bold text-slate-700">Your Groups</h2>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{myGroups.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {myGroups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                isMember={memberGroupIds.has(g.id)}
                onClick={() => setSelectedGroup(g)}
                onJoin={onJoinGroup}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DiscoverTabContent({ communities, groups, openCommunity, setSelectedGroup, onJoin, onJoinGroup, joiningId, userCommunityIds, memberGroupIds, setShowCreateModal, hasFilter }) {
  const sorted = [...communities].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));

  if (sorted.length === 0 && groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #E8EDF5' }}>
        <p className="font-bold text-slate-900">No communities found</p>
        <p className="text-[12px] text-slate-400 mt-1">{hasFilter ? 'Try a different filter' : 'Check back soon'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sorted.length > 0 && (
        <section>
          <h2 className="text-[14px] font-bold text-slate-700 mb-2">Communities</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {sorted.map(c => (
              <CommunityCard
                key={c.id}
                community={c}
                isJoined={userCommunityIds.has(c.id)}
                isJoining={joiningId === c.id}
                onOpen={openCommunity}
                onJoin={onJoin}
              />
            ))}
          </div>
        </section>
      )}

      {groups.length > 0 && (
        <section>
          <h2 className="text-[14px] font-bold text-slate-700 mb-2">Groups</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {groups.slice(0, 12).map(g => (
              <GroupCard
                key={g.id}
                group={g}
                isMember={memberGroupIds.has(g.id)}
                onClick={() => setSelectedGroup(g)}
                onJoin={onJoinGroup}
              />
            ))}
          </div>
        </section>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 text-center border border-blue-100">
        <div className="text-2xl mb-1.5">🏛️</div>
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Start a Community</h3>
        <p className="text-[11px] text-slate-500 mb-3">Bring your shul, school, or group online</p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white rounded-full px-5 py-2 text-[12px] font-bold shadow hover:bg-blue-700 transition-colors"
        >
          Create Community
        </button>
      </div>
    </div>
  );
}