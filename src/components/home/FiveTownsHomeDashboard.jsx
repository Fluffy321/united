import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Baby,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronRight,
  HeartHandshake,
  HeartPulse,
  MapPin,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Utensils,
  Users,
} from 'lucide-react';
import FiveTownsDirectory from './FiveTownsDirectory';
import { DIRECTORY_GROUPS, FIVE_TOWNS_LISTINGS } from '@/lib/directory/fiveTownsDirectory';
import { feedText } from '@/lib/feed/feedRanking';

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

function firstName(user) {
  const name = user?.display_name || user?.full_name || user?.first_name || '';
  return name.trim().split(/\s+/)[0] || '';
}

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

function ActionRow({ icon: Icon, title, detail, onClick, tone = 'bg-[#EEF3FF] text-[#275FDF]' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-3 rounded-[20px] border border-slate-200/90 bg-white px-3.5 py-3 text-left shadow-[0_8px_24px_rgba(15,28,46,0.045)] active:scale-[0.99]"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-black leading-tight tracking-[-0.015em] text-slate-900">{title}</span>
        <span className="mt-1 block text-[11px] font-semibold leading-snug text-slate-500">{detail}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </button>
  );
}

function SmallCard({ icon: Icon, eyebrow, title, detail, onClick, tone = 'bg-[#EEF3FF] text-[#275FDF]' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[126px] rounded-[22px] border border-slate-200/90 bg-white p-3.5 text-left shadow-[0_8px_24px_rgba(15,28,46,0.045)] active:scale-[0.98]"
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-[18px] w-[18px]" /></span>
      {eyebrow && <span className="mt-3 block text-[9px] font-black uppercase tracking-[0.13em] text-[#2861E8]">{eyebrow}</span>}
      <span className={`${eyebrow ? 'mt-1' : 'mt-3'} block text-[13px] font-black leading-tight tracking-[-0.02em] text-slate-900`}>{title}</span>
      <span className="mt-1 block text-[10px] font-semibold leading-snug text-slate-500">{detail}</span>
    </button>
  );
}

