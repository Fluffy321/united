import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Baby,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  HeartPulse,
  MapPin,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
} from 'lucide-react';
import FiveTownsDirectory from './FiveTownsDirectory';
import FiveTownsDailyPanel from './FiveTownsDailyPanel';
import FeaturedPlaceCard from './FeaturedPlaceCard';
import HomeCircleActivity from './HomeCircleActivity';
import HomeTonight from './HomeTonight';
import UsefulNearbyCard from './UsefulNearbyCard';
import {
  DIRECTORY_GROUPS,
  FIVE_TOWNS_LISTINGS,
  featuredDirectoryListings,
} from '@/lib/directory/fiveTownsDirectory';
import { buildCircleActivity, buildHomeEventWindow } from '@/lib/home/homeActivity';

const GROUP_ICONS = {
  'jewish-life': Star,
  food: Utensils,
  family: Baby,
  shopping: ShoppingBag,
  health: HeartPulse,
  services: BriefcaseBusiness,
  community: Building2,
  'things-to-do': Sparkles,
};

const GROUP_TONES = {
  'jewish-life': 'bg-indigo-50 text-indigo-700',
  food: 'bg-amber-50 text-amber-700',
  family: 'bg-sky-50 text-sky-700',
  shopping: 'bg-pink-50 text-pink-700',
  health: 'bg-emerald-50 text-emerald-700',
  services: 'bg-slate-100 text-slate-700',
  community: 'bg-violet-50 text-violet-700',
  'things-to-do': 'bg-orange-50 text-orange-700',
};

