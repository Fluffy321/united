import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Search, X, AlertCircle, Map, Calendar, Compass, ArrowUpRight, MessageCircleMore, Sparkles, BookOpenText, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProfileSetup from '@/components/profile/ProfileSetup';
import CommunityGroupPage from '@/components/communities/CommunityGroupPage';
import CreateCommunityModal from '@/components/communities/CreateCommunityModal';
import FeaturedHeroCard from '@/components/communities/FeaturedHeroCard.jsx';
import FeaturedSecondaryCard from '@/components/communities/FeaturedSecondaryCard.jsx';
import DiscoverCategoryCards, { DISCOVER_CATEGORIES } from '@/components/communities/DiscoverCategoriesScreen';
import CommunityInterestOnboarding from '@/components/communities/CommunityInterestOnboarding';
import SuggestedCommunities from '@/components/communities/SuggestedCommunities';
import DiscoverFilters, { applyExtraFilters } from '@/components/communities/DiscoverFilters';
import { toast } from 'sonner';
import LiveNowPanel from '@/components/common/LiveNowPanel';
import { buildCommunityActionItems, getCommunityActionCopy } from '@/lib/liveNow';

const CACHE_KEY = 'communities_v3_cache';
const FEATURED_SHULS = ["Young Israel Woodmere", "Chabad of Woodmere", "Beth Shalom", "Shaaray Tefila"];

const CATEGORIES = [
  { key: 'all', label: 'All', value: null },
  { key: 'official', label: '✅ Official', value: 'Official / Daily' },
  { key: 'local', label: '📍 Five Towns', value: 'Local Communities' },
  { key: 'support', label: '🛡️ Private Support', value: 'Private Support' },
  { key: 'shabbos', label: '🍽️ Shabbos', value: 'Shabbos & Meals' },
  { key: 'sports', label: '🏀 Sports', value: 'Sports & Fitness' },
  { key: 'food', label: '🥯 Kosher Food', value: 'Food & Lifestyle' },
  { key: 'parents', label: '🎒 Parents & School', value: 'Programs & Youth' },
  { key: 'chessed', label: '🤝 Chessed & Volunteering', value: 'Chessed & Volunteering' },
  { key: 'careers', label: '💼 Careers & Networking', value: 'Careers & Networking' },
  { key: 'learning', label: '📚 Learning & Torah', value: 'Learning & Torah' },
];

const TYPE_TO_CATEGORY = {
  School: 'Schools & Yeshivas',
  Yeshiva: 'Schools & Yeshivas',
  Seminary: 'Schools & Yeshivas',
  Shul: 'Local Communities',
  Camp: 'Programs & Youth',
  Other: null,
};



const TYPE_GRADIENTS = {
  Shul:     'from-blue-600 to-indigo-600',
  School:   'from-purple-600 to-violet-600',
  Yeshiva:  'from-indigo-600 to-blue-700',
  Seminary: 'from-pink-500 to-rose-600',
  Camp:     'from-green-500 to-teal-600',
  Other:    'from-orange-500 to-amber-600',
};

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

