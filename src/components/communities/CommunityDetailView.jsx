import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity, BookOpen, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Globe, Hash, Heart,
  HeartHandshake, HelpCircle, Home, Info, Loader2, Lock, MapPin,
  Megaphone, MessageCircle, MoreHorizontal, Phone, Send,
  Shield, ShoppingBag, Sparkles, Users, Vote, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { dataService, incrementCounter } from '@/services';
import postsService from '@/services/postsService';
import {
  getCommunityNavConfig,
  getCommunityTabLabel,
  getCommunityTypeConfig,
  getSupportedCommunityTabs,
} from '@/lib/communityTypes';
import {
  canUseCommunityChat,
  canUseCommunityEvents,
  canUseCommunityMarketplace,
  canUseCommunityResources,
} from '@/lib/communityPlans';
import { supabase } from '@/api/supabaseClient';
import CommunityHero from './CommunityHero';
import ClaimModal from './ClaimModal';
import CommunityEventsTab from './CommunityEventsTab';
import CommunityGroupsTab from './CommunityGroupsTab';
import CommunityFormsTab from './CommunityFormsTab';
import CommunityResourceLibrary from './CommunityResourceLibrary';
import CommunityStoreTab from './CommunityStoreTab';
import GroupChatSection from './GroupChatSection';
import CommunityInviteModal from './CommunityInviteModal';
import CommunityAdminCenter, { AppealSubmitModal } from './CommunityAdminCenter';
import { useSwipeableTabs } from '@/hooks/useSwipeableTabs';
import {
  CommunityAdminQuickActions,
  CommunityFeaturedSection,
  CommunityMemberDirectory,
  CommunityPostPreview,
} from './CommunityOperatingSystem';
import CommunityPersonalizationHub from './CommunityPersonalizationHub';
import CommunityPostLaunchPanel from './CommunityPostLaunchPanel';

const CLAIM_COPY = {
  School: { question: 'Is this your school?', cta: 'Claim this school' },
  Shul: { question: 'Is this your shul?', cta: 'Claim this shul' },
  Yeshiva: { question: 'Is this your yeshiva?', cta: 'Claim this yeshiva' },
  Seminary: { question: 'Is this your seminary?', cta: 'Claim this seminary' },
  Organization: { question: 'Is this your organization?', cta: 'Claim this organization' },
  Camp: { question: 'Is this your camp?', cta: 'Claim this camp' },
};

const OPEN_NEED_STATUSES = new Set(['open', 'offered', 'accepted', 'in_progress', 'volunteer_offered']);

const TAB_ICON_MAP = {
  home:          Home,
  about:         Info,
  members:       Users,
  posts:         Hash,
  questions:     HelpCircle,
  discussions:   MessageCircle,
  announcements: Megaphone,
  openNeeds:     HeartHandshake,
  events:        CalendarDays,
  resources:     BookOpen,
  listings:      ShoppingBag,
  groups:        Globe,
  chat:          MessageCircle,
};

const LAUNCHPAD_TAB_DESC = {
  posts:         'Updates and conversations',
  questions:     'Ask and get answers',
  discussions:   'Torah and learning threads',
  announcements: 'Official updates',
  openNeeds:     'Help requests and offers',
  events:        'Programs and gatherings',
  resources:     'Files, links, and guides',
  members:       'Directory and leadership',
  chat:          'Group chat',
  listings:      'Items and exchange',
  groups:        'Subgroups and circles',
  about:         'Community info and contact',
  forms:         'Forms and surveys',
};

function getPostTypeForTab(tab, typeKey) {
  if (tab === 'announcements') return 'announcement';
  if (tab === 'questions' || typeKey === 'parents') return 'question';
  if (tab === 'discussions' || typeKey === 'learning') return 'discussion';
  if (typeKey === 'chesed') return 'chesed';
  return 'post';
}

function matchesTab(post, tab) {
  const type = String(post.type || post.post_type || post.category || '').toLowerCase();
  const content = `${post.title || ''} ${post.body || ''} ${post.content || ''}`.toLowerCase();
  if (tab === 'announcements') return type === 'announcement';
  if (tab === 'questions') return type === 'question' || type === 'ask' || content.includes('?');
  if (tab === 'discussions') return type === 'discussion' || type === 'learning';
  return true;
}

function getFeaturedTab(typeConfig, cardTabs) {
  const emphasisMap = {
    announcements: 'announcements',
    events: 'events',
    chesed: 'openNeeds',
    resources: 'resources',
    feed: 'posts',
  };
  const preferred = emphasisMap[typeConfig.homeEmphasis];
  if (preferred && cardTabs.includes(preferred)) return preferred;
  const first = typeConfig.primaryTabs?.find((t) => t !== 'home' && cardTabs.includes(t));
  return first || cardTabs[0] || 'posts';
}

function getCardData(tab, { posts, events, activeNeeds, resources, memberCount }) {
  const upcomingEvents = events
    .filter((e) => new Date(e.start_date || e.event_date) >= new Date())
    .sort((a, b) => new Date(a.start_date || a.event_date) - new Date(b.start_date || b.event_date));

  if (tab === 'events') {
    if (upcomingEvents.length === 0) return { empty: true, emptyCta: 'No upcoming events' };
    const next = upcomingEvents[0];
    const eventDate = new Date(next.start_date || next.event_date);
    const days = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
    const dateLabel = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return { stat: `${upcomingEvents.length} upcoming`, preview: `${next.title || next.name || 'Event'} · ${dateLabel}` };
  }

  if (tab === 'announcements') {
    const latest = posts.find((p) => String(p.type || p.post_type || '').toLowerCase() === 'announcement');
    if (!latest) return { empty: true, emptyCta: 'No announcements yet' };
    const raw = latest.content || latest.body || latest.title || '';
    return { stat: 'Latest update', preview: raw.length > 70 ? `${raw.slice(0, 70)}…` : raw };
  }

  if (tab === 'posts') {
    const nonAnn = posts.filter((p) => String(p.type || p.post_type || '').toLowerCase() !== 'announcement');
    const latest = nonAnn[0];
    if (!latest) return { empty: true, emptyCta: 'No posts yet' };
    const raw = latest.content || latest.body || latest.title || '';
    return { stat: `${nonAnn.length} post${nonAnn.length !== 1 ? 's' : ''}`, preview: raw.length > 70 ? `${raw.slice(0, 70)}…` : raw };
  }

  if (tab === 'openNeeds') {
    if (activeNeeds.length === 0) return { empty: true, emptyCta: 'No open needs' };
    const first = activeNeeds[0];
    return { stat: `${activeNeeds.length} open need${activeNeeds.length !== 1 ? 's' : ''}`, preview: first.title || first.description?.slice(0, 70) || 'Community request' };
  }

  if (tab === 'resources') {
    if (resources.length === 0) return { empty: true, emptyCta: 'No resources yet' };
    const first = resources.find((r) => r.is_pinned) || resources[0];
    return { stat: `${resources.length} resource${resources.length !== 1 ? 's' : ''}`, preview: first.title || 'Community resource' };
  }

  if (tab === 'members') {
    return memberCount > 0 ? { stat: `${memberCount.toLocaleString()} member${memberCount !== 1 ? 's' : ''}` } : { empty: true, emptyCta: 'No members yet' };
  }

  return {};
}

function getCommunityActionCopy(tab, typeConfig) {
  const typeKey = typeConfig?.key || 'community';
  const defaults = {
    posts: {
      title: 'Start the conversation',
      body: 'Share an update, question, recommendation, or something happening nearby.',
      action: 'Post first',
    },
    announcements: {
      title: 'Keep everyone current',
      body: 'Use announcements for verified updates people should not miss.',
      action: 'Open updates',
    },
    events: {
      title: 'Put the next thing on the calendar',
      body: 'Add shiurim, meetups, games, school nights, or community gatherings.',
      action: 'Plan event',
    },
    openNeeds: {
      title: 'Coordinate help fast',
      body: 'Post meals, rides, errands, volunteers, or anything people can act on.',
      action: 'Open needs',
    },
    resources: {
      title: 'Build the useful shelf',
      body: 'Add links, forms, guides, schedules, and contacts people ask for twice.',
      action: 'Add resource',
    },
    chat: {
      title: 'Open the room',
      body: 'Use chat for quick coordination when a post is too slow.',
      action: 'Open chat',
    },
    groups: {
      title: 'Create smaller circles',
      body: 'Split into subgroups for age, interest, neighborhood, or role.',
      action: 'Open groups',
    },
    members: {
      title: 'Know who is here',
      body: 'See members, admins, and the people helping this space grow.',
      action: 'View members',
    },
    listings: {
      title: 'Trade within trust',
      body: 'Buy, sell, give away, or request useful things from the community.',
      action: 'Open listings',
    },
    about: {
      title: 'Explain the purpose',
      body: 'Make the mission, rules, and contact info clear for new members.',
      action: 'View about',
    },
  };

  const overrides = {
    shul: {
      announcements: { title: 'Post shul updates', body: 'Minyan changes, kiddush notes, shiurim, and important notices.', action: 'Open updates' },
      events: { title: 'What is happening at shul?', body: 'Add shiurim, speakers, youth programs, and Shabbos events.', action: 'Open events' },
      openNeeds: { title: 'Help around the shul', body: 'Coordinate minyan needs, rides, hosts, lost items, and volunteers.', action: 'Open requests' },
    },
    neighborhood: {
      posts: { title: 'What should Five Towns know?', body: 'Local alerts, recommendations, openings, closures, and neighbor help.', action: 'Share update' },
      events: { title: 'What is happening tonight?', body: 'Put local events, shiurim, games, fundraisers, and programs here.', action: 'See events' },
      resources: { title: 'Make local info easy', body: 'Useful numbers, school links, shul contacts, and community guides.', action: 'Open resources' },
    },
    chesed: {
      posts: { title: 'Show where help is moving', body: 'Updates, offers, follow-ups, and completed mitzvah moments.', action: 'Share update' },
      openNeeds: { title: 'Turn need into action', body: 'Meals, rides, errands, volunteers, and urgent help belong here.', action: 'Help now' },
    },
    learning: {
      posts: { title: 'Start a learning thread', body: 'Questions, sources, chavrusas, takeaways, and shiur notes.', action: 'Start thread' },
      resources: { title: 'Share source material', body: 'Sefaria links, sheets, recordings, and useful learning guides.', action: 'Open resources' },
    },
    parents: {
      posts: { title: 'Ask the parent network', body: 'School tips, carpool help, camp info, babysitters, and local advice.', action: 'Ask parents' },
      events: { title: 'Keep families in sync', body: 'School nights, programs, deadlines, and family-friendly events.', action: 'Open events' },
    },
  };

  return overrides[typeKey]?.[tab] || defaults[tab] || {
    title: getCommunityTabLabel(tab),
    body: LAUNCHPAD_TAB_DESC[tab] || 'Open this section.',
    action: 'Open',
  };
}

