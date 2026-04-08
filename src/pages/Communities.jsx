import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Plus, Search, X, Users, AlertCircle, Map } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProfileSetup from '@/components/profile/ProfileSetup';
import CommunityDetailView from '@/components/communities/CommunityDetailView';
import CommunityDetailPage from '@/components/communities/CommunityDetailPage.jsx';
import CommunityGroupPage from '@/components/communities/CommunityGroupPage';
import ShulCommunityPage from '@/components/shul/ShulCommunityPage';
import CreateCommunityModal from '@/components/communities/CreateCommunityModal';
import FeaturedCommunityBanner from '@/components/communities/FeaturedCommunityBanner';
import DiscoverCategoryCards, { DISCOVER_CATEGORIES } from '@/components/communities/DiscoverCategoriesScreen';
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
  { id: 'demo-1', name: 'Young Israel Woodmere', type: 'Shul', follower_count: 420, description_short: 'Heart of the Five Towns community.', is_verified: true, neighborhood: 'Woodmere', description: 'Heart of the Five Towns community.' },
  { id: 'demo-2', name: 'HAFTR Day School', type: 'School', follower_count: 310, description_short: 'Leading Jewish day school K–12.', is_verified: true, neighborhood: 'Lawrence', description: 'Leading Jewish day school K–12.' },
  { id: 'demo-3', name: 'Chabad of Woodmere', type: 'Shul', follower_count: 280, description_short: 'Open to everyone. Shabbat & holidays.', neighborhood: 'Woodmere', description: 'Open to everyone. Shabbat & holidays.' },
  { id: 'demo-4', name: 'Five Towns Chessed Network', type: 'Other', follower_count: 175, description_short: 'Connecting volunteers with those in need.', neighborhood: 'Five Towns', description: 'Connecting volunteers with those in need.' },
  { id: 'demo-5', name: 'Hebrew Academy Long Beach', type: 'School', follower_count: 195, description_short: 'Torah and academic excellence since 1952.', neighborhood: 'Long Beach', description: 'Torah and academic excellence since 1952.' },
  { id: 'demo-6', name: 'Woodmere Minyan', type: 'Shul', follower_count: 140, description_short: 'Multiple daily minyanim.', neighborhood: 'Woodmere', description: 'Multiple daily minyanim.' },
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
  'Shabbos event coming up',
  'New members joined today',
  'Someone posted a help request',
  'Shared a learning resource',
  'Hosting a community event',
  'New discussion started',
  'Mitzvah opportunity posted',
];

const CATEGORY_ICONS = {
  'Schools & Yeshivas': '🏫',
  'Chessed & Volunteering': '🤝',
  'Travel': '✈️',
  'Careers & Networking': '💼',
  'Learning & Torah': '📚',
  'Social & Events': '🎉',
  'Programs & Youth': '🧒',
  'Sports & Fitness': '🏀',
  'Food & Lifestyle': '🍽️',
  'Local Communities': '🌍',
  School: '🏫', Yeshiva: '🏫', Seminary: '🎓',
  Shul: '🕍', Camp: '⛺', Other: '🌐',
};

const VALUE_PROPOSITIONS = {
  'Schools & Yeshivas': ['Connect with alumni & families', 'Share resources & study tips', 'Network with educators'],
  'Chessed & Volunteering': ['Help others & build community', 'Find volunteering opportunities', 'Make a real difference'],
  'Travel': ['Plan trips together', 'Share travel tips & deals', 'Meet fellow travelers'],
  'Careers & Networking': ['Find jobs & network', 'Share career opportunities', 'Grow professionally'],
  'Learning & Torah': ['Daily Torah discussions', 'Deepen your knowledge', 'Learn with others'],
  'Social & Events': ['Weekly events & real connections', 'Meet people & have fun', 'Build lasting friendships'],
  'Programs & Youth': ['Programs for all ages', 'Activities & mentorship', 'Youth engagement'],
  'Sports & Fitness': ['Join leagues & activities', 'Find workout partners', 'Stay active together'],
  'Food & Lifestyle': ['Kosher dining & recipes', 'Share lifestyle tips', 'Food events & gatherings'],
  'Local Communities': ['Connect with your neighborhood', 'Local updates & events', 'Build community bonds'],
  'Shul': ['Shabbos meals & rides', 'Daily minyanim & programming', 'Community connection'],
  'School': ['Connect with school community', 'Share resources & updates', 'Parent networking'],
};

