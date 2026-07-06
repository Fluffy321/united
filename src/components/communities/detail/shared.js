import {
  BookOpen, CalendarDays, Globe, Hash, HeartHandshake, HelpCircle, Home, Info,
  Megaphone, MessageCircle, ShoppingBag, Users,
} from 'lucide-react';
import { getCommunityTabLabel } from '@/lib/communityTypes';

export const TAB_ICON_MAP = {
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

export const LAUNCHPAD_TAB_DESC = {
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

export function matchesTab(post, tab) {
  const type = String(post.type || post.post_type || post.category || '').toLowerCase();
  const content = `${post.title || ''} ${post.body || ''} ${post.content || ''}`.toLowerCase();
  if (tab === 'announcements') return type === 'announcement';
  if (tab === 'questions') return type === 'question' || type === 'ask' || content.includes('?');
  if (tab === 'discussions') return type === 'discussion' || type === 'learning';
  return true;
}

export function getFeaturedTab(typeConfig, cardTabs) {
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

export function getCardData(tab, { posts, events, activeNeeds, resources, memberCount }) {
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

export function getCommunityActionCopy(tab, typeConfig) {
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

export function getCommunityRoomModel(community, typeConfig) {
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

export function getCommunityEngagementKit(community, typeConfig, roomModel) {
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

export function formatRelativeActivity(value) {
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

export function isAnn(post) {
  return String(post.type || post.post_type || post.category || '').toLowerCase() === 'announcement';
}