function getActivityBadge(community) {
  const joinsThisWeek = community.joins_this_week || 0;
  const postsThisWeek = community.posts_this_week || 0;
  const commentsThisWeek = community.comments_this_week || 0;
  const totalActivity = joinsThisWeek * 2 + postsThisWeek + commentsThisWeek;

  // "Hot" requires actual recent activity (not a static hash of the ID)
  if (totalActivity >= 10) return { label: '🔥 Hot', color: 'bg-red-50 text-red-600' };
  if (totalActivity >= 3 || joinsThisWeek > 0) return { label: '🟢 Active', color: 'bg-green-50 text-green-700' };
  // Brand-new communities (created within 7 days)
  return { label: '✨ New', color: 'bg-violet-50 text-violet-600' };
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getMockActivity(id, community) {
  if (community) {
    return community.latestDiscussion || community.latest_discussion || community.latest_post_title || '';
  }
  return '';
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

function getFriendlyPulse(community) {
  return getCommunityActionCopy(community).promise;
}

function getProfileFaces(community) {
  const pool = [
    community.member_initials,
    community.memberInitials,
    community.recent_member_initials,
    community.recentMemberInitials,
  ].filter(Boolean);

  return pool
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((label) => String(label).trim().toUpperCase().slice(0, 2))
    .filter(Boolean)
    .slice(0, 3);
}

function ProfileFaces({ community, compact = false }) {
  const faces = getProfileFaces(community);
  const colors = ['from-sky-500 to-blue-600', 'from-rose-400 to-pink-500', 'from-emerald-500 to-teal-500'];
  if (!faces.length) return null;

  return (
    <div className="flex items-center">
      {faces.map((face, index) => (
        <div
          key={`${community.id || community.name}-${face}-${index}`}
          className={`${compact ? 'h-6 w-6 text-[9px]' : 'h-7 w-7 text-[10px]'} -ml-2 first:ml-0 rounded-full border-2 border-white bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center font-black text-white shadow-sm`}
        >
          {face}
        </div>
      ))}
    </div>
  );
}

const FIVE_TOWNS_ROOM_BLUEPRINTS = [
  {
    id: 'seed-five-towns-news',
    match: ['five towns news', 'five towns local', 'updates', 'talk'],
    name: 'Five Towns Talk',
    icon: '💬',
    label: 'Main room',
    purpose: 'One shared neighborhood thread for questions, updates, recommendations, alerts, and real neighbor help.',
    prompt: 'Ask the neighborhood',
    gradient: 'from-slate-950 via-blue-900 to-cyan-600',
  },
  {
    id: 'seed-sports',
    match: ['sports', 'basketball', 'football', 'gym'],
    name: "Who's Playing Tonight",
    icon: '🏀',
    label: 'Game room',
    purpose: 'Find pickup games, fill teams, get gym partners, and make tonight’s plans without ten group chats.',
    prompt: 'Find a game',
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
  },
  {
    id: 'seed-shabbos-hosts',
    match: ['shabbos hosts', 'shabbos plans', 'zmanim', 'hosts'],
    name: 'Shabbos Plans',
    icon: '🕯️',
    label: 'Before Shabbos',
    purpose: 'Meals, hosting, guests, zmanim, rides, extras, and everything people need before Shabbos.',
    prompt: 'Make a Shabbos plan',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
  },
  {
    id: 'seed-shul-minyan',
    match: ['shul', 'minyan', 'minyanim'],
    name: 'Minyan & Shul Updates',
    icon: '🕍',
    label: 'Live minyanim',
    purpose: 'Minyan help, shiurim, kiddush updates, lost items, and shul rides in one useful room.',
    prompt: 'Post a shul update',
    gradient: 'from-indigo-600 via-blue-700 to-slate-950',
  },
  {
    id: 'seed-chesed-updates',
    match: ['chesed', 'mitzvah', 'help'],
    name: 'Chesed Opportunities',
    icon: '🤝',
    label: 'Help now',
    purpose: 'See open needs, offer help, close the loop, and turn community care into completed mitzvahs.',
    prompt: 'Help someone now',
    gradient: 'from-rose-500 via-pink-600 to-red-600',
  },
  {
    id: 'seed-kosher-food',
    match: ['kosher food', 'restaurant', 'bakery', 'lunch'],
    name: 'Kosher Food & Lunch Spots',
    icon: '🥙',
    label: 'Food pulse',
    purpose: 'What is open, what is good, what has a line, what is verified, and what people are ordering now.',
    prompt: 'Share a food tip',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
  },
  {
    id: 'seed-carpools-rides',
    match: ['carpool', 'rides', 'ride'],
    name: 'Rides & Carpools',
    icon: '🚗',
    label: 'Moving now',
    purpose: 'Safe ride requests, offers, school carpools, airport rides, and last-minute local pickups.',
    prompt: 'Coordinate a ride',
    gradient: 'from-cyan-500 via-blue-600 to-violet-600',
  },
  {
    id: 'seed-events-week',
    match: ['events', 'this week', 'calendar'],
    name: 'Events This Week',
    icon: '📅',
    label: 'Happening soon',
    purpose: 'Shiurim, school nights, programs, meetups, and family events people can actually attend.',
    prompt: 'Post an event',
    gradient: 'from-violet-500 via-purple-600 to-blue-700',
  },
  {
    id: 'seed-business-jobs',
    match: ['business', 'jobs', 'hustle'],
    name: 'Jobs & Business',
    icon: '💼',
    label: 'Local work',
    purpose: 'Hire local, find side work, ask business questions, and support Jewish-owned services without spam.',
    prompt: 'Ask for work help',
    gradient: 'from-slate-800 via-blue-800 to-emerald-600',
  },
  {
    id: 'seed-five-towns-teens',
    match: ['teen', 'hangout', 'school stress', 'social'],
    name: 'Teens Hangout',
    icon: '✨',
    label: 'Safe social',
    purpose: 'Plans, questions, sports, school stuff, rides, and safe ways to meet people with shared interests.',
    prompt: 'Start a safe plan',
    gradient: 'from-fuchsia-500 via-blue-600 to-cyan-500',
  },
];

function getRoomBlueprint(community = {}, index = 0) {
  const text = `${community.id || ''} ${community.name || ''} ${community.slug || ''} ${community.type || ''} ${community.category || ''} ${community.description || ''}`.toLowerCase();
  return FIVE_TOWNS_ROOM_BLUEPRINTS.find(room => room.id === community.id || room.match.some(token => text.includes(token))) ||
    FIVE_TOWNS_ROOM_BLUEPRINTS[index % FIVE_TOWNS_ROOM_BLUEPRINTS.length];
}

function buildRoomViewModel(community = {}, index = 0) {
  const blueprint = getRoomBlueprint(community, index);
  const memberCount = community.follower_count || community.member_count || null;
  return {
    ...community,
    roomName: blueprint.name,
    roomIcon: blueprint.icon,
    roomLabel: blueprint.label,
    roomPurpose: community.hook || community.description_short || blueprint.purpose,
    roomLatest: community.latestDiscussion || community.latest_discussion || community.latest_post_title || null,
    roomPrompt: community.roomQuestion || blueprint.prompt,
    roomActiveNow: community.activeNow || community.active_now || community.active_members || 0,
    roomPostsToday: community.postsToday || community.posts_today || community.posts_this_week || 0,
    roomMemberCount: memberCount,
    roomGradient: community.gradient || blueprint.gradient,
    roomBlueprintId: blueprint.id,
  };
}

function getCoreFiveTownsRooms(communities = []) {
  const used = new Set();
  return FIVE_TOWNS_ROOM_BLUEPRINTS.flatMap((blueprint, index) => {
    const found = communities.find(c => {
      if (!c?.id || used.has(c.id)) return false;
      const text = `${c.id || ''} ${c.name || ''} ${c.slug || ''} ${c.type || ''} ${c.category || ''} ${c.description || ''}`.toLowerCase();
      return c.id === blueprint.id || blueprint.match.some(token => text.includes(token));
    });
    if (!found) return [];
    used.add(found.id);
    return [buildRoomViewModel(found, index)];
  });
}

function mergeCommunityCatalog(communities = []) {
  const valid = (communities || []).filter(c => c?.id && c?.name);
  return valid;
}

function getCommunityKind(community = {}) {
  if (community.communityKind) return community.communityKind;
  const text = `${community.name || ''} ${community.type || ''} ${community.category || ''} ${community.description || ''}`.toLowerCase();
  if (community.isOfficial || text.includes('official') || text.includes('daily torah') || text.includes('news')) return 'Official / Daily';
  if (community.allowAnonymous || community.hiddenMembership || text.includes('support') || text.includes('anxiety') || text.includes('stress') || text.includes('family changes')) return 'Private Support';
  if (text.includes('ride') || text.includes('carpool') || text.includes('host') || text.includes('guest') || text.includes('lost') || text.includes('apartment')) return 'Five Towns Action';
  return 'Lifestyle';
}

function getPrivacyLabel(community = {}) {
  if (community.privacyLabel) return community.privacyLabel;
  if (community.allowAnonymous || community.hiddenMembership) return 'Private / Anonymous';
  if (community.isOfficial || community.is_verified) return 'Official';
  return community.privacy || 'Public';
}

function getCommunityHook(community = {}) {
  return (
    community.hook ||
    community.description_short ||
    community.description ||
    getCommunityActionCopy(community).promise ||
    'Find useful people, plans, and help in one local room.'
  );
}

function getDisplayMetric(community = {}) {
  const posts = community.postsToday || community.posts_today || community.posts_this_week || 0;
  const active = community.activeNow || community.active_now || community.active_members || 0;
  if (posts) return `${posts} posts today`;
  if (active) return `${active} active now`;
  const members = community.follower_count || community.member_count || 0;
  return members ? `${members.toLocaleString()} members` : '';
}

function CommunityDiscoveryCard({ community, isJoined, isJoining, onOpen, onJoin, featured = false }) {
  if (!community?.id || !community?.name) return null;
  const gradient = community.gradient || CATEGORY_CARD_GRADIENTS[community.type] || CATEGORY_GRADIENTS[community.category] || 'from-blue-500 to-indigo-600';
  const privacy = getPrivacyLabel(community);
  const actionCopy = getCommunityActionCopy(community);
  const activeNow = community.activeNow || community.active_now || community.active_members || 0;
  const friendsHere = community.friendsHere || community.friends_here || 0;
  const displayMetric = getDisplayMetric(community);
  const memberCount = community.follower_count || community.member_count || 0;

  return (
    <article
      onClick={() => onOpen(community.id)}
      className={`group relative flex h-full min-w-[260px] cursor-pointer flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(37,99,235,0.12)] active:scale-[0.99] ${featured ? 'sm:min-w-[310px]' : ''}`}
    >
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-[13px] font-black text-white shadow-sm`}>
              {getInitials(community.name)}
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-[15px] font-black text-slate-950">{community.name}</h3>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{getCommunityKind(community)}</p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
            privacy.includes('Anonymous') ? 'bg-violet-50 text-violet-700' :
            privacy.includes('Official') ? 'bg-blue-50 text-blue-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {privacy}
          </span>
        </div>

        <div>
          <p className="line-clamp-2 text-[18px] font-black leading-tight text-slate-950">
            {community.roomQuestion || actionCopy.question}
          </p>
          <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-relaxed text-slate-600">
            {getCommunityHook(community)}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(community.tags || []).slice(0, 3).map(tag => (
            <span key={tag} className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
              {tag}
            </span>
          ))}
        </div>

        {(displayMetric || activeNow || friendsHere) && (
        <div className="mt-auto rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Why check today</p>
              <p className="mt-1 line-clamp-1 text-[12px] font-bold text-slate-700">{displayMetric}</p>
            </div>
            <ProfileFaces community={community} compact />
          </div>
          {(activeNow || memberCount || friendsHere) && (
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
            <span>{activeNow ? `${activeNow} active now` : memberCount ? `${memberCount} members` : ''}</span>
            <span>{friendsHere ? `${friendsHere} friends here` : ''}</span>
          </div>
          )}
        </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); isJoined ? onOpen(community.id) : onJoin(community); }}
            disabled={isJoining}
            className={`flex-1 rounded-full px-4 py-2.5 text-[13px] font-black transition-all active:scale-95 disabled:opacity-60 ${
              isJoined ? 'bg-slate-950 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isJoining ? 'Joining...' : isJoined ? 'Open room' : 'Join room'}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(community.id); }}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-black text-blue-600 active:scale-95"
          >
            View
          </button>
        </div>
      </div>
    </article>
  );
}

function CommunitySectionRail({ title, subtitle, communities, userCommunityIds, joiningId, onOpen, onJoin }) {
  if (!communities.length) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-black tracking-tight text-slate-950">{title}</h2>
          <p className="mt-0.5 text-[12px] font-semibold text-slate-500">{subtitle}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">{communities.length}</span>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {communities.map(community => (
          <CommunityDiscoveryCard
            key={community.id}
            community={community}
            featured
            isJoined={userCommunityIds.has(community.id)}
            isJoining={joiningId === community.id}
            onOpen={onOpen}
            onJoin={onJoin}
          />
        ))}
      </div>
    </section>
  );
}

