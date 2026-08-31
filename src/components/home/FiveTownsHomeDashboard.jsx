import React, { useEffect, useMemo, useState } from 'react';
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
import HomePreferenceReason from './HomePreferenceReason';
import HomeSectionHeading from './HomeSectionHeading';
import HomePeopleAndPlans from './HomePeopleAndPlans';
import UsefulNearbyCard from './UsefulNearbyCard';
import {
  DIRECTORY_GROUPS,
  FIVE_TOWNS_LISTINGS,
  featuredDirectoryListings,
} from '@/lib/directory/fiveTownsDirectory';
import { buildCircleActivity, buildHomeEventWindow } from '@/lib/home/homeActivity';
import {
  homePlaceReason,
  loadHomePlacePreferences,
  rankHomeListings,
  saveHomePlacePreferences,
  updateHomePlacePreference,
} from '@/lib/home/homePlacePreferences';

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

const HOME_DIRECTORY_GROUP_IDS = new Set(['jewish-life', 'food', 'family', 'things-to-do']);

function initials(user) {
  const name = user?.display_name || user?.full_name || user?.first_name || 'J';
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
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
  onTuneHome,
  onReportCorrection,
  dailyInfo = {},
}) {
  const [directoryState, setDirectoryState] = useState(null);
  const [placePreferences, setPlacePreferences] = useState(() => loadHomePlacePreferences(currentUser?.id));

  useEffect(() => {
    setPlacePreferences(loadHomePlacePreferences(currentUser?.id));
  }, [currentUser?.id]);

  const counts = useMemo(() => DIRECTORY_GROUPS.reduce((result, group) => ({
    ...result,
    [group.id]: FIVE_TOWNS_LISTINGS.filter((listing) => listing.groupId === group.id).length,
  }), {}), []);

  const featuredListingsBase = useMemo(() => featuredDirectoryListings(FIVE_TOWNS_LISTINGS, { limit: 100 })
    .sort((left, right) => Number(Boolean(right.imageUrl)) - Number(Boolean(left.imageUrl)))
    .slice(0, 8), []);
  const featuredListings = useMemo(
    () => rankHomeListings(featuredListingsBase, placePreferences),
    [featuredListingsBase, placePreferences],
  );

  const usefulNearbyBase = useMemo(() => [
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
  const usefulNearby = useMemo(
    () => rankHomeListings(usefulNearbyBase, placePreferences),
    [usefulNearbyBase, placePreferences],
  );

  const circleActivity = useMemo(() => buildCircleActivity({
    communities: communityGroups,
    posts,
  }), [communityGroups, posts]);
  const eventWindow = useMemo(() => buildHomeEventWindow({ events }), [events]);
  const openDirectory = (groupId = '', listingId = '') => setDirectoryState({ groupId, listingId });
  const navigate = (path) => onNavigate?.(path);
  const updatePlacePreference = (groupId, action) => {
    setPlacePreferences((value) => {
      const next = updateHomePlacePreference(value, groupId, action);
      return saveHomePlacePreferences(currentUser?.id, next);
    });
  };

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
        <div className="flex min-h-12 items-center rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,28,46,0.045)]">
          <button type="button" onClick={() => openDirectory('')} className="flex min-h-12 min-w-0 flex-1 items-center gap-2 px-4 text-left">
            <Search className="h-[18px] w-[18px] shrink-0 text-[#2861E8]" />
            <span className="truncate text-[13px] font-semibold text-slate-400">Find anything Jewish nearby</span>
          </button>
          <button type="button" aria-label="Tune Home" onClick={onTuneHome} className="min-h-11 shrink-0 border-l border-slate-100 px-3 text-[11px] font-black text-[#2861E8]">Tune</button>
        </div>

        <FiveTownsDailyPanel
          weather={dailyInfo.weather}
          jewishTimes={dailyInfo.jewishTimes}
          traffic={dailyInfo.traffic}
        />

        <section className="space-y-2.5">
          <HomeSectionHeading eyebrow="Everything Jewish" title="Find something" action="All listings" onAction={() => openDirectory('')} titleId="home-find-title" />
          <div className="grid grid-cols-4 gap-2">
            {DIRECTORY_GROUPS.filter((group) => HOME_DIRECTORY_GROUP_IDS.has(group.id)).map((group) => {
              const Icon = GROUP_ICONS[group.id];
              return (
                <button key={group.id} data-home-directory-shortcut={group.id} type="button" onClick={() => openDirectory(group.id)} className="min-h-[88px] rounded-[19px] border border-slate-200/90 bg-white px-1.5 py-2.5 text-center shadow-[0_6px_16px_rgba(15,28,46,0.04)] active:scale-95">
                  <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl ${GROUP_TONES[group.id]}`}><Icon className="h-[18px] w-[18px]" /></span>
                  <span className="mt-2 block text-[9px] font-black leading-tight">{group.label}</span>
                  <span className="mt-0.5 block text-[8px] font-bold text-slate-400">{counts[group.id]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2.5">
          <HomeSectionHeading eyebrow="Close to you" title="Worth knowing nearby" action="See all" onAction={() => openDirectory('')} titleId="home-nearby-title" />
          <div className="-mx-3.5 flex snap-x gap-2.5 overflow-x-auto px-3.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featuredListings.map((listing) => (
              <div key={listing.id} className="snap-start">
                <FeaturedPlaceCard listing={listing} onOpen={() => openDirectory(listing.groupId, listing.id)} />
                <HomePreferenceReason
                  reason={homePlaceReason(placePreferences, listing.groupId)}
                  onPreference={(action) => updatePlacePreference(listing.groupId, action)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2.5">
          <HomeSectionHeading eyebrow="Pick a mood" title="Useful nearby" action="Everything" onAction={() => openDirectory('')} titleId="home-useful-title" />
          <div className="-mx-3.5 flex snap-x gap-2.5 overflow-x-auto px-3.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {usefulNearby.map((need) => (
              <div key={need.title} className="snap-start">
                <UsefulNearbyCard {...need} onOpen={() => openDirectory(need.groupId)} />
                <HomePreferenceReason
                  reason={homePlaceReason(placePreferences, need.groupId)}
                  onPreference={(action) => updatePlacePreference(need.groupId, action)}
                />
              </div>
            ))}
          </div>
        </section>

        <HomePeopleAndPlans
          activity={circleActivity}
          eventWindow={eventWindow}
          circlesLoading={isLoading}
          eventsLoading={eventsLoading}
          eventsError={eventsError}
          onOpenCommunity={(item) => navigate(item.href)}
          onBrowseCommunities={() => navigate('/Communities')}
          onRetryEvents={onRetryEvents}
          onOpenEvent={onOpenEvent}
          onOpenEvents={onOpenEvents}
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