function getActivityBadge(id) {
  const n = id ? id.charCodeAt(0) % 3 : 0;
  if (n === 0) return { label: '🔥 Hot', color: 'bg-red-50 text-red-600' };
  if (n === 1) return { label: '🟢 Active', color: 'bg-green-50 text-green-700' };
  return { label: '✨ New', color: 'bg-violet-50 text-violet-600' };
}

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

const CATEGORY_CARD_GRADIENTS = {
  School:    'from-sky-500 to-blue-600',
  Yeshiva:   'from-sky-500 to-blue-600',
  Seminary:  'from-sky-500 to-blue-600',
  Shul:      'from-violet-500 to-purple-600',
  Community: 'from-indigo-500 to-blue-600',
  Travel:    'from-cyan-500 to-teal-500',
  Chessed:   'from-emerald-500 to-green-600',
  Camp:      'from-amber-400 to-orange-500',
  Other:     'from-blue-500 to-purple-600',
};

function MemberStack({ count = 0 }) {
  const colors = ['#2563EB','#7C3AED','#16A34A','#F59E0B','#EC4899'];
  const shown = Math.min(count > 0 ? 3 : 2, 3);
  return (
    <div className="flex -space-x-2">
      {[...Array(shown)].map((_, i) => (
        <div key={i} className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
          style={{ background: colors[i % colors.length], zIndex: shown - i }} />
      ))}
    </div>
  );
}