function LiveFiveTownsRoomCard({ community, index = 0, isJoined, isJoining, onOpen, onJoin, compact = false }) {
  if (!community?.id) return null;
  const room = buildRoomViewModel(community, index);
  const hasActivity = Number(room.roomActiveNow || 0) > 0;
  const hasPosts = Number(room.roomPostsToday || 0) > 0;
  const hasMembers = Number(room.roomMemberCount || 0) > 0;

  return (
    <article
      onClick={() => onOpen(room.id)}
      className={`group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_42px_rgba(37,99,235,0.12)] active:scale-[0.99] ${compact ? '' : 'min-h-[250px]'}`}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpen(room.id); }}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${room.roomGradient}`} />
      <div className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${room.roomGradient} text-xl shadow-sm`}>
              {room.roomIcon}
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-[17px] font-black tracking-tight text-slate-950">{room.roomName}</h3>
              <p className="mt-0.5 line-clamp-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                {room.roomLabel}
              </p>
            </div>
          </div>
          {hasActivity && (
          <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-600 ring-1 ring-red-100">
            {room.roomActiveNow} active
          </span>
          )}
        </div>

        <p className="line-clamp-2 text-[13px] font-semibold leading-relaxed text-slate-600">
          {room.roomPurpose}
        </p>

        {(room.roomLatest || hasPosts || hasMembers || getProfileFaces(room).length > 0) && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{room.roomLatest ? 'Latest thread' : 'Activity'}</p>
            <ProfileFaces community={room} compact />
          </div>
          {room.roomLatest && (
            <p className="line-clamp-2 text-[14px] font-black leading-snug text-slate-950">{room.roomLatest}</p>
          )}
          {(hasPosts || hasMembers) && (
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
            <span>{hasPosts ? `${room.roomPostsToday} posts today` : ''}</span>
            <span>{hasMembers ? `${Number(room.roomMemberCount || 0).toLocaleString()} members` : ''}</span>
          </div>
          )}
        </div>
        )}

        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); isJoined ? onOpen(room.id) : onJoin(room); }}
            disabled={isJoining}
            className={`rounded-full px-4 py-2.5 text-[13px] font-black transition-all active:scale-95 disabled:opacity-60 ${
              isJoined ? 'bg-slate-950 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isJoining ? 'Joining...' : isJoined ? 'Open room' : 'Join room'}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(room.id); }}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-black text-blue-600 transition-all active:scale-95"
          >
            {room.roomPrompt}
          </button>
        </div>
      </div>
    </article>
  );
}

function FiveTownsRoomsHub({ communities, userCommunityIds, joiningId, onOpen, onJoin }) {
  const rooms = getCoreFiveTownsRooms(communities);
  const leadRooms = rooms.slice(0, 3);
  const remainingRooms = rooms.slice(3);
  if (!rooms.length) {
    return (
      <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-5 text-center shadow-sm">
        <h2 className="text-[18px] font-black tracking-tight text-slate-950">No Five Towns rooms yet</h2>
        <p className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-500">
          Be the first to create a real room for local questions, help, or plans.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-5 text-white">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/80">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Live Five Towns rooms
          </div>
          <h2 className="text-[26px] font-black leading-tight tracking-tight">Jump into the room that matches what you need right now.</h2>
          <p className="mt-2 text-[13px] font-semibold leading-relaxed text-white/78">
            Communities are not folders. They are live places to ask, plan, help, find people, and move real life forward.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          {[
            ['10', 'core rooms'],
            ['113', 'posts today'],
            ['130', 'active now'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-3 text-center">
              <p className="text-[20px] font-black text-slate-950">{value}</p>
              <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-[18px] font-black tracking-tight text-slate-950">Start Here</h2>
          <p className="text-[12px] font-semibold text-slate-500">The rooms most likely to create a real conversation today.</p>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {leadRooms.map((room, index) => (
            <div key={room.id} className="w-[310px] shrink-0">
              <LiveFiveTownsRoomCard
                community={room}
                index={index}
                isJoined={userCommunityIds.has(room.id)}
                isJoining={joiningId === room.id}
                onOpen={onOpen}
                onJoin={onJoin}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-[18px] font-black tracking-tight text-slate-950">All Five Towns Rooms</h2>
          <p className="text-[12px] font-semibold text-slate-500">Built around local action, not generic categories.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {remainingRooms.map((room, index) => (
            <LiveFiveTownsRoomCard
              key={room.id}
              community={room}
              index={index + 3}
              compact
              isJoined={userCommunityIds.has(room.id)}
              isJoining={joiningId === room.id}
              onOpen={onOpen}
              onJoin={onJoin}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CommunityDiscoveryHub({ communities, userCommunityIds, joiningId, onOpen, onJoin }) {
  const official = communities.filter(c => getCommunityKind(c) === 'Official / Daily').slice(0, 6);
  const support = communities.filter(c => getCommunityKind(c) === 'Private Support').slice(0, 6);
  const action = communities.filter(c => getCommunityKind(c) === 'Five Towns Action').slice(0, 8);
  const lifestyle = communities.filter(c => getCommunityKind(c) === 'Lifestyle').slice(0, 8);
  const forYou = [
    ...action.slice(0, 2),
    ...official.slice(0, 2),
    ...lifestyle.slice(0, 2),
    ...support.slice(0, 1),
  ].slice(0, 7);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-5 text-white">
          <div className="mb-3 inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/80">
            Five Towns identity hub
          </div>
          <h2 className="text-[25px] font-black leading-tight tracking-tight">Find your people, your plans, and your place.</h2>
          <p className="mt-2 text-[13px] font-semibold leading-relaxed text-white/78">
            Communities should feel like rooms people actually use: official updates, private support, sports, Shabbos plans, carpools, jobs, food, learning, and real local help.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
          {[
            ['Official', 'Daily trusted rooms'],
            ['Private', 'Anonymous support'],
            ['Tonight', 'Plans and rides'],
            ['Local', 'Five Towns only'],
          ].map(([label, sub]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[14px] font-black text-slate-950">{label}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase text-slate-400">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      <CommunitySectionRail
        title="For You"
        subtitle="The rooms most likely to be useful today."
        communities={forYou}
        userCommunityIds={userCommunityIds}
        joiningId={joiningId}
        onOpen={onOpen}
        onJoin={onJoin}
      />
      <CommunitySectionRail
        title="Official / Daily"
        subtitle="Trusted rooms that should always feel active."
        communities={official}
        userCommunityIds={userCommunityIds}
        joiningId={joiningId}
        onOpen={onOpen}
        onJoin={onJoin}
      />
      <CommunitySectionRail
        title="Five Towns Action"
        subtitle="Meals, rides, lost items, apartments, parents, and things people need now."
        communities={action}
        userCommunityIds={userCommunityIds}
        joiningId={joiningId}
        onOpen={onOpen}
        onJoin={onJoin}
      />
      <CommunitySectionRail
        title="Private / Support Spaces"
        subtitle="Safer rooms with hidden membership and anonymous posting where appropriate."
        communities={support}
        userCommunityIds={userCommunityIds}
        joiningId={joiningId}
        onOpen={onOpen}
        onJoin={onJoin}
      />
      <CommunitySectionRail
        title="Lifestyle & Interests"
        subtitle="Sports, food, jobs, creative, learning, and social rooms people check for connection."
        communities={lifestyle}
        userCommunityIds={userCommunityIds}
        joiningId={joiningId}
        onOpen={onOpen}
        onJoin={onJoin}
      />
    </div>
  );
}

function CommunityCard({ community, isJoined, isJoining, onOpen, onJoin }) {
  // Guard: skip rendering if community has no id
  if (!community?.id || !community?.name) return null;

  const typeKey = community.type || '';
  const catKey = community.category || TYPE_TO_CATEGORY[typeKey] || '';
  const gradient = CATEGORY_CARD_GRADIENTS[typeKey] || CATEGORY_CARD_GRADIENTS[catKey] || 'from-blue-500 to-purple-600';
  const initials = community.name.slice(0, 2).toUpperCase();
  const actionCopy = getCommunityActionCopy(community);
  const activity = getMockActivity(community.id, community);
  const badge = getActivityBadge(community);
  const pulse = getFriendlyPulse(community);
  const memberCount = community.follower_count || community.member_count || 0;

  const handleCardClick = (e) => {
    // Only navigate if the click wasn't on the join button
    if (e.target.closest('[data-join-btn]')) return;
    onOpen(community.id);
  };

  return (
    <div
      className="group relative isolate w-full overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(37,99,235,0.14)] active:scale-[0.98] cursor-pointer"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpen(community.id); }}
    >
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${gradient} opacity-[0.16]`} />
      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur">
        <Sparkles className="h-3 w-3 text-blue-500" />
        <span>{badge.label.replace(/^[^\w]+/, '')}</span>
      </div>

      <div className="relative p-4 pt-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            {community.logo_url ? (
              <img src={community.logo_url} alt={community.name} className="h-12 w-12 rounded-2xl object-cover shrink-0 ring-4 ring-white shadow-sm" />
            ) : (
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold text-[12px] shadow-md ring-4 ring-white shrink-0`}>
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="pr-10 text-[14px] font-black text-slate-900 line-clamp-2 leading-snug">{community.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                {memberCount > 0 && (
                  <>
                    <span>{memberCount.toLocaleString()} members</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                  </>
                )}
                <span>{catKey || typeKey || 'Community'}</span>
              </div>
            </div>
          </div>
          <button
            data-join-btn="true"
            onClick={e => { e.stopPropagation(); onJoin(community); }}
            disabled={isJoining}
            className={`mt-10 shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-60 ${
              isJoined ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isJoining ? '…' : isJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/85 px-3 py-3 shadow-sm">
          <div className="text-[15px] font-black leading-snug text-slate-950 line-clamp-2">{actionCopy.question}</div>
          <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <MessageCircleMore className="h-3.5 w-3.5 text-blue-500" />
            <span className="line-clamp-1">{pulse}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <ProfileFaces community={community} />
            {activity && (
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase text-slate-400">In the room</div>
              <div className="truncate text-[11px] font-semibold text-slate-600">{activity}</div>
            </div>
            )}
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white transition-transform group-hover:translate-x-0.5">
            <span>{actionCopy.primary}</span>
            <ArrowUpRight className="h-3 w-3" />
          </div>
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
  const fauxCommunity = { ...group, type: group.category, category: group.category };

  return (
    <div
      onClick={onClick}
      className="group relative isolate w-full overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(37,99,235,0.14)] active:scale-[0.98] text-left flex flex-col cursor-pointer"
    >
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${catGrad} opacity-[0.16]`} />

      <div className="relative p-4 pt-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-2.5">
          {group.cover_image_url ? (
            <img src={group.cover_image_url} alt="" className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 ring-4 ring-white shadow-sm" />
          ) : (
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${catGrad} ring-4 ring-white shadow-md`}>
              <span className="text-white font-black text-[13px]">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-black text-[14px] text-slate-900 leading-snug line-clamp-2">{group.name}</p>
            <p className="text-[11px] text-slate-500 mt-1">{group.category || 'Group'} · {(group.member_count || 0).toLocaleString()} members</p>
          </div>
        </div>

        {(group.description || activity) && (
        <div className="rounded-2xl border border-slate-100 bg-white/85 px-3 py-3 shadow-sm">
          {group.description && <p className="text-[12px] text-slate-700 line-clamp-2">{group.description}</p>}
          {activity && <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <MessageCircleMore className="h-3.5 w-3.5 text-indigo-500" />
            <span className="line-clamp-1">{activity}</span>
          </div>}
        </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <ProfileFaces community={fauxCommunity} compact />
          </div>
          {isMember ? (
            <button className="shrink-0 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] font-bold text-green-700 active:scale-95 transition-all duration-150">Joined</button>
          ) : (
          <button
            onClick={e => { e.stopPropagation(); onJoin(group); }}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white active:scale-95 transition-all duration-150"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #2563EB)' }}
          >
            Join
          </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Communities() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('discover');
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
  const [reseedingFeatured, setReseedingFeatured] = useState(false);
  const [showCategoryBrowse, setShowCategoryBrowse] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [featuredError, setFeaturedError] = useState(false);
  const [sizeFilter, setSizeFilter] = useState('all_sizes');
  const [activityFilter, setActivityFilter] = useState('all_activity');

  // Stable ref so openCommunity never needs to be recreated when communities reload
  const allCommunitiesRef = useRef([]);

  useEffect(() => {
    const legacyCommunityId = searchParams.get('community') || searchParams.get('communityId');
    if (!legacyCommunityId) return;
    const tab = searchParams.get('tab');
    const suffix = tab ? `?tab=${encodeURIComponent(tab)}` : '';
    navigate(`/communities/${encodeURIComponent(legacyCommunityId)}${suffix}`, { replace: true });
  }, [navigate, searchParams]);

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
        // Sanitize: only keep records with a valid id and name
        const sanitized = comms.value.filter(c => c?.id && c?.name);
        const toSet = sanitized;
        allCommunitiesRef.current = toSet;
        setAllCommunities(toSet);
        setCache(sanitized);
        setIsDemo(false);
      } else {
        const cached = getCached().filter(c => c?.id && c?.name);
        const toSet = cached;
        allCommunitiesRef.current = toSet;
        setAllCommunities(toSet);
        setIsDemo(false);
      }

      if (groups.status === 'fulfilled') setAllGroups(groups.value || []);
    } catch {
      const cached = getCached().filter(c => c?.id && c?.name);
      allCommunitiesRef.current = cached;
      setAllCommunities(cached);
      setIsDemo(false);
    }
    setLoadingPhase('done');
  }, []);

  useEffect(() => {
    base44.auth.me()
      .then(user => { setCurrentUser(user); loadData(user); })
      .catch(() => loadData(null));
  }, [loadData]);

  const catalogCommunities = useMemo(() => mergeCommunityCatalog(allCommunities), [allCommunities]);

  useEffect(() => {
    allCommunitiesRef.current = catalogCommunities;
  }, [catalogCommunities]);

  const mainFeatured = useMemo(() => !featuredError ? ((catalogCommunities || []).find(c => c.isMainFeatured === true) || null) : null, [catalogCommunities, featuredError]);
  const secondaryFeatured = useMemo(() => {
    if (featuredError) return [];
    return (catalogCommunities || []).filter(c => c.isFeatured === true && c.isMainFeatured !== true).sort((a, b) => (a.featuredRank || 999) - (b.featuredRank || 999)).slice(0, 3);
  }, [catalogCommunities, featuredError]);
  const myCommunities = useMemo(() => (catalogCommunities || []).filter(c => userCommunityIds.has(c.id)), [catalogCommunities, userCommunityIds]);
  const myGroups = useMemo(() => (allGroups || []).filter(g => memberGroupIds.has(g.id)), [allGroups, memberGroupIds]);
  const discoverCommunities = useMemo(() => (catalogCommunities || []).filter(c => !userCommunityIds.has(c.id)), [catalogCommunities, userCommunityIds]);
  const discoverGroups = useMemo(() => (allGroups || []).filter(g => !memberGroupIds.has(g.id)), [allGroups, memberGroupIds]);
  const communityActionItems = useMemo(
    () => buildCommunityActionItems(myCommunities.length ? myCommunities : catalogCommunities),
    [myCommunities, catalogCommunities]
  );

  const filterItems = useCallback((items) => {
    let result = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => {
        const haystack = [
          c.name,
          c.neighborhood,
          c.category,
          c.type,
          c.communityKind,
          c.privacyLabel,
          c.hook,
          c.description_short,
          c.description,
          ...(c.tags || []),
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }
    if (activeCategory !== 'all') {
      const discoverCat = DISCOVER_CATEGORIES.find(c => c.key === activeCategory)?.filterValue;
      const legacyCat = CATEGORIES.find(c => c.key === activeCategory)?.value;
      const cat = discoverCat || legacyCat;
      if (cat) {
        result = result.filter(c => {
          const itemCat = c.category || TYPE_TO_CATEGORY[c.type] || null;
          return itemCat === cat || getCommunityKind(c) === cat;
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
      await base44.entities.Community.update(community.id, {
        follower_count: (community.follower_count || 0) + 1,
        joins_this_week: (community.joins_this_week || 0) + 1
      });
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

  // Stable callback — reads communities from ref so it never needs to be recreated.
  // This prevents all CommunityCards from re-rendering mid-tap when allCommunities updates,
  // which was causing the browser to cancel the click event.
  const openCommunity = useCallback((id) => {
    if (!id) return;
    const communities = allCommunitiesRef.current;
    const community = communities.find(c => c.id === id);
    if (community) {
      base44.entities.Community.update(id, { views_count: (community.views_count || 0) + 1 }).catch(() => {});
    }
    navigate(`/communities/${id}`);
  }, [navigate]); // navigate is stable; communities come from ref
  const backToList = () => navigate('/Communities');

  const reseedFeatured = async () => {
    if (currentUser?.role !== 'admin') {
      toast.error('Admin access required');
      return;
    }
    setReseedingFeatured(true);
    try {
      const result = await base44.functions.invoke('reseedFeaturedCommunities', {});
      toast.success(`Reseeded featured communities: ${result?.data?.main_featured || 'done'}`);
      setFeaturedError(false);
      // Silently refresh communities without resetting loading state
      const comms = await base44.entities.Community.list('-follower_count', 80);
      if (comms?.length > 0) {
        allCommunitiesRef.current = comms;
        setAllCommunities(comms);
        setCache(comms);
        setIsDemo(false);
      }
    } catch (error) {
      console.error('[reseedFeatured] error:', error?.message || error);
      toast.error('Failed to reseed featured communities');
      // Do NOT change any page state on failure — preserve existing data
    } finally {
      setReseedingFeatured(false);
    }
  };

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



  // Only show skeleton if we have no data at all (not even cached)
  const isLoading = loadingPhase === 'loading' && catalogCommunities.length === 0;

  return (
    <div className="min-h-screen bg-transparent pb-24">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 180ms ease both; }
        .fade-up-delay { animation: fadeUp 180ms ease 80ms both; }
        @keyframes heroEnter { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .hero-enter { animation: heroEnter 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase text-blue-600">Rooms around the main thread</p>
            <h1 className="text-3xl font-bold text-slate-900">Communities</h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => navigate('/Map')}
              className="surface-tile-hover hidden rounded-full border border-slate-200 bg-white p-2.5 shadow-sm transition-all duration-150 active:scale-90 sm:inline-flex"
              title="Map"
            >
              <Map className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => navigate('/Feed')}
              className="surface-tile-hover hidden rounded-full border border-slate-200 bg-white p-2.5 shadow-sm transition-all duration-150 active:scale-90 sm:inline-flex"
              title="Main feed"
            >
              <Calendar className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className="surface-tile-hover hidden rounded-full border border-slate-200 bg-white p-2.5 shadow-sm transition-all duration-150 active:scale-90 sm:inline-flex"
              title="Discover communities"
            >
              <Compass className="w-4 h-4 text-slate-600" />
            </button>
            {currentUser?.role === 'admin' && (
              <button
                onClick={reseedFeatured}
                disabled={reseedingFeatured}
                className="rounded-full bg-amber-600 text-white px-4 py-2.5 text-[13px] font-semibold shadow-sm hover:bg-amber-700 disabled:opacity-50 active:scale-95 transition-all duration-150"
                title="Reseed featured communities (admin only)"
              >
                {reseedingFeatured ? '⟳ ...' : '⟳ Reseed'}
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="graphic-stripes shrink-0 rounded-full bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-blue-700 active:scale-95"
            >
              + Create
            </button>
          </div>
        </div>

        <div className="mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-blue-100">
                <MessageCircleMore className="h-3.5 w-3.5" />
                Community-first reset
              </div>
              <h2 className="text-[20px] font-black leading-tight">Start with one Five Towns conversation.</h2>
              <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-300">
                Communities are smaller rooms for sports, shuls, parents, learning, support, and chesed after people meet in the main feed.
              </p>
            </div>
            <button
              onClick={() => navigate('/Feed')}
              className="motion-press inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[12px] font-black text-slate-950 shadow-sm"
            >
              Open Feed
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ['Ask', 'Get a neighbor answer'],
              ['Plan', 'Find people nearby'],
              ['Help', 'Move needs to action'],
            ].map(([label, detail]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <p className="text-[13px] font-black">{label}</p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <LiveNowPanel
          title="Rooms active now"
          subtitle="Find people planning, asking, helping, or learning near you."
          items={communityActionItems}
          className="mb-5"
        />

        <button
          type="button"
          onClick={() => navigate('/JewishHub')}
          className="motion-press mb-5 flex w-full items-center gap-3 rounded-[24px] border border-blue-100 bg-white p-3 text-left shadow-sm transition-colors active:bg-blue-50"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-blue-100 bg-blue-50 text-blue-700">
            <BookOpenText className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-black uppercase tracking-wide text-blue-500">Jewish content</span>
            <span className="mt-0.5 block text-[15px] font-black leading-tight text-slate-950">Tehillim, Torah, Zmanim, Siddur</span>
            <span className="mt-1 block text-[12px] font-semibold leading-snug text-slate-500">
              Daily Jewish tools inside the community hub.
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
        </button>

        {/* Featured Communities - 1 Hero + up to 4 Secondary */}
        {mainFeatured || secondaryFeatured.length > 0 ? (
          <div className="mb-8 space-y-4">
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
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
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
            )}
          </div>
        ) : null}

        {/* Search */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter communities…"
              className="surface-panel-soft w-full rounded-[22px] border border-slate-200 bg-white py-3 pl-11 pr-9 text-[14px] text-slate-800 outline-none placeholder-slate-400 focus:ring-2 focus:ring-blue-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
          <button onClick={() => navigate('/search')}
            className="surface-panel-soft flex flex-shrink-0 items-center gap-1.5 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50">
            <Search className="w-3.5 h-3.5" /> All
          </button>
        </div>

        {/* Tab switcher */}
        <div className="surface-panel-soft mb-6 flex rounded-[22px] p-1">
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

        {catalogCommunities.length === 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-[11px] text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> No communities yet — seed communities to see data.
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
                currentUser={currentUser}
                allCommunities={catalogCommunities}
                isLoadingData={loadingPhase === 'loading'}
                onJoinedFromOnboarding={(newIds) => {
                  setUserCommunityIds(prev => new Set([...prev, ...newIds]));
                }}
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
                sizeFilter={sizeFilter}
                setSizeFilter={setSizeFilter}
                activityFilter={activityFilter}
                setActivityFilter={setActivityFilter}
                currentUser={currentUser}
                allCommunities={catalogCommunities}
                onJoinCommunity={joinCommunity}
              /></>
            )}
          </div>
        )}
      </div>

      <CreateCommunityModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        currentUser={currentUser}
        onCreated={(newCommunity) => {
          loadData(currentUser);
          if (newCommunity?.id) {
            setTimeout(() => {
              navigate(`/communities/${encodeURIComponent(newCommunity.id)}?tab=chat&focus=message`);
            }, 400);
          }
        }}
      />
    </div>
  );
}

function MineTab({ myCommunities, myGroups, openCommunity, setSelectedGroup, setActiveTab, userCommunityIds, memberGroupIds, onJoinCommunity, onJoinGroup, joiningId, currentUser, allCommunities, onJoinedFromOnboarding, isLoadingData }) {
  // Don't show onboarding while data is still loading — prevents race condition flash
  if (myCommunities.length === 0 && myGroups.length === 0) {
    if (isLoadingData) {
      return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;
    }
    return (
      <div className="space-y-4">
        <div className="text-center px-4 py-5 bg-blue-50 border border-blue-100 rounded-2xl mb-2">
          <div className="text-3xl mb-2">🏘️</div>
          <p className="text-[14px] font-semibold text-slate-800 mb-1">You haven't joined any communities yet</p>
          <p className="text-[12px] text-slate-500">Tap <strong>Discover</strong> to find schools, shuls, and neighborhoods near you.</p>
        </div>
        <CommunityInterestOnboarding
          currentUser={currentUser}
          allCommunities={allCommunities}
          onJoined={onJoinedFromOnboarding}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {myCommunities.length > 0 && (
        <div>
          <div className="text-lg font-bold text-slate-900 mb-3">My Communities</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {myCommunities.map((c, index) => (
              <LiveFiveTownsRoomCard
                key={c.id}
                community={c}
                index={index}
                compact
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

function DiscoverTabContent({ communities, groups, openCommunity, setSelectedGroup, onJoin, onJoinGroup, joiningId, userCommunityIds, memberGroupIds, setShowCreateModal, hasFilter, setActiveCategory, sizeFilter, setSizeFilter, activityFilter, setActivityFilter, currentUser, allCommunities, onJoinCommunity }) {
  // Apply extra filters then sort: featured first, then by follower count
  const filtered = applyExtraFilters(communities, sizeFilter, activityFilter);
  const sortedCommunities = [...filtered].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return (b.follower_count || 0) - (a.follower_count || 0);
  });

  const noResults = sortedCommunities.length === 0 && groups.length === 0;

  return (
    <div className="space-y-6">
      {!hasFilter && (
        <FiveTownsRoomsHub
          communities={allCommunities}
          userCommunityIds={userCommunityIds}
          joiningId={joiningId}
          onOpen={openCommunity}
          onJoin={onJoinCommunity || onJoin}
        />
      )}
      {hasFilter && (
        <>
          <SuggestedCommunities
            currentUser={currentUser}
            allCommunities={allCommunities}
            userCommunityIds={userCommunityIds}
            joiningId={joiningId}
            onOpen={openCommunity}
            onJoin={onJoinCommunity || onJoin}
          />
          <DiscoverFilters
            sizeFilter={sizeFilter}
            setSizeFilter={setSizeFilter}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
          />
        </>
      )}
      {noResults ? (
        <div className="rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)', border: '1px dashed #BFDBFE' }}>
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="text-[15px] font-bold text-slate-800 mb-1">No results found</h3>
          <p className="text-[12px] text-slate-500 mb-4">Try a different search or explore by category</p>
          <button
            onClick={() => { setActiveCategory('all'); setSizeFilter('all_sizes'); setActivityFilter('all_activity'); }}
            className="bg-blue-600 text-white rounded-full px-5 py-2 text-[12px] font-bold active:scale-95 transition-all duration-150"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {hasFilter && sortedCommunities.length > 0 && (
            <div>
              <div className="text-lg font-bold text-slate-900 mb-3">Communities</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {sortedCommunities.map((c, index) => (
                  <LiveFiveTownsRoomCard
                    key={c.id}
                    community={c}
                    index={index}
                    compact
                    isJoined={userCommunityIds.has(c.id)}
                    isJoining={joiningId === c.id}
                    onOpen={openCommunity}
                    onJoin={onJoin}
                  />
                ))}
              </div>
            </div>
          )}

          {hasFilter && groups.length > 0 && (
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
        </>
      )}
    </div>
  );
}
