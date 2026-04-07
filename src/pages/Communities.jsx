import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Plus, Search, X, Users, AlertCircle, Map } from 'lucide-react';
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
  { key: 'all', label: 'All', value: null },
  { key: 'schools', label: '🏫 Schools & Yeshivas', value: 'Schools & Yeshivas' },
  { key: 'chessed', label: '🤝 Chessed & Volunteering', value: 'Chessed & Volunteering' },
  { key: 'travel', label: '✈️ Travel', value: 'Travel' },
  { key: 'careers', label: '💼 Careers & Networking', value: 'Careers & Networking' },
  { key: 'learning', label: '📚 Learning & Torah', value: 'Learning & Torah' },
  { key: 'social', label: '🎉 Social & Events', value: 'Social & Events' },
  { key: 'programs', label: '🧒 Programs & Youth', value: 'Programs & Youth' },
  { key: 'sports', label: '🏀 Sports & Fitness', value: 'Sports & Fitness' },
  { key: 'food', label: '🍽️ Food & Lifestyle', value: 'Food & Lifestyle' },
  { key: 'local', label: '🌍 Local Communities', value: 'Local Communities' },
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

const TYPE_GRADIENTS = {
  Shul:     'from-blue-600 to-indigo-600',
  School:   'from-purple-600 to-violet-600',
  Yeshiva:  'from-indigo-600 to-blue-700',
  Seminary: 'from-pink-500 to-rose-600',
  Camp:     'from-green-500 to-teal-600',
  Other:    'from-orange-500 to-amber-600',
};

const ACTIVITY_LABELS = [
  'Just posted a new update',
  'Event coming up this Shabbos',
  'New members joined today',
  'Posted a help request',
  'Shared a learning resource',
];

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getMockActivity(id) {
  const idx = id ? id.charCodeAt(0) % ACTIVITY_LABELS.length : 0;
  return ACTIVITY_LABELS[idx];
}

function StackedAvatars({ count = 0 }) {
  const colors = ['#2563EB','#7C3AED','#16A34A','#F59E0B','#EC4899'];
  const shown = Math.min(count > 0 ? Math.min(count, 4) : 3, 4);
  return (
    <div className="flex items-center">
      {[...Array(shown)].map((_, i) => (
        <div key={i} className="w-5 h-5 rounded-full border-2 border-white -ml-1.5 first:ml-0 flex-shrink-0"
          style={{ background: colors[i % colors.length], zIndex: shown - i }} />
      ))}
      {count > 4 && <span className="text-[10px] font-bold text-slate-400 ml-1">+{count - 4}</span>}
    </div>
  );
}

function getCached() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch { return []; }
}
function setCache(list) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
}

const CATEGORY_GRADIENTS = {
  'Schools & Yeshivas':    'from-sky-500 to-blue-600',
  'Chessed & Volunteering':'from-emerald-500 to-green-600',
  'Travel':                'from-cyan-500 to-teal-500',
  'Careers & Networking':  'from-indigo-500 to-violet-600',
  'Learning & Torah':      'from-amber-400 to-orange-500',
  'Social & Events':       'from-pink-500 to-rose-500',
  'Programs & Youth':      'from-purple-500 to-fuchsia-500',
  'Sports & Fitness':      'from-lime-500 to-green-500',
  'Food & Lifestyle':      'from-red-400 to-orange-500',
  'Local Communities':     'from-blue-500 to-indigo-500',
};

