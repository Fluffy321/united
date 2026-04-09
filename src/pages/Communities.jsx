import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Plus, Search, X, Map } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProfileSetup from '@/components/profile/ProfileSetup';
import CommunityDetailView from '@/components/communities/CommunityDetailView';
import ShulCommunityPage from '@/components/shul/ShulCommunityPage';
import CreateCommunityModal from '@/components/communities/CreateCommunityModal';
import FeaturedHeroCard from '@/components/communities/FeaturedHeroCard';
import FeaturedSecondaryCard from '@/components/communities/FeaturedSecondaryCard';
import CommunityGroupPage from '@/components/communities/CommunityGroupPage';
import { toast } from 'sonner';

const CACHE_KEY = 'communities_v3_cache';
const FEATURED_SHULS = ["Young Israel Woodmere", "Chabad of Woodmere", "Beth Shalom", "Shaaray Tefila"];

const TYPE_TO_CATEGORY = {
  School: 'Schools & Yeshivas',
  Yeshiva: 'Schools & Yeshivas',
  Seminary: 'Schools & Yeshivas',
  Shul: 'Local Communities',
  Camp: 'Programs & Youth',
  Other: null,
};

const DEMO_COMMUNITIES = [
  { id: 'demo-1', name: 'Young Israel Woodmere', type: 'Shul', follower_count: 420, description_short: 'Heart of the Five Towns community.' },
  { id: 'demo-2', name: 'HAFTR Day School', type: 'School', follower_count: 310, description_short: 'Leading Jewish day school K–12.' },
  { id: 'demo-3', name: 'Chabad of Woodmere', type: 'Shul', follower_count: 280, description_short: 'Open to everyone. Shabbat & holidays.' },
  { id: 'demo-4', name: 'Five Towns Chessed Network', type: 'Other', follower_count: 175, description_short: 'Connecting volunteers with those in need.' },
];

function getCached() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch { return []; }
}
function setCache(list) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
}

export default function Communities() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [allCommunities, setAllCommunities] = useState(() => getCached());
  const [allGroups, setAllGroups] = useState([]);
  const [userCommunityIds, setUserCommunityIds] = useState(new Set());
  const [memberGroupIds, setMemberGroupIds] = useState(new Set());
  const [loadingPhase, setLoadingPhase] = useState('loading');
  const [joiningId, setJoiningId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('mine');
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
        setAllCommunities(DEMO_COMMUNITIES);
        setIsDemo(true);
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

  const mainFeatured = useMemo(() => allCommunities.find(c => c.isMainFeatured === true), [allCommunities]);
  const secondaryFeatured = useMemo(() => {
    return allCommunities.filter(c => c.isFeatured === true && c.isMainFeatured !== true).sort((a, b) => (a.featuredRank || 999) - (b.featuredRank || 999)).slice(0, 3);
  }, [allCommunities]);

  const myCommunities = useMemo(() => allCommunities.filter(c => userCommunityIds.has(c.id)), [allCommunities, userCommunityIds]);
  const discoverCommunities = useMemo(() => allCommunities.filter(c => !userCommunityIds.has(c.id)), [allCommunities, userCommunityIds]);

  const filteredCommunities = useMemo(() => {
    let result = activeTab === 'mine' ? myCommunities : discoverCommunities;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name?.toLowerCase().includes(q) || c.neighborhood?.toLowerCase().includes(q));
    }
    return result;
  }, [searchQuery, activeTab, myCommunities, discoverCommunities]);

  const joinCommunity = async (community) => {
    if (!currentUser) { toast.error('Sign in to join communities'); return; }
    setJoiningId(community.id);
    try {
      await base44.entities.UserCommunity.create({ user_id: currentUser.id, community_id: community.id, role: 'Member' });
      await base44.entities.Community.update(community.id, {
        follower_count: (community.follower_count || 0) + 1,
        joins_this_week: (community.joins_this_week || 0) + 1
      });
      setUserCommunityIds(prev => new Set([...prev, community.id]));
      toast.success(`Joined ${community.name}!`);
    } catch { toast.error('Something went wrong'); }
    setJoiningId(null);
  };

  const openCommunity = (id) => {
    const community = allCommunities.find(c => c.id === id);
    if (community) {
      base44.entities.Community.update(id, { views_count: (community.views_count || 0) + 1 }).catch(() => {});
    }
    setSearchParams({ communityId: String(id) });
  };
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
        onBack={() => setSelectedGroup(null)}
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
    <div className="min-h-screen bg-slate-50 px-4 pt-6 pb-24">
      {/* Header */}
      <div className="mb-6 flex max-w-2xl items-center justify-between gap-3 mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">Communities</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/CommunityMap')}
            className="rounded-full bg-white border border-slate-200 p-2.5 shadow-sm hover:bg-slate-50 active:scale-90 transition-all"
          >
            <Map className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-full bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
          >
            + Create
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Featured Section */}
        {(mainFeatured || secondaryFeatured.length > 0) && (
          <div className="space-y-4">
            {mainFeatured && (
              <FeaturedHeroCard
                community={mainFeatured}
                isJoined={userCommunityIds.has(mainFeatured.id)}
                isJoining={joiningId === mainFeatured.id}
                onOpen={openCommunity}
                onJoin={joinCommunity}
              />
            )}
            {secondaryFeatured.length > 0 && (
              <div className="overflow-x-auto -mx-4 px-4">
                <div className="flex gap-3 pb-1">
                  {secondaryFeatured.map(c => (
                    <div key={c.id} className="flex-shrink-0 w-80">
                      <FeaturedSecondaryCard
                        community={c}
                        isJoined={userCommunityIds.has(c.id)}
                        isJoining={joiningId === c.id}
                        onOpen={openCommunity}
                        onJoin={joinCommunity}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search communities…"
            className="w-full pl-11 pr-9 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none shadow-sm focus:ring-2 focus:ring-blue-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-white p-1 shadow-sm">
          {['mine', 'discover'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500'
              }`}
            >
              {tab === 'mine' ? 'My Communities' : 'Discover'}
            </button>
          ))}
        </div>

        {/* Communities Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 space-y-3">
                <div className="skeleton w-12 h-12 rounded-2xl" />
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-2.5 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredCommunities.length === 0 ? (
              <div className="sm:col-span-2 rounded-3xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-8 text-center">
                <p className="text-sm font-semibold text-slate-700">No communities found</p>
                <p className="mt-1 text-xs text-slate-500">Try a different search or explore other communities</p>
              </div>
            ) : (
              filteredCommunities.map(c => (
                <div
                  key={c.id}
                  onClick={() => openCommunity(c.id)}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3 flex-1">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.name} className="h-12 w-12 rounded-2xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white text-sm">
                          {c.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold text-slate-900 text-sm">{c.name}</div>
                        <div className="text-xs text-slate-500">{(c.follower_count || 0).toLocaleString()} members</div>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); joinCommunity(c); }}
                      disabled={joiningId === c.id}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold flex-shrink-0 transition-all active:scale-95 disabled:opacity-60 ${
                        userCommunityIds.has(c.id)
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {joiningId === c.id ? '…' : userCommunityIds.has(c.id) ? '✓' : 'Join'}
                    </button>
                  </div>
                  {c.description_short && (
                    <p className="mt-3 line-clamp-2 text-xs text-slate-600">{c.description_short}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
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