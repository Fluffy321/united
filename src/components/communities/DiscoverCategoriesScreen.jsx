import React, { useMemo } from 'react';
import { Plane, Heart, Briefcase, BookOpen, Calendar, Utensils, MapPin, Flame, Sparkles, Users } from 'lucide-react';

export const DISCOVER_CATEGORIES = [
  {
    key: 'travel',
    label: 'Travel',
    emoji: '✈️',
    icon: Plane,
    description: 'Kosher travel & trip planning',
    gradient: 'from-sky-400 to-cyan-500',
    filterValue: 'Travel',
    bg: '#E0F2FE',
    accent: '#0284C7',
  },
  {
    key: 'chessed',
    label: 'Chessed',
    emoji: '🤝',
    icon: Heart,
    description: 'Volunteering & acts of kindness',
    gradient: 'from-rose-500 to-pink-500',
    filterValue: 'Chessed & Volunteering',
    bg: '#FFF1F2',
    accent: '#E11D48',
  },
  {
    key: 'jobs',
    label: 'Jobs',
    emoji: '💼',
    icon: Briefcase,
    description: 'Careers & professional networking',
    gradient: 'from-emerald-500 to-teal-600',
    filterValue: 'Careers & Networking',
    bg: '#ECFDF5',
    accent: '#059669',
  },
  {
    key: 'learning',
    label: 'Learning',
    emoji: '📚',
    icon: BookOpen,
    description: 'Torah, shiurim & study groups',
    gradient: 'from-indigo-500 to-violet-600',
    filterValue: 'Learning & Torah',
    bg: '#EEF2FF',
    accent: '#4F46E5',
  },
  {
    key: 'events',
    label: 'Events',
    emoji: '🎉',
    icon: Calendar,
    description: 'Meetups, parties & community events',
    gradient: 'from-pink-500 to-fuchsia-500',
    filterValue: 'Social & Events',
    bg: '#FDF4FF',
    accent: '#A21CAF',
  },
  {
    key: 'food',
    label: 'Food',
    emoji: '🍽️',
    icon: Utensils,
    description: 'Kosher dining, recipes & restaurants',
    gradient: 'from-orange-400 to-amber-500',
    filterValue: 'Food & Lifestyle',
    bg: '#FFFBEB',
    accent: '#D97706',
  },
  {
    key: 'local',
    label: 'Local',
    emoji: '🏘️',
    icon: MapPin,
    description: 'Neighborhood & shul communities',
    gradient: 'from-blue-500 to-indigo-600',
    filterValue: 'Local Communities',
    bg: '#EFF6FF',
    accent: '#2563EB',
  },
];

const FALLBACK_COMMUNITIES = [
  { id: 'f1', name: 'Young Israel Woodmere', type: 'Shul', follower_count: 420, description_short: 'Heart of the Five Towns community.' },
  { id: 'f2', name: 'Five Towns Chessed Network', type: 'Other', follower_count: 310, description_short: 'Connecting volunteers with those in need.' },
  { id: 'f3', name: 'HAFTR Day School', type: 'School', follower_count: 280, description_short: 'Leading Jewish day school K–12.' },
  { id: 'f4', name: 'Daf Yomi Five Towns', type: 'Other', follower_count: 195, description_short: 'Daily Talmud study, all levels welcome.' },
  { id: 'f5', name: 'Kosher Travelers Club', type: 'Other', follower_count: 175, description_short: 'Plan kosher trips around the world.' },
  { id: 'f6', name: 'Five Towns Young Professionals', type: 'Other', follower_count: 160, description_short: 'Network, grow, and connect.' },
];

const CAT_GRADIENTS = {
  Shul: 'from-blue-600 to-indigo-600',
  School: 'from-purple-600 to-violet-600',
  Yeshiva: 'from-indigo-600 to-blue-700',
  Other: 'from-slate-500 to-slate-700',
};