function CommunityCard({ community, isJoined, isJoining, onOpen, onJoin, featured = false }) {
  const catKey = community.category || TYPE_TO_CATEGORY[community.type] || '';
  const gradient = CATEGORY_GRADIENTS[catKey] || 'from-blue-500 to-indigo-600';
  const initials = community.name?.slice(0, 2)?.toUpperCase() || 'CO';
  const activity = getMockActivity(community.id);

  return (
    <button
      onClick={() => onOpen(community.id)}
      className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md active:scale-[0.99] transition overflow-hidden text-left"
    >
      <div className={`h-2 w-full bg-gradient-to-r ${gradient}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {community.logo_url ? (
              <img src={community.logo_url} alt={community.name} className="h-12 w-12 rounded-2xl object-cover shrink-0" />
            ) : (
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold shadow-sm shrink-0`}>
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm truncate">{community.name}</div>
              <div className="text-xs text-slate-500 truncate">{(community.follower_count || 0).toLocaleString()} members</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active now
              </div>
            </div>
          </div>

          <button
            onClick={e => { e.stopPropagation(); onJoin(community); }}
            disabled={isJoining}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
              isJoined ? 'bg-slate-100 text-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isJoining ? '...' : isJoined ? 'Joined' : 'Join'}
          </button>
        </div>

        {community.description_short && (
          <div className="mt-3 text-xs text-slate-600 line-clamp-2">{community.description_short}</div>
        )}

        <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {activity}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-2">
            {[0,1,2].map(i => (
              <div key={i} className="h-7 w-7 rounded-full border-2 border-white"
                style={{ background: ['#2563EB','#7C3AED','#16A34A'][i] }} />
            ))}
          </div>
          <div className="text-[11px] font-medium text-slate-400">{catKey || community.type || 'Community'}</div>
        </div>
      </div>
    </button>
  );
}

