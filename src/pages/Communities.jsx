import React, { useMemo, useState } from 'react';
import { ChevronRight, Loader2, MessageCircle, Plus, Search, Users } from 'lucide-react';
import PageHelp from '@/components/common/PageHelp';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { dataService, incrementCounter } from '@/services';
import { toast } from 'sonner';
import CommunityHubCard, { categoryAccent } from '@/components/communities/CommunityHubCard';
import CommunityHubDetail from '@/components/communities/CommunityHubDetail';
import CreateCommunityForm from '@/components/communities/CreateCommunityForm';
import MessagesDrawer from '@/components/communities/MessagesDrawer';

const CATEGORIES = [
  'All', 'Shuls', 'Chesed', 'Learning', 'Events',
  'Singles', 'Parents', 'Neighborhoods', 'Hobbies', 'Lifestyle', 'Values', 'Buy/Sell',
];

const TYPE_TO_CATEGORY = {
  shul: 'Shuls', shuls: 'Shuls',
  chesed: 'Chesed',
  learning: 'Learning',
  events: 'Events',
  singles: 'Singles',
  parents: 'Parents',
  neighborhood: 'Neighborhoods', neighborhoods: 'Neighborhoods',
  hobbies: 'Hobbies',
  lifestyle: 'Lifestyle',
  values: 'Values',
  'buy/sell': 'Buy/Sell', marketplace: 'Buy/Sell', 'buy-sell': 'Buy/Sell',
};

const CATEGORY_TO_TYPE = {
  Shuls: 'shul', Chesed: 'chesed', Learning: 'learning', Events: 'events',
  Singles: 'singles', Parents: 'parents', Neighborhoods: 'neighborhood',
  Hobbies: 'hobbies', Lifestyle: 'lifestyle', Values: 'values', 'Buy/Sell': 'buy-sell',
};

