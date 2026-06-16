const URGENCY_RANK = { now: 5, urgent: 4, soon: 3, today: 2, active: 1, completed: 0 };

const toTime = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : Date.now();
};

const minutesUntil = (value) => Math.round((toTime(value) - Date.now()) / 60000);

const minutesAgo = (value) => Math.max(1, Math.round((Date.now() - toTime(value)) / 60000));

export const formatLiveAge = (value) => {
  const minutes = minutesAgo(value);
  if (minutes < 2) return 'Just posted';
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Updated ${hours} hr${hours === 1 ? '' : 's'} ago`;
  return `Updated ${Math.round(hours / 24)} days ago`;
};

export const formatSoon = (value) => {
  const minutes = minutesUntil(value);
  if (minutes <= 0) return 'Happening now';
  if (minutes < 60) return `Happening in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `Happening in ${hours} hr${hours === 1 ? '' : 's'}`;
};

const initials = (name = '') =>
  String(name || 'J')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'J';

const sortLiveItems = (items) =>
  items
    .filter(Boolean)
    .sort((a, b) => (URGENCY_RANK[b.urgency] || 0) - (URGENCY_RANK[a.urgency] || 0))
    .slice(0, 8);

export function buildMitzvahLiveNowItems({ requests = [], offers = [] } = {}) {
  const liveRequests = requests.map((request) => {
    const helperOffers = offers.filter((offer) => offer.requestId === request.id || offer.request_id === request.id);
    const helperCount = Math.max(helperOffers.length, Number(request.offers_count || request.helper_count || 0));
    const target = Math.max(1, Number(request.goal_count || request.target_count || request.meals_needed || request.seats_needed || 3));
    const remaining = Math.max(0, target - helperCount);
    const categoryText = `${request.category || ''} ${request.title || ''}`.toLowerCase();
    const actionLabel = /meal|food|dinner|lunch|shabbos/.test(categoryText)
      ? 'Bring food'
      : /ride|carpool|seat|drive/.test(categoryText)
        ? "I'll drive"
        : 'Take this';
    const urgency = String(request.urgency || '').toLowerCase().includes('urgent')
      ? 'urgent'
      : String(request.urgency || '').toLowerCase().includes('today')
        ? 'today'
        : 'active';
    return {
      id: `mitzvah-${request.id}`,
      type: 'mitzvah',
      urgency,
      eyebrow: urgency === 'urgent' ? 'Needs help now' : 'Mitzvah Circle',
      title: request.title || 'Community help request',
      meta: remaining === 0 ? 'Goal covered' : `Still need ${remaining} of ${target}`,
      liveText: helperCount > 0 ? `${helperCount} people responding now` : formatLiveAge(request.updated_at || request.updated_date || request.created_at || request.created_date),
      actionLabel,
      href: `/MitzvahCircle?requestId=${encodeURIComponent(request.id)}`,
      progress: Math.min(100, Math.round((helperCount / target) * 100)),
      avatars: helperOffers.slice(0, 4).map((offer) => initials(offer.volunteerName || offer.volunteer_name || offer.user_name)),
    };
  });

  return sortLiveItems(liveRequests);
}

export function buildFeedLiveNowItems({ posts = [], networkLabel = 'Five Towns' } = {}) {
  const items = posts.map((post) => {
    const created = post.created_date || post.created_at || post.updated_date || post.updated_at;
    const engagement = Number(post.comments_count || 0) + Number(post.likes_count || 0);
    const isEvent = post.type === 'event' || post.event_date;
    const isHelp = post.type === 'help' || post.board === 'help' || /need|ride|meal|help|urgent/i.test(`${post.title || ''} ${post.body || ''}`);
    if (isEvent) {
      return {
        id: `feed-event-${post.id}`,
        type: 'event',
        urgency: minutesUntil(post.event_date || created) < 90 ? 'soon' : 'today',
        eyebrow: 'Happening tonight',
        title: post.title || 'Community event',
        meta: post.location_text || networkLabel,
        liveText: formatSoon(post.event_date || created),
        actionLabel: 'View',
        href: '/Feed',
        avatars: [initials(post.author_name)],
      };
    }
    if (isHelp) {
      return {
        id: `feed-help-${post.id}`,
        type: 'mitzvah',
        urgency: 'urgent',
        eyebrow: 'Needs help now',
        title: post.title || 'Help requested',
        meta: post.location_text || networkLabel,
        liveText: `${post.comments_count || 0} replies`,
        actionLabel: 'Respond',
        href: '/MitzvahCircle',
        avatars: [initials(post.author_name)],
      };
    }
    if (engagement >= 14) {
      return {
        id: `feed-hot-${post.id}`,
        type: 'discussion',
        urgency: 'active',
        eyebrow: 'Trending locally',
        title: post.title || 'Active discussion',
        meta: post.community_name || networkLabel,
        liveText: `${engagement} interactions`,
        actionLabel: 'Join',
        href: '/Feed',
        avatars: [initials(post.author_name)],
      };
    }
    return null;
  });

  return sortLiveItems(items).slice(0, 8);
}