function CommunityCard({ community, isJoined, isJoining, onOpen, onJoin, featured = false }) {
  const typeKey = community.type || '';
  const catKey = community.category || TYPE_TO_CATEGORY[typeKey] || '';
  const gradient = CATEGORY_CARD_GRADIENTS[typeKey] || CATEGORY_CARD_GRADIENTS[catKey] || 'from-blue-500 to-purple-600';
  const initials = community.name?.slice(0, 2)?.toUpperCase() || 'CO';
  const activity = getMockActivity(community.id);
  const activeNow = 3 + (community.id?.charCodeAt(0) % 12);
  const badge = getActivityBadge(community.id);
  const catIcon = CATEGORY_ICONS[typeKey] || CATEGORY_ICONS[catKey] || '🏘️';

  return (
    <div
      className="w-full rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 active:scale-[0.95] active:shadow-lg transition-all duration-200 overflow-hidden text-left cursor-pointer"
      onClick={() => onOpen(community.id)}
    >
      <div className={`h-2 w-full bg-gradient-to-r ${gradient}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            {community.logo_url ? (
              <img src={community.logo_url} alt={community.name} className="h-11 w-11 rounded-2xl object-cover shrink-0" />
            ) : (
              <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold text-[12px] shadow-sm shrink-0`}>
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-slate-900 truncate">{community.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{(community.follower_count || 0).toLocaleString()} members</div>
              <div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${badge.color} shadow-sm`}>
                {badge.label}
              </div>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onJoin(community); }}
            disabled={isJoining}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-60 ${
              isJoined ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isJoining ? '…' : isJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>

        {community.description_short && (
          <div className="text-[11px] text-slate-600 line-clamp-2 mb-2">{community.description_short}</div>
        )}

        <div className="mt-1 text-xs text-slate-500 mb-1">
          {VALUE_PROPOSITIONS[catKey]?.[0] || VALUE_PROPOSITIONS[typeKey]?.[0] || 'Weekly events & real connections'}
        </div>
        <div className="mt-1 text-xs text-slate-400 mb-3">
          {community.post_count ? `${community.post_count} posts this week` : '12 new posts this week'}
        </div>

        <div className="flex items-center justify-between gap-2 mb-3">
          <MemberStack count={community.follower_count || 0} />
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span>{catIcon}</span>
            <span>{catKey || typeKey || 'Community'}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600 font-medium line-clamp-2 hover:bg-slate-100 transition-colors">
          {activity}
        </div>
      </div>
    </div>
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
      className="w-full rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.97] active:shadow-xl transition-all duration-150 overflow-hidden text-left flex flex-col cursor-pointer"
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
          <button className="w-full rounded-full py-1.5 text-[12px] font-bold bg-green-50 text-green-700 border border-green-200 active:scale-95 transition-all duration-150">✓ Joined</button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onJoin(group); }}
            className="w-full rounded-full py-1.5 text-[12px] font-bold text-white active:scale-95 transition-all duration-150"
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
  const [showCategoryBrowse, setShowCategoryBrowse] = useState(false);
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
      const discoverCat = DISCOVER_CATEGORIES.find(c => c.key === activeCategory)?.filterValue;
      const legacyCat = CATEGORIES.find(c => c.key === activeCategory)?.value;
      const cat = discoverCat || legacyCat;
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
    return <CommunityDetailPage communityId={selectedCommunityId} currentUser={currentUser} onBack={backToList} />;
  }

  const isLoading = loadingPhase === 'loading' && allCommunities.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 180ms ease both; }
        .fade-up-delay { animation: fadeUp 180ms ease 80ms both; }
        @keyframes heroEnter { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .hero-enter { animation: heroEnter 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <h1 className="text-3xl font-bold text-slate-900">Communities</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/CommunityMap')}
              className="p-2.5 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 active:scale-90 transition-all duration-150"
              title="Map view"
            >
              <Map className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-full bg-blue-600 text-white px-4 py-2.5 text-[13px] font-semibold shadow-sm hover:bg-blue-700 active:scale-95 transition-all duration-150"
            >
              + Create
            </button>
          </div>
        </div>

        {/* Featured Banner */}
        <FeaturedCommunityBanner communities={allCommunities.slice(0, 4)} onOpen={openCommunity} />

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search communities…"
              className="w-full pl-11 pr-9 py-3 rounded-2xl border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 outline-none shadow-sm focus:ring-2 focus:ring-blue-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex bg-slate-100 rounded-2xl p-1">
          {[{ id: 'mine', label: 'My Communities' }, { id: 'discover', label: 'Discover' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isDemo && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-[11px] text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> Showing demo data — seed communities to see real data.
          </div>
        )}



        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 space-y-3">
                <div className="skeleton w-11 h-11 rounded-2xl" />
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-2.5 w-16 rounded" />
                <div className="skeleton h-8 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="fade-up">
            {activeTab === 'mine' ? (
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
              <>
                {!searchQuery && (
                  <DiscoverCategoryCards
                    activeCategory={activeCategory}
                    onSelectCategory={(key) => setActiveCategory(key)}
                  />
                )}
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
              /></>
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

function MineTab({ myCommunities, myGroups, openCommunity, setSelectedGroup, setActiveTab, userCommunityIds, memberGroupIds, onJoinCommunity, onJoinGroup, joiningId }) {
  if (myCommunities.length === 0 && myGroups.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)', border: '1px dashed #BFDBFE' }}>
          <div className="text-3xl mb-2">👋</div>
          <h3 className="text-[15px] font-bold text-slate-800 mb-1">Join communities to get started</h3>
          <p className="text-[12px] text-slate-500 mb-4">Discover communities and groups that match your interests</p>
          <button
            onClick={() => setActiveTab('discover')}
            className="bg-blue-600 text-white rounded-full px-5 py-2 text-[12px] font-bold active:scale-95 transition-all duration-150"
          >
            Explore Communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {myCommunities.length > 0 && (
        <div>
          <div className="text-lg font-bold text-slate-900 mb-3">My Communities</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
        </div>
      )}

      {myGroups.length > 0 && (
        <div>
          <div className="text-lg font-bold text-slate-900 mb-3">My Groups</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
        </div>
      )}
    </div>
  );
}

function DiscoverTabContent({ communities, groups, openCommunity, setSelectedGroup, onJoin, onJoinGroup, joiningId, userCommunityIds, memberGroupIds, setShowCreateModal, hasFilter, setActiveCategory }) {
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
            className="bg-blue-600 text-white rounded-full px-5 py-2 text-[12px] font-bold active:scale-95 transition-all duration-150"
          >
            Clear Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {communities.length > 0 && (
        <div>
          <div className="text-lg font-bold text-slate-900 mb-3">Communities</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {communities.map(c => (
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
        </div>
      )}

      {groups.length > 0 && (
        <div>
          <div className="text-lg font-bold text-slate-900 mb-3">Groups</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
        </div>
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