function GroupCard({ group, isMember, onClick, onJoin }) {
  const initials = getInitials(group.name);
  const catGrad = {
    'Local Life': 'from-teal-500 to-cyan-600',
    'Chessed':    'from-rose-500 to-pink-600',
    'Social':     'from-amber-500 to-orange-600',
    'Learning':   'from-indigo-500 to-violet-600',
    'Institutional': 'from-slate-500 to-slate-700',
  }[group.category] || 'from-blue-500 to-indigo-600';
  const activity = getMockActivity(group.id);

  return (
    <div
      onClick={onClick}
      className="rounded-2xl bg-white shadow-sm hover:shadow-md cursor-pointer overflow-hidden flex flex-col"
      style={{
        border: '1px solid #EEF2F8',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div className={`h-2 bg-gradient-to-r ${catGrad}`} />

      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
        <div className="flex items-start gap-2.5">
          {group.cover_image_url ? (
            <img src={group.cover_image_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${catGrad}`}>
              <span className="text-white font-black text-[13px]">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[13px] text-slate-900 leading-snug truncate">{group.name}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{group.category || 'Group'}</p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 line-clamp-1">{activity}</p>

        <div className="flex items-center justify-between">
          <StackedAvatars count={group.member_count || 0} />
          <span className="text-[10px] text-slate-400">{(group.member_count || 0).toLocaleString()} members</span>
        </div>

        {isMember ? (
          <button className="w-full rounded-full py-1.5 text-[12px] font-bold bg-green-50 text-green-700 border border-green-200">✓ Joined</button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onJoin(group); }}
            className="w-full rounded-full py-1.5 text-[12px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #2563EB)' }}
          >
            Join
          </button>
        )}
      </div>
    </div>
  );
}

export default function Communities() {
  const navigate = useNavigate();
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
  const [activeCategory, setActiveCategory] = useState('all');
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
    if (activeCategory !== 'all') {
      const cat = CATEGORIES.find(c => c.key === activeCategory)?.value;
      if (cat) {
        result = result.filter(c => {
          const itemCat = c.category || TYPE_TO_CATEGORY[c.type] || null;
          return itemCat === cat;
        });
      }
    }
    return result;
  }, [searchQuery, activeCategory]);

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
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/CommunityMap')}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Map view"
              >
                <Map className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 bg-blue-600 text-white px-3.5 py-1.5 rounded-full text-[12px] font-bold shadow hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Create
              </button>
            </div>
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
          <div className="flex gap-1 pt-1">
            {[{ id: 'mine', label: 'My Communities' }, { id: 'discover', label: 'Discover' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 text-[14px] font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-blue-600" />
                )}
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

          {/* Featured Community Banner */}
          <FeaturedCommunityBanner
            community={allCommunities[0]}
            onOpen={openCommunity}
          />

          {/* Category filter chips */}
          {activeTab === 'discover' && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 mb-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                    activeCategory === cat.key
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
              hasFilter={activeCategory !== 'all' || !!searchQuery}
              setActiveCategory={setActiveCategory}
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

function FeaturedCommunityBanner({ community, onOpen }) {
  if (!community) return null;

  return (
    <div className="mb-6 rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="p-6">
        <div className="text-xs font-semibold text-white/80 mb-2">FEATURED COMMUNITY</div>
        <div className="text-2xl font-bold">{community.name}</div>
        <div className="mt-2 text-sm text-white/85 max-w-xl">
          {community.description_short || community.description}
        </div>
        <div className="mt-4 flex items-center gap-3 text-sm text-white/80">
          <span>{(community.follower_count || 0).toLocaleString()} members</span>
          <span>•</span>
          <span>{getMockActivity(community.id)}</span>
        </div>
        <button
          onClick={() => onOpen(community.id)}
          className="mt-5 rounded-full bg-white text-slate-900 px-5 py-2.5 font-semibold shadow"
        >
          View Community
        </button>
      </div>
    </div>
  );
}

const SUGGESTED_CATEGORIES = [
  { emoji: '🏫', label: 'Schools & Yeshivas', key: 'schools' },
  { emoji: '🤝', label: 'Chessed & Volunteering', key: 'chessed' },
  { emoji: '📚', label: 'Learning & Torah', key: 'learning' },
  { emoji: '🎉', label: 'Social & Events', key: 'social' },
  { emoji: '🏀', label: 'Sports & Fitness', key: 'sports' },
  { emoji: '🍽️', label: 'Food & Lifestyle', key: 'food' },
];

function MineTab({ myCommunities, myGroups, openCommunity, setSelectedGroup, setActiveTab, userCommunityIds, memberGroupIds, onJoinCommunity, onJoinGroup, joiningId }) {
  if (myCommunities.length === 0 && myGroups.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-4">
            👥
          </div>
          <div className="text-xl font-bold text-slate-900">No communities yet</div>
          <div className="text-slate-500 mt-2">Create the first one and start bringing people together.</div>
          <button
            onClick={() => setActiveTab('discover')}
            className="mt-5 rounded-full bg-blue-600 text-white px-5 py-3 font-semibold shadow-sm"
          >
            Browse Communities
          </button>
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide mb-3">Popular Categories</h3>
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTED_CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setActiveTab('discover')}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                style={{ border: '1px solid #E8EDF5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[12px] font-semibold text-slate-700 leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
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
              <CommunityCard key={c.id} community={c} isJoined={userCommunityIds.has(c.id)} isJoining={joiningId === c.id} onOpen={openCommunity} onJoin={onJoinCommunity} />
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
              <GroupCard key={g.id} group={g} isMember={memberGroupIds.has(g.id)} onClick={() => setSelectedGroup(g)} onJoin={onJoinGroup} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DiscoverTabContent({ communities, groups, openCommunity, setSelectedGroup, onJoin, onJoinGroup, joiningId, userCommunityIds, memberGroupIds, setShowCreateModal, hasFilter, setActiveCategory }) {
  const sorted = [...communities].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
  const featured = sorted[0];
  const rest = sorted.slice(1);

  const noResults = communities.length === 0 && groups.length === 0;

  if (noResults) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)', border: '1px dashed #BFDBFE' }}>
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="text-[15px] font-bold text-slate-800 mb-1">No results found</h3>
          <p className="text-[12px] text-slate-500 mb-4">Try a different search or explore by category</p>
          <button
            onClick={() => setActiveCategory('all')}
            className="bg-blue-600 text-white rounded-full px-5 py-2 text-[12px] font-bold"
          >
            Clear Filters
          </button>
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide mb-3">Explore Categories</h3>
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTED_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                style={{ border: '1px solid #E8EDF5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[12px] font-semibold text-slate-700 leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 text-center border border-blue-100">
          <div className="text-2xl mb-1.5">🏛️</div>
          <h3 className="text-[14px] font-bold text-slate-900 mb-1">Start a Community</h3>
          <p className="text-[11px] text-slate-500 mb-3">Bring your shul, school, or group online</p>
          <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white rounded-full px-5 py-2 text-[12px] font-bold shadow">
            Create Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {featured && (
        <section>
          <h2 className="text-[14px] font-bold text-slate-700 mb-2">⭐ Featured Community</h2>
          <CommunityCard
            community={featured}
            isJoined={userCommunityIds.has(featured.id)}
            isJoining={joiningId === featured.id}
            onOpen={openCommunity}
            onJoin={onJoin}
            featured={true}
          />
        </section>
      )}
      {rest.length > 0 && (
        <section>
          <h2 className="text-[14px] font-bold text-slate-700 mb-2">Communities</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {rest.map(c => (
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