export default function FiveTownsHomeDashboard({
  currentUser,
  posts = [],
  communityGroups = [],
  isLoading = false,
  isError = false,
  onRetry,
  onOpenPost,
  onOpenLocation,
  onNavigate,
  onPublish,
  onOpenCalendar,
  onOpenMessages,
  onOpenNotifications,
  onReportCorrection,
}) {
  const [directoryGroupId, setDirectoryGroupId] = useState(null);
  const name = firstName(currentUser);

  const counts = useMemo(() => DIRECTORY_GROUPS.reduce((result, group) => ({
    ...result,
    [group.id]: FIVE_TOWNS_LISTINGS.filter((listing) => listing.groupId === group.id).length,
  }), {}), []);

  const featuredListings = useMemo(() => {
    const preferredGroups = ['food', 'jewish-life', 'things-to-do', 'shopping'];
    return preferredGroups
      .map((groupId) => FIVE_TOWNS_LISTINGS.find((listing) => listing.groupId === groupId))
      .filter(Boolean)
      .slice(0, 2);
  }, []);

  const livePosts = posts.slice(0, 3);
  const openDirectory = (groupId = '') => setDirectoryGroupId(groupId);
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

        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0A1B3E] via-[#123778] to-[#2861E8] p-5 text-white shadow-[0_18px_40px_rgba(24,68,157,0.22)]">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.16em] text-blue-200"><span>Your Five Towns</span><span>Today</span></div>
            <h1 className="mt-6 max-w-[280px] text-[25px] font-black leading-[1.02] tracking-[-0.055em]">Everything local, without the noise.</h1>
            <p className="mt-2 max-w-[300px] text-[11px] font-semibold leading-relaxed text-blue-100">Jewish places, useful updates, plans, people, and help—organized around what you care about.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[[FIVE_TOWNS_LISTINGS.length, 'sourced listings'], ['5', 'local towns'], ['3', 'map choices']].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-2.5"><strong className="block text-[16px] font-black">{value}</strong><span className="mt-0.5 block text-[8px] font-bold text-blue-100">{label}</span></div>
              ))}
            </div>
          </div>
        </section>

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
          <SectionHeading title={`Picked for ${name || 'you'}`} action="Adjust" onAction={() => navigate('/Settings')} />
          <div className="grid grid-cols-2 gap-2.5">
            {featuredListings.map((listing) => (
              <SmallCard key={listing.id} icon={listing.groupId === 'food' ? Utensils : Star} eyebrow={listing.town} title={listing.name} detail={listing.address} onClick={() => openDirectory(listing.groupId)} tone={GROUP_TONES[listing.groupId]} />
            ))}
          </div>
        </section>

        <section className="space-y-2.5">
          <SectionHeading title="Places worth knowing" action="Open all places" onAction={() => openDirectory('')} />
          <div className="grid grid-cols-2 gap-2.5">
            <SmallCard icon={Utensils} eyebrow="Food" title="Find somewhere kosher" detail={`${counts.food} sourced food options`} onClick={() => openDirectory('food')} tone={GROUP_TONES.food} />
            <SmallCard icon={ShoppingBag} eyebrow="Local shops" title="Shop around the Five Towns" detail={`${counts.shopping} sourced places`} onClick={() => openDirectory('shopping')} tone={GROUP_TONES.shopping} />
          </div>
        </section>

        <section className="space-y-2.5">
          <SectionHeading title="Your city today" action="See all" onAction={() => navigate('/Feed?brief=1')} />
          {isLoading && <div className="h-20 animate-pulse rounded-[20px] bg-slate-200/70" />}
          {isError && !livePosts.length && (
            <ActionRow icon={Bell} title="Updates could not load" detail="Tap to try again" onClick={onRetry} />
          )}
          {!isLoading && !livePosts.length && !isError && (
            <ActionRow icon={Bell} title="No new local updates right now" detail="The directory and city tools are still ready" onClick={() => openDirectory('')} />
          )}
          {livePosts.map((post) => (
            <ActionRow key={post.id} icon={Bell} title={feedText(post)} detail={post.location_text || post.source_name || 'Five Towns update'} onClick={() => onOpenPost?.(post)} />
          ))}
        </section>

        <section className="space-y-2.5">
          <SectionHeading title="People and groups" action="Browse communities" onAction={() => navigate('/Communities')} />
          {communityGroups.length ? communityGroups.slice(0, 2).map((group) => (
            <ActionRow key={group.id} icon={Users} title={group.name} detail={group.type || 'Joined community'} onClick={() => navigate(`/communities/${group.id}`)} tone="bg-violet-50 text-violet-700" />
          )) : (
            <ActionRow icon={Users} title="Browse communities" detail="Find real local groups when you are ready" onClick={() => navigate('/Communities')} tone="bg-violet-50 text-violet-700" />
          )}
        </section>

        <section className="space-y-2.5">
          <SectionHeading title="Jewish life" action="Open Jewish life" onAction={() => openDirectory('jewish-life')} />
          <ActionRow icon={Star} title={`${counts['jewish-life']} shuls, mikvahs, and learning resources`} detail="Addresses, public sources, and navigation" onClick={() => openDirectory('jewish-life')} tone={GROUP_TONES['jewish-life']} />
          <ActionRow icon={BookOpen} title="Jewish calendar and zmanim" detail="Open today’s times and calendar" onClick={onOpenCalendar} tone="bg-amber-50 text-amber-700" />
        </section>

        <section className="space-y-2.5">
          <SectionHeading title="Opportunities" action="Explore" onAction={() => navigate('/Marketplace')} />
          <ActionRow icon={BriefcaseBusiness} title="Jobs and business connections" detail="Browse live opportunities posted in JUnited" onClick={() => navigate('/Marketplace')} tone="bg-sky-50 text-sky-700" />
          <ActionRow icon={Store} title="Local professional services" detail={`${counts.services} sourced Five Towns options`} onClick={() => openDirectory('services')} tone={GROUP_TONES.services} />
        </section>

        <section className="space-y-2.5">
          <SectionHeading title="Help nearby" action="Open Help" onAction={() => navigate('/MitzvahCircle')} />
          <ActionRow icon={HeartHandshake} title="Ask for help or offer it" detail="See real needs and offers in your area" onClick={() => navigate('/MitzvahCircle')} tone="bg-emerald-50 text-emerald-700" />
        </section>

        <section className="space-y-2.5">
          <SectionHeading title="Complete Jewish directory" action="Open everything" onAction={() => openDirectory('')} />
          <div className="grid grid-cols-2 gap-2.5">
            <SmallCard icon={Star} eyebrow="Jewish life" title="Shuls and minyanim" detail="Sources and directions" onClick={() => openDirectory('jewish-life')} tone={GROUP_TONES['jewish-life']} />
            <SmallCard icon={Baby} eyebrow="Families" title="Schools and camps" detail="Browse by town" onClick={() => openDirectory('family')} tone={GROUP_TONES.family} />
            <SmallCard icon={HeartPulse} eyebrow="Health" title="Doctors and wellness" detail="Local sourced listings" onClick={() => openDirectory('health')} tone={GROUP_TONES.health} />
            <SmallCard icon={Sparkles} eyebrow="Things to do" title="Activities nearby" detail="Options around the Five Towns" onClick={() => openDirectory('things-to-do')} tone={GROUP_TONES['things-to-do']} />
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3.5 py-3 text-[10px] font-bold leading-snug text-emerald-800">
            <Star className="h-4 w-4 shrink-0" /> Sources are shown. Addresses can be corrected.
          </div>
        </section>

        <button type="button" onClick={onPublish} className="flex min-h-14 w-full items-center justify-between rounded-[20px] bg-blue-600 px-5 text-left text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]">
          <span><strong className="block text-[14px] font-black">Add something useful</strong><span className="mt-0.5 block text-[10px] font-semibold text-slate-300">Post an update, event, offer, or request</span></span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {directoryGroupId !== null && typeof document !== 'undefined' && createPortal(
        <FiveTownsDirectory
          initialGroupId={directoryGroupId}
          onClose={() => setDirectoryGroupId(null)}
          onReportCorrection={onReportCorrection}
        />,
        document.body,
      )}
    </main>
  );
}