function getCommunityRoomModel(community, typeConfig) {
  const name = `${community?.name || ''} ${community?.slug || ''} ${community?.description || ''}`.toLowerCase();
  const typeKey = typeConfig?.key || 'general';

  if (name.includes('kosher') || name.includes('food') || name.includes('restaurant') || name.includes('bakery') || name.includes('takeout') || name.includes('shabbos extras') || name.includes('dinner')) {
    return {
      label: 'Kosher pulse',
      headline: 'What is worth eating or ordering today?',
      body: 'Fast recs, hechsher checks, bakery drops, Shabbos extras, and which spots are actually open or busy.',
      prompts: ['Open now: which kosher spot is worth it tonight?', 'Before Shabbos: who still has challah, kugel, or takeout?', 'Verify a place: name, town, hechsher/source'],
      primaryCta: 'Share food tip',
      actions: [
        { label: 'Open now', helper: 'What is worth going to', tab: 'posts', prompt: 'Open now: __ in __ is good for __. Line/parking is __.' },
        { label: 'Before Shabbos', helper: 'Timing and extras', tab: 'posts', prompt: 'Before Shabbos food update: __ still has __ until __.' },
        { label: 'Map check', helper: 'Keep it verified', tab: 'posts', prompt: 'Verify a place: __ in __. Hechsher/source is __.' },
      ],
      emptyWin: 'First real food tip',
    };
  }

  if (name.includes('teen') || name.includes('high school') || name.includes('yeshiva league') || name.includes('motzei') || name.includes('hangout')) {
    return {
      label: 'Teen room',
      headline: 'What is the plan tonight?',
      body: 'Plans, rides, pickup games, school questions, support, and safe ways to connect without ten group chats.',
      prompts: ['Who has a real plan tonight?', 'Need a ride from __ to __ around __', 'Quiet question for people who get it'],
      primaryCta: 'Post a plan',
      actions: [
        { label: 'Find plans', helper: 'Tonight or Motzei', tab: 'posts', prompt: 'Who has a real plan tonight near __?' },
        { label: 'Ride check', helper: 'Keep details safe', tab: 'posts', prompt: 'Need a ride from __ to __ around __. Message me for details.' },
        { label: 'Ask quietly', helper: 'Support thread', tab: 'posts', prompt: 'Quiet question: has anyone dealt with...' },
      ],
      emptyWin: 'First real plan',
    };
  }

  if (name.includes('sport') || name.includes('basketball') || name.includes('football') || name.includes('soccer') || name.includes('gym')) {
    return {
      label: 'Game room',
      headline: 'Who is playing tonight?',
      body: 'Make this the fastest place to find a game, fill a team, or get someone to train with.',
      prompts: ['Need two more for ball tonight at __', 'Who is playing after Maariv?', 'Looking for a gym or run partner this week'],
      primaryCta: 'Post a game',
      actions: [
        { label: 'Find a game', helper: 'Tonight, not someday', tab: 'posts', prompt: 'Who is playing after Maariv near __?' },
        { label: 'Fill a team', helper: 'Need people fast', tab: 'posts', prompt: 'Need __ more people for __ at __.' },
        { label: 'Training partner', helper: 'Gym, run, drills', tab: 'posts', prompt: 'Looking for a gym/run partner for __ this week.' },
      ],
      emptyWin: 'First game posted',
    };
  }

  if (typeKey === 'shul') {
    return {
      label: 'Shul room',
      headline: 'What is happening at shul?',
      body: 'Minyanim, shiurim, kiddush, rides, lost items, and the updates people actually need.',
      prompts: ['Any minyan updates today?', 'Who needs a ride to shul?', 'What shiur or event is coming up?'],
      primaryCta: 'Share shul update',
      actions: [
        { label: 'Minyan help', helper: 'Need people now', tab: 'openNeeds', prompt: 'Need people for minyan at...' },
        { label: 'Post event', helper: 'Shiur or kiddush', tab: 'events', prompt: 'Upcoming at shul...' },
        { label: 'Ask members', helper: 'Fast answer', tab: 'posts', prompt: 'Does anyone know...' },
      ],
      emptyWin: 'First shul update',
    };
  }

  if (typeKey === 'chesed') {
    return {
      label: 'Chesed room',
      headline: 'Who needs help right now?',
      body: 'Turn a need into a completed mitzvah with fast offers, updates, and clear next steps.',
      prompts: ['I can help with...', 'We need help with...', 'Who can take this mitzvah?'],
      primaryCta: 'Coordinate help',
      actions: [
        { label: 'Open needs', helper: 'Help someone now', tab: 'openNeeds', prompt: 'We need help with...' },
        { label: 'Offer help', helper: 'Post what you can do', tab: 'posts', prompt: 'I can help with...' },
        { label: 'Share win', helper: 'Show progress', tab: 'posts', prompt: 'Baruch Hashem, this got handled...' },
      ],
      emptyWin: 'First mitzvah completed',
    };
  }

  if (typeKey === 'learning') {
    return {
      label: 'Learning room',
      headline: 'What are we learning today?',
      body: 'Questions, chavrusas, shiur notes, source sheets, and Torah that gets people talking.',
      prompts: ['Looking for a chavrusa for...', "Question on this week's parsha", 'Share a shiur or thought'],
      primaryCta: 'Start learning',
      actions: [
        { label: 'Find chavrusa', helper: 'Match quickly', tab: 'posts', prompt: 'Looking for a chavrusa for...' },
        { label: 'Ask Torah', helper: 'Start a thread', tab: 'discussions', prompt: 'Question on...' },
        { label: 'Share source', helper: 'Build library', tab: 'resources', prompt: null },
      ],
      emptyWin: 'First learning thread',
    };
  }

  if (typeKey === 'parents') {
    return {
      label: 'Parent room',
      headline: 'What do families need this week?',
      body: 'School tips, carpools, babysitters, camp help, local recs, and fast parent answers.',
      prompts: ['Anyone know a good...', 'Need carpool help for...', 'What are families doing for...'],
      primaryCta: 'Ask parents',
      actions: [
        { label: 'Ask for help', helper: 'Parent network', tab: 'questions', prompt: 'Anyone know a good...' },
        { label: 'Coordinate', helper: 'Carpool or plan', tab: 'posts', prompt: 'Need help coordinating...' },
        { label: 'Share event', helper: 'Families nearby', tab: 'events', prompt: 'Family event coming up...' },
      ],
      emptyWin: 'First helpful answer',
    };
  }

  return {
    label: typeKey === 'neighborhood' ? 'Local room' : 'Community room',
    headline: typeKey === 'neighborhood' ? 'What is happening nearby?' : `What is happening in ${community?.name || 'this space'}?`,
    body: typeKey === 'neighborhood'
      ? 'Local alerts, recs, plans, openings, questions, and neighbor help in one fast place.'
      : 'A living room for updates, questions, plans, and people who want to connect.',
    prompts: typeConfig?.prompts?.length ? typeConfig.prompts.slice(0, 3) : ['What should people know before tonight?', 'Ask for a fast local recommendation', 'Coordinate a ride, plan, or help'],
    primaryCta: typeConfig?.primaryCta || 'Post',
    actions: [
      { label: 'Ask the room', helper: 'Get a fast answer', tab: 'posts', prompt: 'Ask the room: does anyone know __?' },
      { label: 'Make a plan', helper: 'Tonight or this week', tab: 'events', prompt: 'Make a plan: who wants to join __ at __?' },
      { label: 'Invite people', helper: 'Grow the circle', tab: 'members', prompt: null },
    ],
    emptyWin: 'First useful post',
  };
}

function getCommunityEngagementKit(community, typeConfig, roomModel) {
  const name = `${community?.name || ''} ${community?.slug || ''} ${community?.description || ''}`.toLowerCase();
  const typeKey = typeConfig?.key || 'general';

  if (name.includes('kosher') || name.includes('food') || name.includes('restaurant') || name.includes('bakery') || name.includes('takeout') || name.includes('shabbos extras') || name.includes('dinner')) {
    return {
      boardTitle: 'Food pulse',
      boardBody: 'Restaurants, takeout timing, bakery drops, hechsher checks, and Shabbos extras people need before they leave the house.',
      missionTitle: 'Post one useful food tip',
      missionBody: 'Name the place, town, what to order, timing, and whether it is verified.',
      feedTitle: 'Kosher food feed',
      feedEmptyTitle: 'Start with something people can use today',
      feedEmptyBody: 'A great first post saves someone a bad order, long line, or last-minute Shabbos scramble.',
      starterThreads: [
        { title: 'Dinner decision', body: 'Where to go tonight, what to order, and parking or line reality.', prompt: 'Dinner decision: best spot in __ tonight for __. Parking/line is __.' },
        { title: 'Before Shabbos timing', body: 'Who still has challah, kugel, takeout, or extras?', prompt: 'Before Shabbos food update: __ has __ available until __.' },
        { title: 'Verify a kosher spot', body: 'Help keep the map trustworthy.', prompt: 'Kosher map check: __ in __. Hechsher/source is __.' },
      ],
      pollQuestion: 'What food help do people need most?',
      pollOptions: ['Dinner recs', 'Bakery timing', 'Shabbos extras', 'Hechsher checks'],
      rhythm: ['Thursday order thread', 'Friday bakery timing', 'Sunday restaurant reviews'],
    };
  }

  if (name.includes('teen') || name.includes('high school') || name.includes('yeshiva league') || name.includes('motzei') || name.includes('hangout')) {
    return {
      boardTitle: 'Tonight board',
      boardBody: 'Plans, rides, safe hangouts, games, school questions, and support should be easy to find without ten group chats.',
      missionTitle: 'Make one safe plan happen',
      missionBody: 'Post general town, vibe, time window, and move exact details into messages.',
      feedTitle: 'Teen feed',
      feedEmptyTitle: 'Start with a plan people can join',
      feedEmptyBody: 'Keep it useful and safe: general plans in the room, exact details in messages.',
      starterThreads: [
        { title: 'Motzei Shabbos plans', body: 'Find out what is happening and who wants to join.', prompt: 'Motzei Shabbos plan: thinking __ near __. Who is interested?' },
        { title: 'Need a ride', body: 'Ask safely without posting private details.', prompt: 'Need a ride around __ from __. Message me for exact details.' },
        { title: 'Quiet advice thread', body: 'A real question for people who understand.', prompt: 'Quiet question: has anyone dealt with __?' },
      ],
      pollQuestion: 'What should teens use this space for first?',
      pollOptions: ['Plans', 'Sports', 'Rides', 'Advice'],
      rhythm: ['Motzei Shabbos plans', 'Thursday ride check', 'Sunday school reset'],
    };
  }

  if (name.includes('sport') || name.includes('basketball') || name.includes('football') || name.includes('soccer') || name.includes('gym')) {
    return {
      boardTitle: 'Tonight board',
      boardBody: 'Games, courts, rides, teams, and workout partners should be one tap away.',
      missionTitle: 'Get one game moving',
      missionBody: 'Post sport, place, time, and how many people you need.',
      feedTitle: 'Sports feed',
      feedEmptyTitle: 'Start with a real plan',
      feedEmptyBody: 'The first post should make it easy for someone to show up.',
      starterThreads: [
        { title: 'Pickup game tonight', body: 'Sport, time, location, and how many more you need.', prompt: 'Pickup game tonight: sport, place, time, need __ more.' },
        { title: 'Need players', body: 'Fill a team fast without texting ten group chats.', prompt: 'Need players for __ at __. Who is in?' },
        { title: 'Training partner', body: 'Find someone for gym, run, drills, or practice.', prompt: 'Looking for a training partner this week for __.' },
      ],
      pollQuestion: 'What should this room organize first?',
      pollOptions: ['Basketball', 'Football', 'Soccer', 'Gym'],
      rhythm: ['After-school pickup', 'Motzei Shabbos game', 'Sunday morning run'],
    };
  }

  if (typeKey === 'shul') {
    return {
      boardTitle: 'Shul board',
      boardBody: 'Minyanim, rides, shiurim, kiddush, and lost items should be easy to act on.',
      missionTitle: 'Make the next update useful',
      missionBody: 'Post the time, place, and what people need to know.',
      feedTitle: 'Shul feed',
      feedEmptyTitle: 'Start with something useful',
      feedEmptyBody: 'A minyan time, shiur reminder, or ride request gives people a reason to return.',
      starterThreads: [
        { title: 'Minyan check', body: 'Ask who is coming and whether more people are needed.', prompt: 'Minyan check: __ at __. Who is coming?' },
        { title: 'Ride to shul', body: 'Coordinate who needs or can offer a ride.', prompt: 'Ride to shul: leaving from __ at __. Seats available/needed.' },
        { title: 'Shiur or kiddush', body: 'Post what is happening and when.', prompt: 'Upcoming at shul: __ at __.' },
      ],
      pollQuestion: 'What does this shul need posted most?',
      pollOptions: ['Minyan times', 'Shiurim', 'Rides', 'Kiddush'],
      rhythm: ['Morning minyan check', 'Thursday Shabbos updates', 'Motzei Shabbos announcements'],
    };
  }

  if (typeKey === 'chesed') {
    return {
      boardTitle: 'Help board',
      boardBody: 'Open needs should become completed mitzvahs with clear next steps.',
      missionTitle: 'Complete one need',
      missionBody: 'Post what is needed, by when, and how many helpers are still missing.',
      feedTitle: 'Chesed feed',
      feedEmptyTitle: 'Start with one clear need',
      feedEmptyBody: 'The best first post is specific: what, when, where, and how many people.',
      starterThreads: [
        { title: 'Need help today', body: 'Make the ask concrete and time-sensitive.', prompt: 'Need help today with __ by __. Still need __ people.' },
        { title: 'I can help', body: 'Offer a ride, meal, errand, or skill.', prompt: 'I can help today with __ near __.' },
        { title: 'Mitzvah completed', body: 'Close the loop and show impact.', prompt: 'This mitzvah was completed. Thank you to everyone who helped with __.' },
      ],
      pollQuestion: 'What help should we focus on first?',
      pollOptions: ['Meals', 'Rides', 'Errands', 'Calls'],
      rhythm: ['Daily open needs', 'Before Shabbos help', 'Sunday volunteer check'],
    };
  }

  if (typeKey === 'learning') {
    return {
      boardTitle: 'Learning board',
      boardBody: 'Questions, chavrusas, shiur links, and source sheets should turn into active learning.',
      missionTitle: 'Start one learning thread',
      missionBody: 'Ask a real question or post what you want to learn this week.',
      feedTitle: 'Learning feed',
      feedEmptyTitle: 'Start with a question',
      feedEmptyBody: 'A good Torah question or chavrusa ask gets people to respond.',
      starterThreads: [
        { title: 'Find a chavrusa', body: 'Topic, level, schedule, and location/Zoom.', prompt: 'Looking for a chavrusa for __. Available __.' },
        { title: 'Ask a Torah question', body: 'Turn a question into a thread.', prompt: 'Question on __: ' },
        { title: 'Share a shiur', body: 'Post a link or takeaway people can discuss.', prompt: 'Shiur takeaway: __. What do people think?' },
      ],
      pollQuestion: 'What should we learn next?',
      pollOptions: ['Parsha', 'Gemara', 'Halacha', 'Mussar'],
      rhythm: ['Morning chavrusa match', 'Thursday parsha thread', 'Sunday night review'],
    };
  }

  if (typeKey === 'parents') {
    return {
      boardTitle: 'Parent board',
      boardBody: 'School tips, carpools, babysitters, camp help, and fast answers for families.',
      missionTitle: 'Answer one parent need',
      missionBody: 'Post a specific question parents nearby can answer quickly.',
      feedTitle: 'Parent feed',
      feedEmptyTitle: 'Ask the first practical question',
      feedEmptyBody: 'Parents return when this saves them a call, text chain, or search.',
      starterThreads: [
        { title: 'Need a recommendation', body: 'Babysitter, tutor, camp, doctor, or activity.', prompt: 'Anyone recommend a good __ near __?' },
        { title: 'Carpool help', body: 'Time, school, route, and seats needed.', prompt: 'Carpool help needed from __ to __ at __.' },
        { title: 'Family plan', body: 'Find what people are doing this week.', prompt: 'What are families doing for __ this week?' },
      ],
      pollQuestion: 'What parent help is most useful?',
      pollOptions: ['Carpool', 'Babysitter', 'School tips', 'Activities'],
      rhythm: ['Sunday school-week prep', 'After-school carpool check', 'Before Shabbos family plans'],
    };
  }

  const isNeighborhood = typeKey === 'neighborhood';
  return {
    boardTitle: isNeighborhood ? 'Neighborhood board' : 'Community board',
    boardBody: isNeighborhood
      ? 'Local alerts, plans, recommendations, and neighbor help should move fast.'
      : 'Turn this from a group into a useful place people check before they text around.',
    missionTitle: isNeighborhood ? 'Post one useful local update' : 'Start one useful thread',
    missionBody: roomModel.body,
    feedTitle: isNeighborhood ? 'Local feed' : 'Room feed',
    feedEmptyTitle: 'Give people a reason to check back',
    feedEmptyBody: 'Start with something useful, local, or time-sensitive.',
    starterThreads: [
      { title: 'Ask a fast question', body: 'Get an answer from people in this space.', prompt: 'Does anyone know...' },
      { title: 'Share what is happening', body: 'Post a plan, alert, opening, or update.', prompt: 'What people should know today: ' },
      { title: 'Coordinate something', body: 'Make a plan people can join.', prompt: 'Who wants to join __ at __?' },
    ],
    pollQuestion: 'What should this room be best at?',
    pollOptions: ['Updates', 'Recommendations', 'Plans', 'Help'],
    rhythm: ['Daily quick question', 'Before Shabbos updates', 'Sunday week-ahead plans'],
  };
}