function MiniCommunityCard({ community, onOpen }) {
  const gradient = CAT_GRADIENTS[community.type] || CAT_GRADIENTS.Other;
  const initials = community.name?.slice(0, 2)?.toUpperCase() || 'CO';
  return (
    <button
      onClick={() => onOpen?.(community.id)}
      className="flex items-center gap-3 bg-white rounded-2xl px-3 py-2.5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 text-left w-full"
    >
      {community.logo_url ? (
        <img src={community.logo_url} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0`}>
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-slate-900 truncate">{community.name}</p>
        <p className="text-[11px] text-slate-400 truncate">{(community.follower_count || 0).toLocaleString()} members</p>
      </div>
    </button>
  );
}

export default function DiscoverCategoriesScreen({ onSelectCategory, communities = [], myCommunities = [], onOpen }) {
  const allComms = communities.length > 0 ? communities : FALLBACK_COMMUNITIES;

  const trending = useMemo(() =>
    [...allComms].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0)).slice(0, 4),
    [allComms]
  );

  // "Because you joined ___"
  const personalized = useMemo(() => {
    if (myCommunities.length === 0) return null;
    const base = myCommunities[0];
    // Find similar type
    const similar = allComms.filter(c => c.id !== base.id && (c.type === base.type || c.category === base.category)).slice(0, 3);
    if (similar.length === 0) return null;
    return { baseName: base.name, similar };
  }, [myCommunities, allComms]);

  // "Near you" — just pick local/shul communities
  const nearYou = useMemo(() =>
    allComms.filter(c => c.type === 'Shul' || c.neighborhood || c.location).slice(0, 3),
    [allComms]
  );

  const nearYouFallback = allComms.slice(0, 3);

  return (
    <div className="space-y-7 pb-4">
      {/* Hero section */}
      <div className="rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 60%, #db2777 100%)', minHeight: 120 }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative px-5 py-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-[12px] font-bold text-white/80 uppercase tracking-widest">Explore</span>
          </div>
          <h2 className="text-[22px] font-black text-white leading-tight">Discover Communities</h2>
          <p className="text-[13px] text-white/70 mt-1">Find your people. Join the conversation.</p>
        </div>
      </div>

      {/* Category Cards */}
      <div>
        <h3 className="text-[16px] font-bold text-slate-900 mb-3">Browse by Category</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Featured large card — first category */}
          <button
            onClick={() => onSelectCategory(DISCOVER_CATEGORIES[0].filterValue)}
            className={`col-span-2 text-left rounded-3xl p-5 bg-gradient-to-br ${DISCOVER_CATEGORIES[0].gradient} text-white shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-150 relative overflow-hidden`}
          >
            <div className="absolute right-4 bottom-0 text-[80px] opacity-20 leading-none select-none">{DISCOVER_CATEGORIES[0].emoji}</div>
            <div className="relative">
              <div className="text-3xl mb-2">{DISCOVER_CATEGORIES[0].emoji}</div>
              <div className="text-[20px] font-black leading-snug">{DISCOVER_CATEGORIES[0].label}</div>
              <div className="text-[13px] opacity-80 mt-1">{DISCOVER_CATEGORIES[0].description}</div>
            </div>
          </button>

          {/* Remaining categories in 2-col grid */}
          {DISCOVER_CATEGORIES.slice(1).map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => onSelectCategory(cat.filterValue)}
                className={`text-left rounded-3xl p-4 bg-gradient-to-br ${cat.gradient} text-white shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.97] transition-all duration-150 relative overflow-hidden`}
              >
                <div className="absolute right-2 bottom-0 text-[52px] opacity-15 leading-none select-none">{cat.emoji}</div>
                <div className="relative">
                  <div className="text-2xl mb-1.5">{cat.emoji}</div>
                  <div className="text-[15px] font-bold leading-snug">{cat.label}</div>
                  <div className="text-[11px] opacity-75 mt-0.5 leading-snug">{cat.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending Communities */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-orange-500" />
          <h3 className="text-[16px] font-bold text-slate-900">Trending Communities</h3>
        </div>
        <div className="space-y-2">
          {trending.map(c => <MiniCommunityCard key={c.id} community={c} onOpen={onOpen} />)}
        </div>
      </div>

      {/* Because you joined */}
      {personalized && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h3 className="text-[16px] font-bold text-slate-900">
              Because you joined <span className="text-violet-600 truncate">{personalized.baseName}</span>
            </h3>
          </div>
          <div className="space-y-2">
            {personalized.similar.map(c => <MiniCommunityCard key={c.id} community={c} onOpen={onOpen} />)}
          </div>
        </div>
      )}

      {/* Near You */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-blue-500" />
          <h3 className="text-[16px] font-bold text-slate-900">Near You</h3>
        </div>
        <div className="space-y-2">
          {(nearYou.length > 0 ? nearYou : nearYouFallback).map(c => (
            <MiniCommunityCard key={c.id} community={c} onOpen={onOpen} />
          ))}
        </div>
      </div>

      {/* All categories strip */}
      <div className="rounded-2xl bg-slate-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-white" />
          <h3 className="text-[14px] font-bold text-white">All Categories</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {DISCOVER_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.filterValue)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}