function adaptCommunity(c, joinedIds) {
  const rawType = (c.type || '').toLowerCase();
  const category = TYPE_TO_CATEGORY[rawType] || c.type || 'General';
  return {
    ...c,
    category,
    memberCount: c.follower_count || 0,
    joined: joinedIds.has(c.id),
  };
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function Communities() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mine');
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const { data: rawCommunities = [], isLoading } = useQuery({
    queryKey: ['communities-list'],
    queryFn: () => dataService.entities.Community.list('-follower_count', 100),
    staleTime: 60000,
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ['communities-memberships', currentUser?.id],
    queryFn: () => dataService.entities.UserCommunity.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 60000,
  });

  const joinedIds = useMemo(() => new Set(memberships.map((m) => m.community_id)), [memberships]);

  const communities = useMemo(
    () => rawCommunities.map((c) => adaptCommunity(c, joinedIds)),
    [rawCommunities, joinedIds]
  );

  const selectedCommunity = useMemo(
    () => communities.find((c) => c.id === selectedCommunityId),
    [communities, selectedCommunityId]
  );

  const joinedCommunities = useMemo(() => communities.filter((c) => c.joined), [communities]);
  const joinedCount = joinedCommunities.length;

  const handleJoin = async (communityId) => {
    if (!currentUser) return;
    const isJoined = joinedIds.has(communityId);
    setJoiningId(communityId);
    try {
      if (isJoined) {
        const records = await dataService.entities.UserCommunity.filter({
          user_id: currentUser.id,
          community_id: communityId,
        });
        if (records[0]) await dataService.entities.UserCommunity.delete(records[0].id);
        await incrementCounter('communities', 'follower_count', communityId, -1);
        toast.success('Left community');
      } else {
        await dataService.entities.UserCommunity.create({
          user_id: currentUser.id,
          community_id: communityId,
          role: 'Member',
        });
        await incrementCounter('communities', 'follower_count', communityId, 1);
        toast.success('Joined!');
      }
      queryClient.invalidateQueries({ queryKey: ['communities-list'] });
      queryClient.invalidateQueries({ queryKey: ['communities-memberships', currentUser?.id] });
    } catch {
      toast.error('Something went wrong');
    }
    setJoiningId(null);
  };

  const createCommunity = async (formData) => {
    if (!currentUser) return;
    try {
      const created = await dataService.entities.Community.create({
        name: formData.name,
        description: formData.description,
        type: CATEGORY_TO_TYPE[formData.category] || formData.category.toLowerCase(),
        location: formData.location || 'Local community',
        follower_count: 1,
      });
      await dataService.entities.UserCommunity.create({
        user_id: currentUser.id,
        community_id: created.id,
        role: 'Admin',
      });
      queryClient.invalidateQueries({ queryKey: ['communities-list'] });
      queryClient.invalidateQueries({ queryKey: ['communities-memberships', currentUser?.id] });
      setSelectedCommunityId(created.id);
      setShowCreate(false);
      toast.success('Community created!');
    } catch {
      toast.error('Failed to create community');
    }
  };

  if (selectedCommunity) {
    return (
      <CommunityHubDetail
        community={selectedCommunity}
        currentUser={currentUser}
        onBack={() => setSelectedCommunityId(null)}
        onToggleJoin={() => handleJoin(selectedCommunity.id)}
        joiningId={joiningId}
      />
    );
  }

  return (
    <main className="app-page mobile-safe-bottom">
      <div className="mobile-page-wide px-3 pt-3 pb-6 sm:px-4 sm:pt-4">

        {/* ── Header ── */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-2xl font-black text-slate-950 shrink-0">Communities</h1>
            <PageHelp text="Explore and join Jewish communities. Tap the message icon to coordinate with members." />
            {joinedCount > 0 && (
              <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[12px] font-bold text-emerald-700">
                {joinedCount} joined
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setShowMessages(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-bold text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
              aria-label="Messages"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
              <span className="hidden sm:inline">Messages</span>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-[13px] font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create</span>
            </button>
          </div>
        </div>

        {/* ── Tab switcher ── */}
        <div className="mb-4 flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
          <button
            onClick={() => setActiveTab('mine')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-[13px] font-black transition-all ${
              activeTab === 'mine' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
            }`}
          >
            My Communities
            {joinedCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none ${
                activeTab === 'mine' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
              }`}>
                {joinedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 rounded-[10px] py-2 text-[13px] font-black transition-all ${
              activeTab === 'discover' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
            }`}
          >
            Discover
          </button>
        </div>

        {/* ── Tab content ── */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : activeTab === 'mine' ? (
          <MyCommunitiesView
            communities={joinedCommunities}
            onOpen={setSelectedCommunityId}
            onDiscover={() => setActiveTab('discover')}
          />
        ) : (
          <DiscoverView
            communities={communities}
            onOpen={setSelectedCommunityId}
            onToggleJoin={handleJoin}
            joiningId={joiningId}
          />
        )}
      </div>

      {showCreate && (
        <CreateCommunityForm
          categories={CATEGORIES.filter((c) => c !== 'All')}
          onCreate={createCommunity}
          onClose={() => setShowCreate(false)}
        />
      )}

      <MessagesDrawer
        currentUser={currentUser}
        open={showMessages}
        onClose={() => setShowMessages(false)}
      />
    </main>
  );
}

// ─── My Communities tab ───────────────────────────────────────────────────────

function MyCommunitiesView({ communities, onOpen, onDiscover }) {
  if (communities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
          <Users className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="text-[16px] font-bold text-slate-800">No communities yet</h3>
        <p className="mx-auto mt-2 max-w-[260px] text-[13px] leading-relaxed text-slate-500">
          Discover groups, shuls, and circles that match your neighborhood and interests.
        </p>
        <button
          onClick={onDiscover}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95"
        >
          Discover communities
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {communities.map((c) => (
        <CommunityRowCard key={c.id} community={c} onOpen={() => onOpen(c.id)} />
      ))}
    </div>
  );
}

function CommunityRowCard({ community, onOpen }) {
  const accent = categoryAccent[community.category] || 'from-blue-500 to-slate-700';

  return (
    <div
      onClick={onOpen}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all cursor-pointer hover:border-slate-300 hover:shadow-md active:scale-[0.99]"
    >
      <div
        className={`h-10 bg-gradient-to-br ${accent}`}
        style={
          community.cover_url
            ? { backgroundImage: `url(${community.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      />
      <div className="flex items-center gap-3 px-4 pb-3.5 -mt-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${accent} text-[13px] font-black text-white shadow-md ring-2 ring-white`}
        >
          {community.logo_url ? (
            <img src={community.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(community.name)
          )}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <p className="truncate text-[14px] font-bold text-slate-900">{community.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {(community.memberCount || 0).toLocaleString()} members
            {community.category && community.category !== 'General' && ` · ${community.category}`}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
      </div>
    </div>
  );
}

// ─── Discover tab ─────────────────────────────────────────────────────────────

function DiscoverView({ communities, onOpen, onToggleJoin, joiningId }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return communities.filter((c) => {
      const matchesQuery =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q);
      const matchesCategory = category === 'All' || c.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [communities, query, category]);

  return (
    <div>
      {/* Search */}
      <div className="mb-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search communities..."
            className="app-input pl-10 pr-3 text-sm"
          />
        </label>
      </div>

      {/* Category chips */}
      <div className="mobile-scroll-x mb-4 flex gap-2 pb-1">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`h-8 shrink-0 rounded-full px-3.5 text-[12px] font-semibold transition-all active:scale-95 ${
              category === item
                ? 'bg-slate-950 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-600">No communities found</p>
          <p className="mt-1 text-[13px] text-slate-400">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((c) => (
            <CommunityHubCard
              key={c.id}
              community={c}
              loading={joiningId === c.id}
              onOpen={() => onOpen(c.id)}
              onToggleJoin={() => onToggleJoin(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