function initials(user) {
  const name = user?.display_name || user?.full_name || user?.first_name || 'J';
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function SectionHeading({ title, action, onAction }) {
  return (
    <div className="flex items-end justify-between gap-3 px-0.5 pt-1">
      <h2 className="text-[20px] font-black tracking-[-0.045em] text-[#101A2E]">{title}</h2>
      {action && (
        <button type="button" onClick={onAction} className="min-h-9 shrink-0 text-[11px] font-black text-[#2861E8]">
          {action}
        </button>
      )}
    </div>
  );
}

export default function FiveTownsHomeDashboard({
  currentUser,
  posts = [],
  communityGroups = [],
  events = [],
  isLoading = false,
  eventsLoading = false,
  eventsError = false,
  onRetryEvents,
  onOpenEvent,
  onOpenEvents,
  onAddEvent,
  onOpenLocation,
  onNavigate,
  onOpenCalendar,
  onOpenMessages,
  onOpenNotifications,
  onReportCorrection,
  dailyInfo = {},
}) {
  const [directoryState, setDirectoryState] = useState(null);

  const counts = useMemo(() => DIRECTORY_GROUPS.reduce((result, group) => ({
    ...result,
    [group.id]: FIVE_TOWNS_LISTINGS.filter((listing) => listing.groupId === group.id).length,
  }), {}), []);

  const featuredListings = useMemo(() => featuredDirectoryListings(FIVE_TOWNS_LISTINGS, { limit: 100 })
    .sort((left, right) => Number(Boolean(right.imageUrl)) - Number(Boolean(left.imageUrl)))
    .slice(0, 8), []);

  const usefulNearby = useMemo(() => [
    {
      title: 'Get the kids out',
      detail: 'Parks, pools, activities, and family plans',
      groupId: 'things-to-do',
      tags: ['Kids', 'Pool', 'Sports', 'Outside'],
      tone: 'from-cyan-600 to-blue-700',
    },
    {
      title: 'Need a calm hour',
      detail: 'Coffee, a walk, books, or somewhere quiet',
      groupId: 'shopping',
      tags: ['Coffee', 'Walk', 'Quiet', 'Books'],
      tone: 'from-emerald-600 to-teal-800',
    },
    {
      title: 'Make a full afternoon',
      detail: 'Food plus something nearby to do',
      groupId: 'things-to-do',
      tags: ['Kids', 'Outside', 'Sit-down'],
      tone: 'from-orange-500 to-rose-700',
    },
    {
      title: 'Go out tonight',
      detail: 'Dinner, dessert, and easy local options',
      groupId: 'food',
      tags: ['Dinner', 'Date night', 'Dessert'],
      tone: 'from-violet-700 to-indigo-950',
    },
    {
      title: 'Guests are visiting',
      detail: 'Hosting, food, gifts, and local stops',
      groupId: 'shopping',
      tags: ['Shabbat', 'Prepared food', 'Gifts'],
      tone: 'from-amber-500 to-orange-700',
    },
  ].map((need) => {
    const matches = featuredDirectoryListings(FIVE_TOWNS_LISTINGS, { limit: 100 })
      .filter((listing) => listing.groupId === need.groupId || listing.tags.some((tag) => need.tags.includes(tag)));
    return {
      ...need,
      count: matches.length,
      imageUrl: matches.find((listing) => listing.imageUrl)?.imageUrl || '',
    };
  }), []);

  const circleActivity = useMemo(() => buildCircleActivity({
    communities: communityGroups,
    posts,
  }), [communityGroups, posts]);
  const eventWindow = useMemo(() => buildHomeEventWindow({ events }), [events]);
  const openDirectory = (groupId = '', listingId = '') => setDirectoryState({ groupId, listingId });
  const navigate = (path) => onNavigate?.(path);

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#F5F7FB] pb-[calc(104px+env(safe-area-inset-bottom))] text-[#101A2E]">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onOpenLocation} className="min-h-11 text-left">
            <span className="block text-[22px] font-black tracking-[-0.055em]">JUnited</span>
            <span className="mt-0.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#2861E8]">
              <MapPin className="h-3 w-3" /> Five Towns
            </span>
          </button>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={onOpenCalendar} aria-label="Jewish calendar" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"><CalendarDays className="h-[18px] w-[18px]" /></button>
            <button type="button" onClick={onOpenMessages} aria-label="Messages" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"><MessageCircle className="h-[18px] w-[18px]" /></button>
            <button type="button" onClick={onOpenNotifications} aria-label="Notifications" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"><Bell className="h-[18px] w-[18px]" /></button>
            <button type="button" onClick={() => navigate('/Profile')} aria-label="Me" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B1D42] text-[11px] font-black text-white">{initials(currentUser)}</button>
          </div>
        </div>
      </header>

      <div className="space-y-5 px-3.5 pt-3.5">
        <button type="button" onClick={() => openDirectory('')} className="flex min-h-12 w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-left shadow-[0_8px_20px_rgba(15,28,46,0.045)]">
          <Search className="h-[18px] w-[18px] shrink-0 text-[#2861E8]" />
          <span className="text-[13px] font-semibold text-slate-400">Find food, shuls, schools, shops, anything</span>
        </button>

        <FiveTownsDailyPanel
          weather={dailyInfo.weather}
          jewishTimes={dailyInfo.jewishTimes}
          traffic={dailyInfo.traffic}
        />

        <section className="space-y-2.5">
          <SectionHeading title="Jewish directory" action="All listings" onAction={() => openDirectory('')} />
          <div className="grid grid-cols-4 gap-2">
            {DIRECTORY_GROUPS.map((group) => {
              const Icon = GROUP_ICONS[group.id];
              return (
                <button key={group.id} type="button" onClick={() => openDirectory(group.id)} className="min-h-[88px] rounded-[19px] border border-slate-200/90 bg-white px-1.5 py-2.5 text-center shadow-[0_6px_16px_rgba(15,28,46,0.04)] active:scale-95">
                  <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl ${GROUP_TONES[group.id]}`}><Icon className="h-[18px] w-[18px]" /></span>
                  <span className="mt-2 block text-[9px] font-black leading-tight">{group.label}</span>
                  <span className="mt-0.5 block text-[8px] font-bold text-slate-400">{counts[group.id]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2.5">
          <SectionHeading title="Nearby worth knowing" action="Open all places" onAction={() => openDirectory('')} />
          <div className="-mx-3.5 flex snap-x gap-2.5 overflow-x-auto px-3.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featuredListings.map((listing) => (
              <div key={listing.id} className="snap-start"><FeaturedPlaceCard listing={listing} onOpen={() => openDirectory(listing.groupId, listing.id)} /></div>
            ))}
          </div>
        </section>

        <section className="space-y-2.5">
          <SectionHeading title="Useful nearby" action="See everything" onAction={() => openDirectory('')} />
          <div className="-mx-3.5 flex snap-x gap-2.5 overflow-x-auto px-3.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {usefulNearby.map((need) => (
              <div key={need.title} className="snap-start"><UsefulNearbyCard {...need} onOpen={() => openDirectory(need.groupId)} /></div>
            ))}
          </div>
        </section>

        <HomeCircleActivity
          activity={circleActivity}
          isLoading={isLoading}
          onOpenCommunity={(item) => navigate(item.href)}
          onBrowseCommunities={() => navigate('/Communities')}
        />

        <HomeTonight
          window={eventWindow}
          isLoading={eventsLoading}
          isError={eventsError}
          onRetry={onRetryEvents}
          onOpenEvent={onOpenEvent}
          onOpenAll={onOpenEvents}
          onAddEvent={onAddEvent}
        />
      </div>

      {directoryState !== null && typeof document !== 'undefined' && createPortal(
        <FiveTownsDirectory
          initialGroupId={directoryState.groupId}
          initialListingId={directoryState.listingId}
          onClose={() => setDirectoryState(null)}
          onReportCorrection={onReportCorrection}
        />,
        document.body,
      )}
    </main>
  );
}