export function buildCommunityLiveNowItems({ communities = [] } = {}) {
  const communityItems = communities.map((community) => {
    const activeNow = Number(community.activeNow || community.active_now || 0);
    const postsToday = Number(community.postsToday || community.posts_today || community.post_count || 0);
    if (activeNow <= 0 && postsToday <= 0) return null;
    const name = community.name || 'Community';
    const title = /sports/i.test(name)
      ? "Who's playing tonight?"
      : /shabbos|host/i.test(name)
        ? 'Find a meal this week'
        : /chesed|mitzvah/i.test(name)
          ? 'Help needed near you'
          : community.dailyPrompt || community.valueHook || `Active now in ${name}`;
    return {
      id: `community-${community.id}`,
      type: 'community',
      urgency: activeNow >= 10 || postsToday >= 10 ? 'active' : 'today',
      eyebrow: activeNow > 0 ? `${activeNow} active now` : 'Community action',
      title,
      meta: name,
      liveText: postsToday > 0 ? `${postsToday} posts today` : 'Start the next move',
      actionLabel: community.joined ? 'Open' : 'Join',
      href: `/communities/${encodeURIComponent(community.id)}`,
      avatars: [],
    };
  });

  return sortLiveItems(communityItems);
}

export function getCommunityActionCopy(community = {}) {
  const text = `${community.name || ''} ${community.category || ''} ${community.description || ''} ${community.type || ''}`.toLowerCase();

  if (/sport|basketball|football|fitness|gym|game/.test(text)) {
    return {
      room: 'Game room',
      question: "Who's playing tonight?",
      promise: 'Find a game, fill a team, or get a training partner.',
      nextWin: 'First game posted',
      primary: 'Find a game',
      prompts: ['Who wants to play tonight?', 'Need two more for a game?', 'Looking for a training partner?'],
    };
  }

  if (/food|kosher|restaurant|bakery|shabbos|meal/.test(text)) {
    return {
      room: 'Food room',
      question: 'What is open or needed before Shabbos?',
      promise: 'Share specials, extras, recommendations, and pickup needs.',
      nextWin: 'First useful recommendation',
      primary: 'Ask for food help',
      prompts: ['What is open right now?', 'Extra Shabbos food to give away?', 'Best quick dinner near me?'],
    };
  }

  if (/shul|minyan|torah|learning|chavrusa|gemara/.test(text)) {
    return {
      room: 'Jewish life room',
      question: 'Who needs a minyan, ride, or chavrusa today?',
      promise: 'Coordinate minyanim, shiurim, learning, and shul updates.',
      nextWin: 'First minyan update',
      primary: 'Coordinate',
      prompts: ['Need one more for minyan?', 'Who wants a chavrusa tonight?', 'Ride to shul available?'],
    };
  }

  if (/chesed|mitzvah|help|volunteer/.test(text)) {
    return {
      room: 'Chesed room',
      question: 'Who needs help right now?',
      promise: 'Turn open needs into completed mitzvos.',
      nextWin: 'First need covered',
      primary: 'Help someone',
      prompts: ['Who needs a pickup today?', 'I can deliver something after work', 'Still need one more volunteer?'],
    };
  }

  if (/parent|school|family|camp|carpool|babysitter/.test(text)) {
    return {
      room: 'Family room',
      question: 'What do parents need to coordinate today?',
      promise: 'Carpools, babysitters, school tips, and family help.',
      nextWin: 'First parent answer',
      primary: 'Ask parents',
      prompts: ['Need a carpool seat?', 'Who has a babysitter lead?', 'School pickup swap?'],
    };
  }

  if (/business|job|career|network|hustle/.test(text)) {
    return {
      room: 'Business room',
      question: 'Who can help someone make the next connection?',
      promise: 'Jobs, referrals, advice, local services, and trusted intros.',
      nextWin: 'First useful intro',
      primary: 'Ask the network',
      prompts: ['Who is hiring locally?', 'Need a trusted service recommendation?', 'Can someone make an intro?'],
    };
  }

  return {
    room: 'Local room',
    question: 'What is happening nearby?',
    promise: 'Local alerts, recommendations, plans, openings, and neighbor help in one fast place.',
    nextWin: 'First useful post',
    primary: 'Ask the room',
    prompts: ['What should neighbors know today?', 'Ask for a local recommendation', 'Share something happening nearby'],
  };
}

export function buildCommunityActionItems(communities = []) {
  return communities.slice(0, 8).map((community) => {
    const copy = getCommunityActionCopy(community);
    return {
      id: community.id || community.name,
      type: 'community',
      urgency: 'active',
      eyebrow: copy.room,
      title: copy.question,
      meta: community.name || community.category || 'Community',
      liveText: community.member_count ? `${community.member_count} people here` : '',
      actionLabel: 'Open',
      href: community.id ? `/communities/${encodeURIComponent(community.id)}` : '/Communities',
      avatars: [],
      context: copy.promise,
      people: community.member_count ? `${community.member_count} people here` : '',
      tone: 'active',
    };
  });
}

export function buildMarketplaceLiveNowItems({ listings = [] } = {}) {
  const listingItems = listings.map((listing) => {
    const urgency = /asap|urgent|today|shabbos/i.test(`${listing.urgency || ''} ${listing.urgencyLabel || ''} ${listing.reason || ''}`)
      ? 'urgent'
      : 'active';
    return {
      id: `market-${listing.id}`,
      type: 'marketplace',
      urgency,
      eyebrow: urgency === 'urgent' ? 'Need gone soon' : 'Marketplace',
      title: listing.title || 'Community listing',
      meta: listing.price || listing.category || 'Listing',
      liveText: `${listing.interested || 0} interested · ${listing.neighborhood || 'Five Towns'}`,
      actionLabel: listing.price === 'Free' ? 'Pick up' : 'Message',
      href: `/Marketplace?listing=${encodeURIComponent(listing.id)}`,
      avatars: [initials(listing.seller || listing.seller_name)],
    };
  });

  return sortLiveItems(listingItems);
}

export function buildMapLiveNowItems() {
  return [];
}