function formatRelativeActivity(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}

function MemberAvatarStack({ members = [], limit = 4, typeConfig }) {
  const visible = members.slice(0, limit);
  if (!visible.length) {
    const Icon = typeConfig?.icon || Users;
    return (
      <div className="flex -space-x-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-50 text-blue-600">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex -space-x-2">
      {visible.map((member, index) => {
        const name = member.profile?.display_name || member.user_name || member.display_name || member.full_name || 'Member';
        const initial = name.trim()[0]?.toUpperCase() || 'M';
        return (
          <div
            key={member.id || member.user_id || `${initial}-${index}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-600 to-slate-900 text-[10px] font-black text-white shadow-sm"
            title={name}
          >
            {initial}
          </div>
        );
      })}
    </div>
  );
}

function CommunityPresenceStrip({ community, members, engagementKit, roomModel, typeConfig, onPrompt }) {
  const activeCount = Math.max(
    members.length || 0,
    community?.activeNow || community?.active_now || community?.active_members || 0,
    1
  );
  const trending = engagementKit?.starterThreads?.[0]?.title || roomModel?.emptyWin || 'Start the next useful thread';
  const prompt = engagementKit?.starterThreads?.[0]?.prompt || roomModel?.prompts?.[0] || 'What should people here know today?';

  return (
    <section className="rounded-[26px] border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MemberAvatarStack members={members} limit={5} typeConfig={typeConfig} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-black text-slate-950">{activeCount} active in this room</p>
            <p className="truncate text-[11px] font-bold text-slate-500">Trending: {trending}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onPrompt(prompt)}
          className="shrink-0 rounded-full bg-slate-950 px-3 py-2 text-[11px] font-black text-white active:scale-95"
        >
          Jump in
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onPrompt(prompt)}
          className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-left active:scale-[0.98]"
        >
          <p className="text-[10px] font-black uppercase tracking-wide text-blue-500">Prompt</p>
          <p className="mt-1 line-clamp-2 text-[12px] font-black leading-snug text-blue-900">{prompt}</p>
        </button>
        <button
          type="button"
          onClick={() => toast.success('Thanks. Reports help keep this room safe.')}
          className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-left active:scale-[0.98]"
        >
          <p className="text-[10px] font-black uppercase tracking-wide text-rose-500">Safety</p>
          <p className="mt-1 text-[12px] font-black text-rose-900">Report a post</p>
        </button>
        <button
          type="button"
          onClick={() => toast.success('Blocked content controls are ready for this room.')}
          className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-left active:scale-[0.98]"
        >
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Control</p>
          <p className="mt-1 text-[12px] font-black text-slate-900">Block / hide</p>
        </button>
      </div>
    </section>
  );
}

export default function CommunityDetailView({ communityId, currentUser, onBack, fallbackCommunity }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(requestedTab || 'home');
  const [highlightEventId, setHighlightEventId] = useState(null);
  const [showClaim, setShowClaim] = useState(false);
  const [showAdminCenter, setShowAdminCenter] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState('overview');
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [posting, setPosting] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const queryClient = useQueryClient();

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      if (fallbackCommunity) return fallbackCommunity;
      try {
        const result = await dataService.entities.Community.get(communityId);
        if (result) return result;
      } catch {}
      const results = await dataService.entities.Community.filter({ id: communityId });
      return results[0] || null;
    },
    enabled: !!communityId,
  });

  const typeConfig = getCommunityTypeConfig(community || fallbackCommunity || {});

  const { data: membershipRecord = [] } = useQuery({
    queryKey: ['community-membership', communityId, currentUser?.id],
    queryFn: () => dataService.entities.UserCommunity.filter({ community_id: communityId, user_id: currentUser.id }),
    enabled: !!currentUser && !!communityId,
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['community-posts', communityId],
    queryFn: () => dataService.entities.UnifiedPost.filter({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => dataService.entities.UserCommunity.filter({ community_id: communityId }, '-created_date', 100),
    enabled: !!communityId,
  });

  // Check if the current (non-member) user was removed and can appeal
  const { data: myRemoval = null } = useQuery({
    queryKey: ['my-community-removal', communityId, currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_member_removals')
        .select('id, reason_code, removed_at, appeal_allowed, appeal:community_member_appeals(id, status)')
        .eq('community_id', communityId)
        .eq('removed_user_id', currentUser.id)
        .order('removed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!currentUser && !!communityId
      && membershipRecord.length === 0
      && community?.created_by_user_id !== currentUser?.id,
  });

  const { data: openNeeds = [] } = useQuery({
    queryKey: ['community-open-needs', communityId],
    queryFn: () => dataService.entities.MitzvahRequest.filter({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId && typeConfig.key === 'chesed',
  });

  const membershipRole = String(membershipRecord[0]?.role || '').toLowerCase();
  const isCreator = Boolean(currentUser?.id && community?.created_by_user_id === currentUser.id);
  const isFollowing = membershipRecord.length > 0 || isCreator;
  const isAdmin = currentUser?.role === 'admin' || isCreator || ['admin', 'moderator', 'owner'].includes(membershipRole);
  const canPost = isAdmin || (community?.posting_mode || 'open') === 'open';
  const actualMemberCount = members.length;
  const activeNeeds = openNeeds.filter((need) => OPEN_NEED_STATUSES.has(String(need.status || 'open')));
  const featureCapabilities = {
    events: canUseCommunityEvents(community),
    resources: canUseCommunityResources(community),
    chat: canUseCommunityChat(community),
    listings: Boolean(canUseCommunityMarketplace(community) && (community?.allow_member_listings || typeConfig.key === 'marketplace')),
    groups: true,
    forms: Boolean(community?.allow_forms),
  };
  const visibleTabs = getSupportedCommunityTabs(community || fallbackCommunity || {}, featureCapabilities);
  const navConfig = getCommunityNavConfig(community || fallbackCommunity || {}, featureCapabilities);
  const defaultTab = !requestedTab && isFollowing && featureCapabilities.chat ? 'chat' : 'home';

  useEffect(() => {
    if (requestedTab || isLoading) return;
    const nextTab = visibleTabs.includes(defaultTab) ? defaultTab : (visibleTabs[0] || 'home');
    setActiveTab((current) => (current === nextTab ? current : nextTab));
  }, [defaultTab, isLoading, requestedTab, visibleTabs]);

  const setTab = (tab) => {
    const nextTab = visibleTabs.includes(tab) ? tab : (visibleTabs[0] || 'home');
    setActiveTab(nextTab);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', nextTab);
      return next;
    }, { replace: true });
  };

  const openAdminCenter = (tab = 'overview') => {
    setAdminInitialTab(tab);
    setShowAdminCenter(true);
  };

  // Tab button refs for scrolling active pill into view after swipe
  const tabButtonRefs = useRef({});
  useEffect(() => {
    tabButtonRefs.current[activeTab]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeTab]);

  const swipeHandlers = useSwipeableTabs({ tabs: visibleTabs, activeTab, onTabChange: setTab, disabled: activeTab === 'home' });

  const { data: events = [] } = useQuery({
    queryKey: ['community-events', communityId],
    queryFn: () => dataService.entities.CommunityEvent.filter({ community_id: communityId }, 'start_date', 50),
    enabled: !!communityId && featureCapabilities.events,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['community-resources', communityId],
    queryFn: () => dataService.entities.CommunityResource.filter({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId && featureCapabilities.resources,
  });

  const { data: lastVisit = null } = useQuery({
    queryKey: ['community-last-visit', communityId, currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_last_visits')
        .select('visited_at')
        .eq('user_id', currentUser.id)
        .eq('community_id', communityId)
        .maybeSingle();
      return data;
    },
    enabled: Boolean(currentUser?.id && communityId && isFollowing),
    staleTime: 60000,
  });

  const visitTimerRef = useRef(null);
  useEffect(() => {
    if (!currentUser?.id || !communityId || !isFollowing) return;
    visitTimerRef.current = setTimeout(async () => {
      try {
        await supabase
          .from('community_last_visits')
          .upsert(
            { user_id: currentUser.id, community_id: communityId, visited_at: new Date().toISOString() },
            { onConflict: 'user_id,community_id' }
          );
      } catch {} // fire-and-forget
    }, 4000);
    return () => clearTimeout(visitTimerRef.current);
  }, [communityId, currentUser?.id, isFollowing]);

  const accentHex = community?.settings?.branding?.accentColor
    || (community || fallbackCommunity)?.featured_accent_color
    || typeConfig.accentHex
    || '#2563EB';

  useEffect(() => {
    document.documentElement.style.setProperty('--community-accent', accentHex);
    return () => document.documentElement.style.removeProperty('--community-accent');
  }, [accentHex]);

  const handleShare = async () => {
    if (!currentUser) {
      dataService.auth.redirectToLogin(`${window.location.pathname}${window.location.search || ''}`);
      return;
    }
    setShowInviteModal(true);
  };

  const handleFollow = async () => {
    if (!currentUser) {
      dataService.auth.redirectToLogin();
      return;
    }

    try {
      if (isFollowing) {
        if (isCreator) {
          toast.info('Community owners manage their community instead of leaving it.');
          return;
        }
        await dataService.entities.UserCommunity.delete(membershipRecord[0].id);
        if (community) await incrementCounter('communities', 'follower_count', communityId, -1);
        toast.success('Left community');
      } else {
        await dataService.entities.UserCommunity.create({ user_id: currentUser.id, community_id: communityId, role: 'member' });
        if (community) await incrementCounter('communities', 'follower_count', communityId, 1);
        toast.success('Joined!');
      }
    queryClient.invalidateQueries({ queryKey: ['community-membership', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community', communityId] });
    queryClient.invalidateQueries({ queryKey: ['user-communities', currentUser?.id] });
    } catch {
      toast.error('Could not update membership');
    }
  };

  const submitPost = async () => {
    const text = composeText.trim();
    if (!text) return;
    if (!currentUser) {
      dataService.auth.redirectToLogin();
      return;
    }

    setPosting(true);
    try {
      if (activeTab === 'announcements' && !isAdmin) {
        toast.error('Only community managers can post official announcements.');
        return;
      }
      await postsService.createCommunityPost({
        user_id: currentUser.id,
        community_id: communityId,
        type: getPostTypeForTab(activeTab, typeConfig.key),
        title: text.length > 72 ? text.slice(0, 72) : undefined,
        content: text,
      });
      setComposeText('');
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
      toast.success('Posted');
    } catch {
      toast.error('Could not post right now');
    } finally {
      setPosting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">JU</div>
        <h2 className="text-xl font-bold text-slate-800">Community not found</h2>
        <p className="text-slate-500 text-sm">This community may have been removed or the link is invalid.</p>
        <button onClick={onBack} className="mt-2 bg-blue-600 text-white rounded-full px-6 py-2.5 font-semibold text-sm active:scale-95 transition-all">
          Back to Communities
        </button>
      </div>
    );
  }

  const tabsWithCounts = visibleTabs.map((key) => ({
    key,
    label: getCommunityTabLabel(key),
    count: key === 'announcements'
      ? posts.filter((post) => matchesTab(post, 'announcements')).length
      : key === 'openNeeds'
        ? activeNeeds.length
        : key === 'events'
          ? events.length
        : 0,
  }));

  const heroRef = useRef(null);

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col">
      {/* Wrapper gives CommunityAppBar a real element to observe (non-zero area) */}
      <div ref={heroRef}>
        <CommunityHero
          community={community}
          isFollowing={isFollowing}
          isAdmin={isAdmin}
          isCreator={isCreator}
          onFollow={handleFollow}
          onManage={() => openAdminCenter('overview')}
          onClaim={() => setShowClaim(true)}
          onBack={onBack}
          onOpenDrawer={() => setShowDrawer(true)}
          actualMemberCount={actualMemberCount}
          members={members}
          currentUser={currentUser}
          onTabChange={setTab}
          typeConfig={typeConfig}
          inAppShell
        />
      </div>
      {/* key=communityId forces remount on navigation — prevents stale visible state */}
      <CommunityAppBar
        key={communityId}
        heroRef={heroRef}
        community={community}
        typeConfig={typeConfig}
        isAdmin={isAdmin}
        accentHex={accentHex}
        onBack={onBack}
        onManage={() => openAdminCenter('overview')}
        onShare={handleShare}
        onOpenDrawer={() => setShowDrawer(true)}
      />

      {/* Appeal banner — shown when user was removed and hasn't yet appealed */}
      {myRemoval && !isFollowing && (() => {
        const appealEntry = myRemoval.appeal?.[0];
        const appealStatus = appealEntry?.status ?? null;
        if (appealStatus === 'approved') return null;
        return (
          <div className={`border-b px-4 py-3 ${
            appealStatus === 'pending'
              ? 'bg-amber-50 border-amber-200'
              : appealStatus === 'denied'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="max-w-2xl mx-auto flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-slate-800">
                  {appealStatus === 'pending'
                    ? 'Your appeal is under review.'
                    : appealStatus === 'denied'
                    ? 'Your appeal was not approved.'
                    : 'You were removed from this community.'}
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {appealStatus === 'pending'
                    ? 'The community admin will review your appeal.'
                    : appealStatus === 'denied'
                    ? 'Contact the community admin if you have questions.'
                    : 'You may submit an appeal if you believe this was in error.'}
                </p>
              </div>
              {!appealStatus && myRemoval.appeal_allowed && (
                <button
                  type="button"
                  onClick={() => setShowAppealModal(true)}
                  className="flex-shrink-0 rounded-xl bg-[#2563EB] px-3 py-1.5 text-[12px] font-black text-white"
                >
                  Appeal
                </button>
              )}
            </div>
          </div>
        );
      })()}

      <div className="max-w-2xl mx-auto w-full px-4 pb-8" {...swipeHandlers}>
        {activeTab !== 'home' && (
          <button
            type="button"
            onClick={() => setTab('home')}
            className="flex items-center gap-1 pt-3 pb-1 text-[13px] font-bold text-slate-400 active:text-slate-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
        )}
        {activeTab === 'home' && (
          <RoutedCommunityHome
            posts={posts}
            activeNeeds={activeNeeds}
            composeText={composeText}
            setComposeText={setComposeText}
            submitPost={submitPost}
            posting={posting}
            onTabChange={setTab}
            canPost={canPost}
            community={community}
            typeConfig={typeConfig}
            members={members}
            events={events}
            resources={resources}
            isAdmin={isAdmin}
            isCreator={isCreator}
            isFollowing={isFollowing}
            lastVisitedAt={lastVisit?.visited_at}
            currentUser={currentUser}
            onFollow={handleFollow}
            onManage={() => openAdminCenter('content')}
            openAdminCenter={openAdminCenter}
            onOpenEvent={(event) => { setHighlightEventId(event.id); setTab('events'); }}
            visibleTabs={visibleTabs}
          />
        )}

        {activeTab === 'about' && (
          <AboutTab community={community} typeConfig={typeConfig} onClaim={() => setShowClaim(true)} />
        )}

        {activeTab === 'members' && (
          <CommunityMemberDirectory
            community={community}
            members={members}
            memberCount={actualMemberCount || community.follower_count || 0}
          />
        )}

        {['posts', 'questions', 'discussions', 'announcements'].includes(activeTab) && (
          <RoutedPostsTab
            posts={posts}
            isLoading={postsLoading}
            activeTab={activeTab}
            typeConfig={typeConfig}
            composeText={composeText}
            setComposeText={setComposeText}
            submitPost={submitPost}
            posting={posting}
            canPost={activeTab === 'announcements' ? isAdmin : canPost}
          />
        )}

        {activeTab === 'openNeeds' && (
          <RoutedOpenNeedsTab activeNeeds={activeNeeds} typeConfig={typeConfig} />
        )}

        {activeTab === 'events' && featureCapabilities.events && (
          <CommunityEventsTab
            events={events}
            community={community}
            currentUser={currentUser}
            communityId={communityId}
            isAdmin={isAdmin}
            highlightEventId={highlightEventId}
            typeConfig={typeConfig}
          />
        )}

        {activeTab === 'resources' && featureCapabilities.resources && (
          <CommunityResourceLibrary
            communityId={communityId}
            community={community}
            currentUser={currentUser}
            isAdmin={isAdmin}
            typeConfig={typeConfig}
          />
        )}

        {activeTab === 'listings' && featureCapabilities.listings && (
          <CommunityStoreTab
            communityId={communityId}
            community={community}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'groups' && (
          <CommunityGroupsTab
            communityId={communityId}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'forms' && featureCapabilities.forms && (
          <CommunityFormsTab
            communityId={communityId}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'chat' && featureCapabilities.chat && (
          <div className="mt-4 h-[60vh] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <GroupChatSection communityId={communityId} currentUser={currentUser} onInvite={handleShare} />
          </div>
        )}
      </div>

      {showDrawer && community && (
        <CommunityNavDrawer
          community={community}
          visibleTabs={visibleTabs}
          activeTab={activeTab}
          tabsWithCounts={tabsWithCounts}
          onTabChange={(tab) => { setTab(tab); setShowDrawer(false); }}
          onClose={() => setShowDrawer(false)}
          accentHex={accentHex}
          isAdmin={isAdmin}
          onManage={() => { setShowDrawer(false); openAdminCenter('overview'); }}
        />
      )}

      <ClaimModal
        open={showClaim}
        onOpenChange={setShowClaim}
        community={community}
        currentUser={currentUser}
      />
      <CommunityAdminCenter
        community={community}
        currentUser={currentUser}
        open={showAdminCenter}
        onClose={() => setShowAdminCenter(false)}
        onCommunityUpdated={(updated) => {
          if (updated) {
            // Immediately update the cache so tabs/flags reflect without waiting for a refetch.
            queryClient.setQueryData(['community', communityId], updated);
          }
          queryClient.invalidateQueries({ queryKey: ['community', communityId] });
          queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
          queryClient.invalidateQueries({ queryKey: ['communities-list'] });
          queryClient.invalidateQueries({ queryKey: ['community-pinned-post', communityId] });
        }}
        initialTab={adminInitialTab}
        onDeleted={() => {
          setShowAdminCenter(false);
          onBack?.();
        }}
      />
      <CommunityInviteModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        community={community}
        currentUser={currentUser}
        typeConfig={typeConfig}
      />
      {showAppealModal && myRemoval && (
        <AppealSubmitModal
          removal={myRemoval}
          communityName={community?.name}
          onClose={() => setShowAppealModal(false)}
          onSubmitted={() => {
            setShowAppealModal(false);
            queryClient.invalidateQueries({ queryKey: ['my-community-removal', communityId, currentUser?.id] });
          }}
        />
      )}
    </div>
  );
}

function CommunityAppBar({ heroRef, community, typeConfig, isAdmin, accentHex, onBack, onManage, onShare, onOpenDrawer }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    // Observe the hero container itself (non-zero area, reliable).
    // isIntersecting = true while ANY part of hero is in viewport → keep AppBar hidden.
    // isIntersecting = false when hero is completely scrolled away → show AppBar.
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [heroRef]);

  return createPortal(
    <div
      className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-between px-3 transition-opacity duration-150"
      style={{
        background: accentHex,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <button
        onClick={onBack}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all"
        style={{ background: 'rgba(255,255,255,0.2)' }}
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

      <p className="font-black text-[15px] text-white tracking-tight truncate px-2 flex-1 text-center">
        {community.name}
      </p>

      <button
        onClick={onOpenDrawer}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all"
        style={{ background: 'rgba(255,255,255,0.2)' }}
        aria-label="Community menu"
      >
        <span className="font-black text-[18px] leading-none tracking-[2px] text-white">≡</span>
      </button>
    </div>,
    document.body
  );
}

function CommunityNavDrawer({ community, visibleTabs, activeTab, tabsWithCounts, onTabChange, onClose, accentHex, isAdmin, onManage }) {
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        opacity: 1,
        pointerEvents: 'all',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />

      {/* Drawer panel — slides in from right */}
      <div
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '72%', maxWidth: 320,
          background: '#fff',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.18)',
          animation: 'communityDrawerIn .28s cubic-bezier(.32,.72,0,1) both',
        }}
      >
        <style>{`
          @keyframes communityDrawerIn {
            from { transform: translateX(102%); }
            to { transform: translateX(0); }
          }
          @keyframes communityDrawerOut {
            from { transform: translateX(0); }
            to { transform: translateX(102%); }
          }
        `}</style>

        {/* Drawer header */}
        <div style={{ padding: '52px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
          {community.logo_url ? (
            <img
              src={community.logo_url}
              alt=""
              style={{ width: 42, height: 42, borderRadius: 12, objectFit: 'cover', marginBottom: 10 }}
            />
          ) : (
            <div
              style={{
                width: 42, height: 42, borderRadius: 12, background: accentHex,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 10,
              }}
            >
              {(community.name || '?')[0].toUpperCase()}
            </div>
          )}
          <p style={{ fontSize: 16, fontWeight: 900, color: '#0d0d0b', letterSpacing: '-0.02em', marginBottom: 2 }}>
            {community.name}
          </p>
          <p style={{ fontSize: 12, color: '#8c8884', fontWeight: 500 }}>
            {community.type}{community.follower_count ? ` · ${community.follower_count.toLocaleString()} members` : ''}
          </p>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {visibleTabs.map((tabKey) => {
            const TabIcon = TAB_ICON_MAP[tabKey] || Home;
            const isActive = activeTab === tabKey;
            const tabInfo = tabsWithCounts.find((t) => t.key === tabKey);
            return (
              <button
                key={tabKey}
                onClick={() => onTabChange(tabKey)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 20px', width: '100%', textAlign: 'left',
                  background: isActive ? '#f9f8f6' : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.1s',
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                    background: isActive ? `${accentHex}22` : '#f4f4f2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <TabIcon style={{ width: 18, height: 18, color: isActive ? accentHex : '#6b7280' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0d0d0b' }}>{getCommunityTabLabel(tabKey)}</p>
                  {tabInfo?.count > 0 && (
                    <p style={{ fontSize: 12, color: '#8c8884', marginTop: 1 }}>
                      {tabInfo.count} {tabKey === 'events' ? 'upcoming' : tabKey === 'announcements' ? 'updates' : ''}
                    </p>
                  )}
                </div>
              </button>
            );
          })}

          <div style={{ height: 1, background: '#ece9e4', margin: '6px 20px' }} />

          {isAdmin && (
            <button
              onClick={onManage}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 20px', width: '100%', textAlign: 'left',
                background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                  background: '#f4f4f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                ⚙️
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0d0d0b' }}>Admin Center</p>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function CommunityBottomNav({ navConfig, activeTab, tabsWithCounts, onTabChange, onMoreClick, accentHex }) {
  const moreIsActive = navConfig.more.includes(activeTab);
  return createPortal(
    <nav className="app-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4">
      <div className="glass-toolbar mobile-page pointer-events-auto relative overflow-hidden rounded-[28px] px-2 py-1.5">
        <div className="flex items-center justify-around px-1 py-1.5">
          {navConfig.primary.map((tabKey) => {
            const TabIcon = TAB_ICON_MAP[tabKey] || Home;
            const isActive = activeTab === tabKey;
            const tabInfo = tabsWithCounts.find((t) => t.key === tabKey);
            return (
              <button
                key={tabKey}
                onClick={() => onTabChange(tabKey)}
                className={`motion-press relative flex min-h-[58px] min-w-[54px] flex-1 flex-col items-center justify-center rounded-[20px] py-[7px] touch-manipulation ${
                  isActive ? 'bg-white shadow-[0_12px_24px_rgba(37,99,235,0.14)] ring-1 ring-blue-100' : 'text-slate-500 hover:bg-white/70 active:bg-slate-100/60'
                }`}
              >
                {isActive && (
                  <span className="nav-active-pill absolute inset-1 rounded-[16px]" style={{ background: `${accentHex}18` }} />
                )}
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <div className="relative">
                    <TabIcon
                      className="h-[22px] w-[22px] transition-colors"
                      style={{ color: isActive ? accentHex : '#94a3b8' }}
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                    {tabInfo?.count > 0 && !isActive && (
                      <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center px-0.5">
                        {tabInfo.count > 99 ? '99+' : tabInfo.count}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold leading-none transition-colors"
                    style={{ color: isActive ? accentHex : '#94a3b8' }}
                  >
                    {getCommunityTabLabel(tabKey)}
                  </span>
                </div>
              </button>
            );
          })}
          {navConfig.more.length > 0 && (
            <button
              onClick={onMoreClick}
              className={`motion-press relative flex min-h-[58px] min-w-[54px] flex-1 flex-col items-center justify-center rounded-[20px] py-[7px] touch-manipulation ${
                moreIsActive ? 'bg-white shadow-[0_12px_24px_rgba(37,99,235,0.14)] ring-1 ring-blue-100' : 'text-slate-500 hover:bg-white/70 active:bg-slate-100/60'
              }`}
            >
              {moreIsActive && (
                <span className="nav-active-pill absolute inset-1 rounded-[16px]" style={{ background: `${accentHex}18` }} />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <MoreHorizontal
                  className="h-[22px] w-[22px] transition-colors"
                  style={{ color: moreIsActive ? accentHex : '#94a3b8' }}
                  strokeWidth={moreIsActive ? 2.5 : 1.75}
                />
                <span
                  className="text-[10px] font-semibold leading-none transition-colors"
                  style={{ color: moreIsActive ? accentHex : '#94a3b8' }}
                >
                  More
                </span>
              </div>
            </button>
          )}
        </div>
      </div>
    </nav>,
    document.body
  );
}

function CommunityMoreSheet({ navConfig, activeTab, tabsWithCounts, onTabChange, onClose, accentHex }) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl shadow-2xl"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-[15px] font-black text-slate-900">More</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 rotate-[-90deg]" />
          </button>
        </div>
        <div className="px-4 pb-4 grid grid-cols-3 gap-3">
          {navConfig.more.map((tabKey) => {
            const TabIcon = TAB_ICON_MAP[tabKey] || Home;
            const isActive = activeTab === tabKey;
            const tabInfo = tabsWithCounts.find((t) => t.key === tabKey);
            return (
              <button
                key={tabKey}
                onClick={() => onTabChange(tabKey)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95"
                style={
                  isActive
                    ? { background: `${accentHex}15`, borderColor: `${accentHex}40` }
                    : { background: '#f8fafc', borderColor: '#e2e8f0' }
                }
              >
                <div className="relative">
                  <TabIcon
                    className="w-6 h-6"
                    style={{ color: isActive ? accentHex : '#64748b' }}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                  {tabInfo?.count > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center px-0.5">
                      {tabInfo.count > 99 ? '99+' : tabInfo.count}
                    </span>
                  )}
                </div>
                <span
                  className="text-[11px] font-bold leading-none text-center"
                  style={{ color: isActive ? accentHex : '#64748b' }}
                >
                  {tabInfo?.label || getCommunityTabLabel(tabKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}

function ComposerBox({ typeConfig, composeText, setComposeText, submitPost, posting }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-950">{typeConfig.primaryCta}</p>
          <p className="text-[11px] font-semibold text-slate-500">{typeConfig.tagline}</p>
        </div>
      </div>
      <textarea
        value={composeText}
        onChange={(event) => setComposeText(event.target.value)}
        rows={3}
        placeholder={typeConfig.prompts[0] || 'Share something with the community...'}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
      />
      <div className="mt-3 flex justify-end">
        <button
          onClick={submitPost}
          disabled={posting || !composeText.trim()}
          className={`motion-press inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br ${typeConfig.accent} px-4 text-xs font-black text-white disabled:opacity-50`}
        >
          <Send className="h-3.5 w-3.5" />
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}

function TypeAwareComposer({ typeConfig, composeText, setComposeText, submitPost, posting, mode }) {
  const [expanded, setExpanded] = useState(false);
  const composerMode = mode || typeConfig.composerMode || 'post';

  // Chesed mode: two action buttons → expand to form below
  if (composerMode === 'chesed') {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
        {!expanded ? (
          <div className="flex gap-2 p-3">
            <button
              type="button"
              onClick={() => setExpanded('request')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 py-2.5 text-[13px] font-black text-emerald-700 active:scale-95 transition-all"
            >
              🙏 Request Help
            </button>
            <button
              type="button"
              onClick={() => setExpanded('offer')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-50 border border-blue-200 py-2.5 text-[13px] font-black text-blue-700 active:scale-95 transition-all"
            >
              💚 Offer Help
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${expanded === 'request' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {expanded === 'request' ? '🙏 Requesting help' : '💚 Offering help'}
              </span>
              <button type="button" onClick={() => { setExpanded(false); setComposeText(''); }} className="ml-auto text-[12px] font-semibold text-slate-400 hover:text-slate-600">Cancel</button>
            </div>
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              rows={3}
              autoFocus
              placeholder={expanded === 'request' ? 'Describe what you need — meal, ride, errand, or something else...' : 'Describe what you can offer or how you can help...'}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={submitPost}
                disabled={posting || !composeText.trim()}
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-black text-white disabled:opacity-50 ${expanded === 'request' ? 'bg-emerald-600' : 'bg-blue-600'}`}
              >
                <Send className="h-3.5 w-3.5" />
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Message mode: single-line that expands on focus
  if (composerMode === 'message') {
    return (
      <div className={`rounded-2xl border bg-white shadow-sm transition-all ${expanded ? 'border-blue-300' : 'border-slate-100'}`}>
        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
              <MessageCircle className="h-3.5 w-3.5" />
            </div>
            <span className="text-[13px] font-semibold text-slate-400">{typeConfig.prompts[0] || 'Share something with the community...'}</span>
          </button>
        ) : (
          <div className="p-4">
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              rows={3}
              autoFocus
              placeholder={typeConfig.prompts[0] || 'Share something with the community...'}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            />
            <div className="mt-2 flex items-center justify-between">
              <button type="button" onClick={() => { setExpanded(false); setComposeText(''); }} className="text-[12px] font-semibold text-slate-400 hover:text-slate-600">Cancel</button>
              <button onClick={submitPost} disabled={posting || !composeText.trim()} className={`inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br ${typeConfig.accent} px-4 text-xs font-black text-white disabled:opacity-50`}>
                <Send className="h-3.5 w-3.5" />
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Official mode (admin-only composer for shul/org)
  if (composerMode === 'official') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black uppercase tracking-wide text-amber-700 flex items-center gap-1">
            📢 Post Announcement
          </span>
        </div>
        <textarea
          value={composeText}
          onChange={(e) => setComposeText(e.target.value)}
          rows={3}
          placeholder="Share an official update with the community..."
          className="w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-400"
        />
        <div className="mt-2 flex justify-end">
          <button onClick={submitPost} disabled={posting || !composeText.trim()} className="inline-flex h-9 items-center gap-2 rounded-xl bg-amber-600 px-4 text-xs font-black text-white disabled:opacity-50">
            <Send className="h-3.5 w-3.5" />
            {posting ? 'Posting...' : 'Post Update'}
          </button>
        </div>
      </div>
    );
  }

  // Post mode (default): collapsed pill → expands on tap
  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all ${expanded ? 'border-blue-200' : 'border-slate-100'}`}>
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left"
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
            <MessageCircle className="h-3.5 w-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-slate-400">{typeConfig.prompts[0] || 'Share something with the community...'}</span>
        </button>
      ) : (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
              <MessageCircle className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-black text-slate-950">{typeConfig.primaryCta}</p>
            <button type="button" onClick={() => { setExpanded(false); setComposeText(''); }} className="ml-auto text-[12px] font-semibold text-slate-400 hover:text-slate-600">Cancel</button>
          </div>
          <textarea
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            rows={3}
            autoFocus
            placeholder={typeConfig.prompts[0] || 'Share something with the community...'}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
          />
          <div className="mt-2 flex justify-end">
            <button onClick={submitPost} disabled={posting || !composeText.trim()} className={`inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br ${typeConfig.accent} px-4 text-xs font-black text-white disabled:opacity-50`}>
              <Send className="h-3.5 w-3.5" />
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const POST_LAUNCH_DISMISS_KEY = (id) => `post_launch_dismissed_${id}`;

function isAnn(post) {
  return String(post.type || post.post_type || post.category || '').toLowerCase() === 'announcement';
}

function RightNowBanner({ posts, events, activeNeeds, resources, typeConfig, lastVisitedAt, onTabChange }) {
  const since = lastVisitedAt ? new Date(lastVisitedAt) : null;
  const newAnn = since ? posts.filter((p) => isAnn(p) && new Date(p.created_at || p.created_date) > since).length : 0;
  const newPosts = since ? posts.filter((p) => !isAnn(p) && new Date(p.created_at || p.created_date) > since).length : 0;
  const newEvents = since ? events.filter((e) => new Date(e.created_at) > since).length : 0;
  const totalNew = newAnn + newPosts + newEvents;

  if (totalNew > 0) {
    const primaryCount = newAnn > 0 ? newAnn : newPosts > 0 ? newPosts : newEvents;
    const primaryLabel = newAnn > 0
      ? `${newAnn} new ${newAnn === 1 ? 'announcement' : 'announcements'}`
      : newPosts > 0
        ? `${newPosts} new ${newPosts === 1 ? 'post' : 'posts'}`
        : `${newEvents} new ${newEvents === 1 ? 'event' : 'events'}`;
    const action = () => onTabChange(newAnn > 0 ? 'announcements' : newPosts > 0 ? 'posts' : 'events');
    const extra = totalNew - primaryCount;
    return (
      <button
        type="button"
        onClick={action}
        className="w-full flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/80 px-3.5 py-2.5 text-left active:opacity-80 transition-opacity"
      >
        <Sparkles className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
        <span className="flex-1 text-[13px] font-bold text-slate-800">{primaryLabel}</span>
        {extra > 0 && (
          <span className="text-[11px] font-black text-blue-600 flex-shrink-0">+{extra} more</span>
        )}
        <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
      </button>
    );
  }

  // Fall back to the single most important community item
  const typeKey = typeConfig?.key || 'general';
  const pinnedAnn = posts.find((p) => p.is_pinned && isAnn(p)) || posts.find(isAnn);
  const upcomingEvent = events
    .filter((e) => new Date(e.start_date || e.event_date) >= new Date())
    .sort((a, b) => new Date(a.start_date || a.event_date) - new Date(b.start_date || b.event_date))[0];
  const urgentNeed = typeKey === 'chesed' ? activeNeeds[0] : null;
  const featuredResource = resources.find((r) => r.is_pinned) || resources[0];

  let item = null;
  if (urgentNeed) {
    item = { icon: '🙏', label: 'Open need', text: urgentNeed.title || 'Community chesed request', action: () => onTabChange('openNeeds'), colorClass: 'border-emerald-100 bg-emerald-50/80', labelClass: 'text-emerald-700' };
  } else if (pinnedAnn) {
    const raw = pinnedAnn.content || pinnedAnn.body || pinnedAnn.title || '';
    item = { icon: '📢', label: 'Latest update', text: raw.length > 80 ? `${raw.slice(0, 80)}…` : raw, action: () => onTabChange('announcements'), colorClass: 'border-amber-100 bg-amber-50/80', labelClass: 'text-amber-700' };
  } else if (upcomingEvent) {
    item = { icon: '📅', label: 'Coming up', text: upcomingEvent.title || upcomingEvent.name || '', action: () => onTabChange('events'), colorClass: 'border-blue-100 bg-blue-50/80', labelClass: 'text-blue-700' };
  } else if (featuredResource) {
    item = { icon: '📎', label: 'Resource', text: featuredResource.title || '', action: () => onTabChange('resources'), colorClass: 'border-violet-100 bg-violet-50/80', labelClass: 'text-violet-700' };
  }

  if (!item) return null;

  return (
    <button
      type="button"
      onClick={item.action}
      className={`w-full flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left active:opacity-80 transition-opacity ${item.colorClass}`}
    >
      <span className="text-sm leading-none flex-shrink-0">{item.icon}</span>
      <div className="min-w-0 flex-1">
        <span className={`block text-[10px] font-black uppercase tracking-wide ${item.labelClass}`}>{item.label}</span>
        <span className="block text-[13px] font-bold text-slate-900 leading-snug mt-0.5 line-clamp-1">{item.text}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
    </button>
  );
}

function VisitorLanding({ community, typeConfig, posts, events, resources, members, onFollow, onTabChange }) {
  const description = community?.settings?.welcome_message
    || community?.welcome_message
    || community?.description_long
    || community?.description
    || typeConfig.cardFallback;
  const memberCount = members.length > 0 ? members.length : (community?.follower_count || 0);
  const pinnedPost = posts.find((p) => p.is_pinned) || posts.find(isAnn);
  const upcomingEvent = events
    .filter((e) => new Date(e.start_date || e.event_date) >= new Date())
    .sort((a, b) => new Date(a.start_date || a.event_date) - new Date(b.start_date || b.event_date))[0];
  const featuredResource = resources.find((r) => r.is_pinned) || resources[0];
  const hasFeatured = pinnedPost || upcomingEvent || featuredResource;
  const previewPosts = posts.slice(0, 2);
  const lockedCount = Math.max(0, posts.length - previewPosts.length);
  const Icon = typeConfig.icon;

  return (
    <div className="space-y-3 pt-3">
      {/* Value proposition + join CTA */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="px-5 pt-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">{typeConfig.label}</span>
            {memberCount > 0 && (
              <span className="ml-auto flex items-center gap-1 text-[12px] font-bold text-slate-500">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {memberCount.toLocaleString()}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[14px] font-semibold text-slate-700 leading-relaxed mb-5">{description}</p>
          )}
          <button
            type="button"
            onClick={onFollow}
            className={`w-full h-11 rounded-2xl bg-gradient-to-r ${typeConfig.accent} text-white font-black text-[15px] active:scale-[0.98] transition-all shadow-sm`}
          >
            Join {community.name}
          </button>
        </div>
      </div>

      {/* Featured pinned post / next event / top resource */}
      {hasFeatured && (
        <CommunityFeaturedSection
          typeConfig={typeConfig}
          posts={posts}
          events={events}
          resources={resources}
          onTabChange={onTabChange}
        />
      )}

      {/* Preview posts with join gate */}
      {previewPosts.length > 0 && (
        <div>
          <p className="app-section-label px-1 mb-2">
            Community posts
          </p>
          <div className="space-y-2.5">
            {previewPosts.map((post) => (
              <CommunityPostPreview key={post.id} post={post} typeConfig={typeConfig} />
            ))}
          </div>
          {lockedCount > 0 && (
            <div className="mt-2 rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 px-5 py-6 text-center">
              <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
                <Lock className="h-5 w-5" />
              </div>
              <p className="text-[15px] font-black text-slate-900 mb-1">
                {lockedCount} more {lockedCount === 1 ? 'post' : 'posts'} in this community
              </p>
              <p className="text-[12px] font-semibold text-slate-500 mb-4">
                Join to read, reply, and participate
              </p>
              <button
                type="button"
                onClick={onFollow}
                className={`h-10 px-6 rounded-full bg-gradient-to-r ${typeConfig.accent} text-white font-black text-[13px] active:scale-95 transition-all`}
              >
                Join for free
              </button>
            </div>
          )}
        </div>
      )}

      {/* Brand-new community — no posts yet */}
      {posts.length === 0 && (
        <div className="app-empty-state">
          <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="app-empty-state-title mb-1">{typeConfig.emptyTitle || 'Be the first to join'}</p>
          <p className="app-empty-state-body">{typeConfig.tagline}</p>
        </div>
      )}
    </div>
  );
}

function FeaturedLaunchpadCard({ tabKey, typeConfig, onTabChange, cardData }) {
  const Icon = TAB_ICON_MAP[tabKey] || Hash;
  const copy = getCommunityActionCopy(tabKey, typeConfig);
  const hasRealData = Boolean(cardData.stat || cardData.preview);
  return (
    <button
      type="button"
      onClick={() => onTabChange(tabKey)}
      className="group w-full overflow-hidden rounded-[28px] border border-blue-100 bg-white text-left shadow-sm active:scale-[0.99] transition-all"
    >
      <div className={`bg-gradient-to-br ${typeConfig.accent} px-5 py-4 text-white`}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/20">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-white/75">
              {hasRealData ? getCommunityTabLabel(tabKey) : 'Next best move'}
            </p>
            <h3 className="mt-1 text-[18px] font-black leading-tight">{hasRealData ? (cardData.preview || copy.title) : copy.title}</h3>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 px-5 py-3.5">
        <p className="min-w-0 flex-1 text-[13px] font-semibold leading-5 text-slate-600">
          {hasRealData ? (cardData.stat || copy.body) : copy.body}
        </p>
        <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-[12px] font-black text-blue-700 group-active:bg-blue-100">
          {copy.action}
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

function SecondaryLaunchpadCard({ tabKey, typeConfig, onTabChange, cardData }) {
  const Icon = TAB_ICON_MAP[tabKey] || Hash;
  const copy = getCommunityActionCopy(tabKey, typeConfig);
  const hasData = cardData.stat || cardData.preview;
  const subtext = hasData ? (cardData.stat || cardData.preview) : copy.body;
  const subtextClass = hasData ? 'text-blue-700 font-black' : 'text-slate-500 font-semibold';
  return (
    <button
      type="button"
      onClick={() => onTabChange(tabKey)}
      className="group flex min-h-[134px] flex-col items-start justify-between rounded-[22px] border border-slate-100 bg-white p-4 text-left shadow-sm active:scale-[0.98] active:bg-slate-50 transition-all"
    >
      <div className="flex w-full items-start gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-black leading-tight text-slate-950">{copy.title}</p>
          {subtext && (
            <p className={`mt-1 text-[11px] leading-snug line-clamp-2 ${subtextClass}`}>{subtext}</p>
          )}
        </div>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-black text-blue-600">
        {copy.action}
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function CommunityActionHeader({ community, typeConfig, posts, activeNeeds, events, resources, members, onTabChange }) {
  const latestPost = posts[0];
  const latestPostAge = formatRelativeActivity(latestPost?.created_at || latestPost?.created_date);
  const upcomingEvents = events.filter((event) => {
    const value = event.start_date || event.event_date;
    return !value || new Date(value) >= new Date();
  });
  const memberCount = members.length > 0 ? members.length : (community?.follower_count || 0);
  const hasAnyActivity = posts.length > 0 || activeNeeds.length > 0 || upcomingEvents.length > 0 || resources.length > 0;
  const Icon = typeConfig.icon;

  const focus = activeNeeds.length
    ? { label: `${activeNeeds.length} open ${activeNeeds.length === 1 ? 'need' : 'needs'}`, tab: 'openNeeds', tone: 'text-rose-700 bg-rose-50 border-rose-100' }
    : upcomingEvents.length
      ? { label: `${upcomingEvents.length} upcoming ${upcomingEvents.length === 1 ? 'event' : 'events'}`, tab: 'events', tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' }
      : latestPost
        ? { label: `Updated ${latestPostAge || 'recently'}`, tab: isAnn(latestPost) ? 'announcements' : 'posts', tone: 'text-blue-700 bg-blue-50 border-blue-100' }
        : { label: 'Ready to launch', tab: 'posts', tone: 'text-slate-700 bg-slate-50 border-slate-100' };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-sm">
      <div className={`relative bg-gradient-to-br ${typeConfig.accent} px-5 py-5 text-white`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_38%)]" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-white/75">Community home</p>
            <h2 className="mt-1 text-[22px] font-black leading-tight">
              {hasAnyActivity ? 'What needs attention now?' : 'Make this space useful from day one'}
            </h2>
            <p className="mt-2 text-[13px] font-semibold leading-5 text-white/82">
              {hasAnyActivity
                ? 'The home page now points members toward live updates, open needs, events, and the next action.'
                : 'Invite a few people, post the first update, and give this community a clear reason to come back.'}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-white">
        <button type="button" onClick={() => onTabChange(focus.tab)} className="px-3 py-3 text-left active:bg-slate-50">
          <span className={`inline-flex max-w-full rounded-full border px-2 py-1 text-[10px] font-black ${focus.tone}`}>
            <span className="truncate">{focus.label}</span>
          </span>
          <p className="mt-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Right now</p>
        </button>
        <button type="button" onClick={() => onTabChange('members')} className="px-3 py-3 text-left active:bg-slate-50">
          <MemberAvatarStack members={members} typeConfig={typeConfig} />
          <p className="mt-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">{memberCount} members</p>
        </button>
        <button type="button" onClick={() => onTabChange('posts')} className="px-3 py-3 text-left active:bg-slate-50">
          <p className="text-[18px] font-black text-slate-950">{posts.length}</p>
          <p className="mt-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Posts</p>
        </button>
      </div>
    </section>
  );
}

function CommunityMomentumPanel({
  kit,
  posts,
  activeNeeds,
  events,
  memberCount,
  onPrompt,
  onTabChange,
  visibleTabs = [],
}) {
  const upcomingEvents = events.filter((event) => {
    const value = event.start_date || event.event_date;
    return !value || new Date(value) >= new Date();
  });
  const boardCards = [
    {
      icon: Activity,
      label: 'Live now',
      value: activeNeeds.length ? `${activeNeeds.length} open needs` : upcomingEvents.length ? `${upcomingEvents.length} plans` : 'Ready',
      helper: activeNeeds.length ? 'People can act now' : upcomingEvents.length ? 'Open the next plan' : kit.missionTitle,
      tone: 'bg-rose-50 text-rose-700 border-rose-100',
      tab: activeNeeds.length ? 'openNeeds' : upcomingEvents.length ? 'events' : 'posts',
    },
    {
      icon: MessageCircle,
      label: 'Room feed',
      value: `${posts.length} thread${posts.length === 1 ? '' : 's'}`,
      helper: posts.length ? 'Keep it moving' : kit.feedEmptyTitle,
      tone: 'bg-blue-50 text-blue-700 border-blue-100',
      tab: 'posts',
    },
    {
      icon: Users,
      label: 'People',
      value: `${memberCount || 0} here`,
      helper: memberCount > 1 ? 'Invite them into action' : 'Bring in the first few',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      tab: 'members',
    },
  ];
  const openTab = (tab) => onTabChange(visibleTabs.includes(tab) ? tab : 'posts');

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-rose-500">Active today</p>
          <h3 className="text-[17px] font-black leading-tight text-slate-950">{kit.boardTitle}</h3>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">{kit.boardBody}</p>
        </div>
        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-500">
          {posts.length + activeNeeds.length + upcomingEvents.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {boardCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => openTab(card.tab)}
              className={`rounded-2xl border p-3 text-left transition-all active:scale-[0.98] ${card.tone}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/75">
                  <Icon className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-wide opacity-70">{card.label}</p>
              <p className="mt-0.5 text-[15px] font-black leading-tight">{card.value}</p>
              <p className="mt-1 text-[11px] font-bold leading-snug opacity-75">{card.helper}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Vote className="h-4 w-4 text-blue-600" />
          <p className="text-[12px] font-black text-slate-900">{kit.pollQuestion}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {kit.pollOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onPrompt(`Vote: ${option}. I think we should organize this next.`)}
              className="flex-shrink-0 rounded-full border border-white bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm active:scale-95 transition-all"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CommunityStarterFeed({ kit, posts, typeConfig, onPrompt, onTabChange }) {
  const visiblePosts = posts.slice(0, 3);

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{kit.feedTitle}</p>
          <h3 className="text-[17px] font-black text-slate-950">
            {visiblePosts.length ? 'Latest from the room' : kit.feedEmptyTitle}
          </h3>
          {!visiblePosts.length && (
            <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">{kit.feedEmptyBody}</p>
          )}
        </div>
        <button type="button" onClick={() => onTabChange('posts')} className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700">
          View all
        </button>
      </div>

      {visiblePosts.length ? (
        <div className="space-y-2.5">
          {visiblePosts.map((post) => (
            <CommunityPostPreview key={post.id} post={post} typeConfig={typeConfig} compact />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {kit.starterThreads.map((thread) => (
            <button
              key={thread.title}
              type="button"
              onClick={() => onPrompt(thread.prompt)}
              className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-3 text-left shadow-sm transition-all active:scale-[0.98]"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Zap className="h-4 w-4" />
              </div>
              <p className="text-[13px] font-black leading-tight text-slate-950">{thread.title}</p>
              <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">{thread.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-blue-600">
                Start this <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function CommunityRhythmStrip({ kit, onPrompt }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Clock3 className="h-4 w-4 text-slate-500" />
        <p className="text-[12px] font-black uppercase tracking-wide text-slate-500">Weekly rhythm</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {kit.rhythm.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPrompt(`${item}: `)}
            className="flex min-w-[150px] flex-shrink-0 items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-left active:scale-[0.98] transition-all"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-blue-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <span className="text-[12px] font-black leading-tight text-slate-800">{item}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function CommunitySocialStarter({
  community,
  typeConfig,
  posts,
  activeNeeds,
  events,
  members,
  composeText,
  setComposeText,
  submitPost,
  posting,
  onTabChange,
  visibleTabs = [],
}) {
  const roomModel = getCommunityRoomModel(community, typeConfig);
  const engagementKit = getCommunityEngagementKit(community, typeConfig, roomModel);
  const prompts = roomModel.prompts.slice(0, 3);
  const [activePrompt, setActivePrompt] = useState(prompts[0] || 'Share something useful people can act on today...');
  const memberCount = members.length > 0 ? members.length : (community?.follower_count || 0);
  const latestPost = posts[0];
  const latestAge = formatRelativeActivity(latestPost?.created_at || latestPost?.created_date);
  const upcomingCount = events.filter((event) => {
    const value = event.start_date || event.event_date;
    return !value || new Date(value) >= new Date();
  }).length;
  const roomState = activeNeeds.length
    ? `${activeNeeds.length} open need${activeNeeds.length === 1 ? '' : 's'} need attention`
    : latestPost
      ? `Last update ${latestAge || 'recently'}`
      : roomModel.body;

  const actionColors = [
    'from-blue-50 to-cyan-50 text-blue-700 border-blue-100',
    'from-amber-50 to-orange-50 text-amber-800 border-amber-100',
    'from-emerald-50 to-teal-50 text-emerald-800 border-emerald-100',
  ];
  const promptStyles = [
    { label: 'Need now', className: 'border-red-100 bg-red-50 text-red-700' },
    { label: 'Ask fast', className: 'border-blue-100 bg-blue-50 text-blue-700' },
    { label: 'Make happen', className: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
  ];
  const starterActions = roomModel.actions.map((action, index) => ({
    ...action,
    className: actionColors[index % actionColors.length],
    helper: action.label === 'Make a plan' && upcomingCount
      ? `${upcomingCount} event${upcomingCount === 1 ? '' : 's'} listed`
      : action.helper,
  }));
  const progressItems = [
    {
      label: 'Right now',
      value: activeNeeds.length ? `${activeNeeds.length} needs` : latestAge || 'Open',
    },
    {
      label: 'Next win',
      value: posts.length ? `${posts.length} posts` : roomModel.emptyWin,
    },
    {
      label: 'People',
      value: `${memberCount || 0} here`,
    },
  ];

  useEffect(() => {
    setActivePrompt(prompts[0] || 'Share something useful people can act on today...');
  }, [community?.id, prompts[0]]);

  const applyPrompt = (prompt) => {
    if (!prompt) return;
    setActivePrompt(prompt);
  };

  const openAction = (action) => {
    applyPrompt(action.prompt);
    const targetTab = visibleTabs.includes(action.tab) ? action.tab : 'posts';
    onTabChange(targetTab);
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-sm">
      <div className={`relative bg-gradient-to-br ${typeConfig.accent} px-5 py-5 text-white`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(255,255,255,0.18),transparent_26%)]" />
        <div className="relative flex items-start gap-4">
          <MemberAvatarStack members={members} typeConfig={typeConfig} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-white/75">{roomModel.label}</p>
            <h2 className="mt-1 text-[23px] font-black leading-tight">{roomModel.headline}</h2>
            <p className="mt-2 text-[13px] font-semibold leading-5 text-white/82">{roomState}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2">
          {progressItems.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className="mt-1 truncate text-[12px] font-black text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {prompts.map((prompt, index) => {
            const style = promptStyles[index % promptStyles.length];
            return (
            <button
              key={prompt}
              type="button"
              onClick={() => applyPrompt(prompt)}
              className={`flex-shrink-0 rounded-2xl border px-3 py-2 text-left active:scale-95 transition-all ${style.className}`}
            >
              <span className="block text-[9px] font-black uppercase tracking-wide opacity-70">{style.label}</span>
              <span className="block max-w-[210px] truncate text-[12px] font-black">{prompt}</span>
            </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
          <textarea
            value={composeText}
            onChange={(event) => setComposeText(event.target.value)}
            rows={2}
            placeholder={activePrompt}
            className="w-full resize-none bg-transparent px-1 text-[15px] font-semibold leading-6 text-slate-900 outline-none placeholder:text-slate-400"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onTabChange('posts')}
              className="text-[12px] font-black text-slate-500 active:text-slate-800"
            >
              View posts
            </button>
            <button
              type="button"
              onClick={submitPost}
              disabled={posting || !composeText.trim()}
              className={`motion-press inline-flex h-10 items-center gap-2 rounded-2xl bg-gradient-to-r ${typeConfig.accent} px-4 text-[13px] font-black text-white shadow-sm disabled:opacity-45`}
            >
              <Send className="h-3.5 w-3.5" />
              {posting ? 'Posting...' : roomModel.primaryCta}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {starterActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => openAction(action)}
              className={`rounded-2xl border bg-gradient-to-br p-3 text-left active:scale-[0.98] transition-all ${action.className}`}
            >
              <p className="text-[12px] font-black leading-tight">{action.label}</p>
              <p className="mt-1 text-[10px] font-bold leading-snug opacity-75">{action.helper}</p>
            </button>
          ))}
        </div>
      </div>
      </section>

      <CommunityPresenceStrip
        community={community}
        members={members}
        engagementKit={engagementKit}
        roomModel={roomModel}
        typeConfig={typeConfig}
        onPrompt={applyPrompt}
      />

      <CommunityMomentumPanel
        kit={engagementKit}
        posts={posts}
        activeNeeds={activeNeeds}
        events={events}
        memberCount={memberCount}
        onPrompt={applyPrompt}
        onTabChange={onTabChange}
        visibleTabs={visibleTabs}
      />

      <CommunityStarterFeed
        kit={engagementKit}
        posts={posts}
        typeConfig={typeConfig}
        onPrompt={applyPrompt}
        onTabChange={onTabChange}
      />

      <CommunityRhythmStrip kit={engagementKit} onPrompt={applyPrompt} />
    </div>
  );
}

function CommunityHomeLaunchpad({
  community, typeConfig, posts, activeNeeds, events, resources, members,
  isAdmin, lastVisitedAt, currentUser, onTabChange, openAdminCenter, onManage,
  onOpenEvent, visibleTabs, composeText, setComposeText, submitPost, posting,
}) {
  const layoutSettings = (community?.settings && typeof community.settings === 'object')
    ? (community.settings.layout || {}) : {};
  const hiddenSections = new Set(layoutSettings.hiddenSections || []);

  const cardTabs = visibleTabs.filter((t) => t !== 'home');
  const memberCount = members.length > 0 ? members.length : (community?.follower_count || 0);
  const toolTabs = cardTabs.filter((tab) => !['posts'].includes(tab));

  return (
    <div className="space-y-4">
      <CommunitySocialStarter
        community={community}
        typeConfig={typeConfig}
        posts={posts}
        activeNeeds={activeNeeds}
        events={events}
        members={members}
        composeText={composeText}
        setComposeText={setComposeText}
        submitPost={submitPost}
        posting={posting}
        onTabChange={onTabChange}
        visibleTabs={visibleTabs}
      />

      {toolTabs.length > 0 && (
        <section className="rounded-[26px] border border-slate-100 bg-white/80 p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Community tools</p>
            <span className="text-[11px] font-black text-slate-400">Secondary</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {toolTabs.map((tab) => {
              const Icon = TAB_ICON_MAP[tab] || Hash;
              const data = getCardData(tab, { posts, events, activeNeeds, resources, memberCount });
              const hasData = data.stat || data.preview;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onTabChange(tab)}
                  className="flex min-w-[150px] flex-shrink-0 items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left active:scale-[0.98] transition-all"
                >
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-black text-slate-900">{getCommunityTabLabel(tab)}</span>
                    <span className={`block truncate text-[10px] font-bold ${hasData ? 'text-blue-600' : 'text-slate-400'}`}>
                      {hasData ? (data.stat || data.preview) : getCommunityActionCopy(tab, typeConfig).action}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Admin tools */}
      {isAdmin && !hiddenSections.has('adminTools') && (
        <CommunityAdminQuickActions
          onAnnouncement={() => onTabChange('announcements')}
          onEvent={() => onTabChange('events')}
          onResource={() => onTabChange('resources')}
          onAdminCenter={() => openAdminCenter?.('overview') ?? onManage?.()}
        />
      )}

      {/* Personalization hub — user's RSVPs and chesed items */}
      {!hiddenSections.has('personalization') && (
        <CommunityPersonalizationHub
          communityId={community.id}
          currentUser={currentUser}
          events={events}
          typeConfig={typeConfig}
          onTabChange={onTabChange}
          onOpenEvent={onOpenEvent}
        />
      )}
    </div>
  );
}

function RoutedCommunityHome({
  community,
  typeConfig,
  posts,
  activeNeeds,
  composeText,
  setComposeText,
  submitPost,
  posting,
  onTabChange,
  canPost,
  members,
  events,
  resources,
  isAdmin,
  isCreator,
  isFollowing,
  lastVisitedAt,
  currentUser,
  onFollow,
  onManage,
  openAdminCenter,
  onOpenEvent,
  visibleTabs,
}) {
  const [panelDismissed, setPanelDismissed] = React.useState(
    () => Boolean(localStorage.getItem(POST_LAUNCH_DISMISS_KEY(community?.id)))
  );

  const handleDismissPanel = () => {
    try { localStorage.setItem(POST_LAUNCH_DISMISS_KEY(community.id), '1'); } catch {}
    setPanelDismissed(true);
  };

  const communityCreatedAt = community?.created_at || community?.created_date;
  const ageMs = communityCreatedAt ? Date.now() - new Date(communityCreatedAt).getTime() : 0;
  const isRecent = !communityCreatedAt || ageMs < 14 * 24 * 60 * 60 * 1000;
  const showPanel = isFollowing && isCreator && !panelDismissed && isRecent;
  if (!isFollowing) {
    return (
      <VisitorLanding
        community={community}
        typeConfig={typeConfig}
        posts={posts}
        events={events}
        resources={resources}
        members={members}
        onFollow={onFollow}
        onTabChange={onTabChange}
      />
    );
  }

  return (
    <div className="space-y-3 pt-3">
      {showPanel && (
        <CommunityPostLaunchPanel
          community={community}
          typeConfig={typeConfig}
          posts={posts}
          events={events}
          resources={resources}
          activeNeeds={activeNeeds}
          members={members}
          currentUser={currentUser}
          onTabChange={onTabChange}
          onDismiss={handleDismissPanel}
        />
      )}
      <CommunityHomeLaunchpad
        community={community}
        typeConfig={typeConfig}
        posts={posts}
        activeNeeds={activeNeeds}
        events={events}
        resources={resources}
        members={members}
        isAdmin={isAdmin}
        lastVisitedAt={lastVisitedAt}
        currentUser={currentUser}
        onTabChange={onTabChange}
        openAdminCenter={openAdminCenter}
        onManage={onManage}
        onOpenEvent={onOpenEvent}
        visibleTabs={visibleTabs}
        composeText={composeText}
        setComposeText={setComposeText}
        submitPost={submitPost}
        posting={posting}
      />
    </div>
  );
}

const TAB_EMPTY_COPY = {
  events: {
    neighborhood: { title: 'No local events yet', body: 'Add a neighborhood meetup, school event, or community gathering.' },
    shul: { title: 'No upcoming events', body: 'Add a Shabbos event, holiday program, or community gathering.' },
    chesed: { title: 'No volunteer events yet', body: 'Add a volunteer day, chesed gathering, or community help event.' },
    learning: { title: 'No learning events yet', body: 'Schedule a shiur, chavrusa session, or learning event.' },
    parents: { title: 'No family events yet', body: 'Share a school event, camp activity, or family gathering.' },
    events: { title: 'No events posted yet', body: 'Create the first event — gatherings, programs, and socials start here.' },
  },
  resources: {
    neighborhood: { title: 'No local resources yet', body: 'Share guides, community contacts, neighborhood alerts, or helpful local links.' },
    shul: { title: 'No resources shared yet', body: 'Share schedules, forms, weekly guides, or member resources here.' },
    learning: { title: 'No learning resources yet', body: 'Share shiur recordings, source sheets, or useful learning links.' },
    chesed: { title: 'No resources yet', body: 'Add contact lists, volunteer guides, or chesed organization links.' },
    parents: { title: 'No resources yet', body: 'Share school guides, camp info, local recommendations, or family forms.' },
  },
  openNeeds: {
    chesed: { title: 'No open needs right now', body: 'Post a request or invite someone to offer help. Needs coordinated here.' },
  },
  discussions: {
    learning: { title: 'No discussions yet', body: 'Start a Torah question, share a thought, or begin a chavrusa-style thread.' },
  },
  questions: {
    parents: { title: 'No questions yet', body: 'Ask for a school recommendation, babysitter tip, or local parenting help.' },
  },
};

function getTabEmptyState(typeKey, tabKey) {
  const tabMap = TAB_EMPTY_COPY[tabKey] || {};
  return tabMap[typeKey] || null;
}

function CompactEmptyState({ typeConfig, tabKey }) {
  const Icon = typeConfig?.icon;
  const custom = getTabEmptyState(typeConfig?.key, tabKey);
  const title = custom?.title || typeConfig?.emptyTitle || 'Nothing here yet';
  const body = custom?.body || typeConfig?.emptyBody || 'Be the first to post.';
  return (
    <div className="app-empty-state">
      {Icon && (
        <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="app-empty-state-title">{title}</p>
      <p className="app-empty-state-body mt-1">{body}</p>
    </div>
  );
}

function HomeFeedSection({ posts, typeConfig, activeNeeds = [], onTabChange }) {
  if (!posts.length && !activeNeeds.length) {
    return <CompactEmptyState typeConfig={typeConfig} tabKey="home" />;
  }

  return (
    <div className="space-y-2.5">
      <p className="app-section-label px-0.5">Latest</p>
      {posts.map((post) => (
        <CommunityPostPreview key={post.id} post={post} typeConfig={typeConfig} />
      ))}
      {activeNeeds.map((need) => (
        <article key={need.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{need.status || 'open'}</span>
          <h3 className="mt-2 text-[14px] font-black text-slate-950">{need.title}</h3>
          {need.description && <p className="mt-1 text-sm leading-5 text-slate-600 line-clamp-2">{need.description}</p>}
        </article>
      ))}
    </div>
  );
}

function RoutedPostsTab({ posts, isLoading, activeTab, typeConfig, composeText, setComposeText, submitPost, posting, canPost }) {
  const filteredPosts = posts.filter((post) => matchesTab(post, activeTab));
  return (
    <div className="space-y-4 pt-4">
      {canPost ? (
        <ComposerBox
          typeConfig={typeConfig}
          composeText={composeText}
          setComposeText={setComposeText}
          submitPost={submitPost}
          posting={posting}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 flex items-center gap-3">
          <Lock className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <p className="text-[13px] font-semibold text-slate-500">Posting is restricted to community admins.</p>
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      ) : (
        <RoutedPostsList posts={filteredPosts} typeConfig={typeConfig} tabKey={activeTab} />
      )}
    </div>
  );
}

function RoutedPostsList({ posts, typeConfig, emptyCompact = false, tabKey }) {
  if (!posts.length) {
    if (emptyCompact) return null;
    return <CompactEmptyState typeConfig={typeConfig} tabKey={tabKey} />;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <CommunityPostPreview key={post.id} post={post} typeConfig={typeConfig} />
      ))}
    </div>
  );
}

function RoutedOpenNeedsTab({ activeNeeds, typeConfig }) {
  if (!activeNeeds.length) {
    return (
      <div className="pt-4">
        <CompactEmptyState typeConfig={typeConfig} tabKey="openNeeds" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      {activeNeeds.map((need) => (
        <article key={need.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{need.status || 'open'}</span>
          <h3 className="mt-3 text-[15px] font-black text-slate-950">{need.title}</h3>
          {need.description && <p className="mt-1 text-sm leading-6 text-slate-600">{need.description}</p>}
          {(need.location_label || need.neighborhood) && (
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {need.location_label || need.neighborhood}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function AboutTab({ community, typeConfig, onClaim }) {
  const type = community.type || community.verified_type || typeConfig.label;
  const claim = CLAIM_COPY[type] || { question: 'Is this your community?', cta: 'Claim this page' };

  return (
    <div className="space-y-3 pt-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> About this {typeConfig.label.toLowerCase()}
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">{community.description_long || community.description_short || community.description || typeConfig.cardFallback}</p>
      </div>

      {(community.address || community.phone || community.website) && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
          {community.address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(community.address)}`} target="_blank" rel="noreferrer"
              className="flex items-start gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{community.address}</span>
            </a>
          )}
          {community.phone && (
            <a href={`tel:${community.phone}`} className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{community.phone}</span>
            </a>
          )}
          {community.website && (
            <a href={community.website?.startsWith('http') ? community.website : `https://${community.website}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="break-all">{community.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
            </a>
          )}
        </div>
      )}

      {community.rules && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Community Guidelines
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{community.rules}</p>
        </div>
      )}

      {community.donation_url && (
        <a
          href={community.donation_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-[14px] active:scale-95 transition-all"
        >
          <Heart className="w-4 h-4 fill-white" />
          Donate to {community.name}
        </a>
      )}

      {community.verified_plan && community.verified_plan !== 'none' && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-[13px] text-blue-700 font-medium">
          <Shield className="w-4 h-4 flex-shrink-0" />
          Verified {community.type || 'Community'} on JUnited
        </div>
      )}

      {!community.is_claimed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm font-semibold text-amber-800 mb-1">{claim.question}</p>
          <p className="text-xs text-amber-700 mb-2">Manage announcements, posts, and your community hub.</p>
          <button onClick={onClaim} className="text-xs font-bold text-[#0F5ED7] underline">
            {claim.cta} →
          </button>
        </div>
      )}
    </div>
  );
}
