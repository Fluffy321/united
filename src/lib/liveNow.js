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

  const fallbackItems = [
    {
      id: 'mitzvah-live-meals',
      type: 'mitzvah',
      urgency: 'urgent',
      eyebrow: 'Needs help now',
      title: 'Post or claim a dinner, ride, or errand that needs action today',
      meta: 'Five Towns chesed',
      liveText: 'Turn a need into a completed mitzvah',
      actionLabel: "I'll help",
      href: '/MitzvahCircle?tab=browse',
      progress: 35,
      avatars: ['A', 'M'],
    },
    {
      id: 'mitzvah-live-tonight',
      type: 'mitzvah',
      urgency: 'today',
      eyebrow: 'Tonight',
      title: 'Before tonight: meals, rides, visits, and quick favors',
      meta: 'Lawrence, Cedarhurst, Woodmere, Hewlett, Inwood',
      liveText: 'Coordinate fast',
      actionLabel: 'Post need',
      href: '/MitzvahCircle?create=1',
      progress: 15,
      avatars: ['FT'],
    },
    {
      id: 'mitzvah-live-complete',
      type: 'mitzvah',
      urgency: 'active',
      eyebrow: 'Community progress',
      title: 'Complete one small mitzvah and show others the momentum',
      meta: 'Helpers make the app feel alive',
      liveText: 'Start the chain',
      actionLabel: 'Browse',
      href: '/MitzvahCircle',
      progress: 10,
      avatars: ['J'],
    },
  ];

  return sortLiveItems([...liveRequests, ...fallbackItems]);
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

  const liveItems = sortLiveItems(items);
  const fallbackItems = [
    {
      id: 'feed-live-mitzvah',
      type: 'mitzvah',
      urgency: 'urgent',
      eyebrow: 'Needs help now',
      title: `See urgent mitzvah needs near ${networkLabel}`,
      meta: networkLabel,
      liveText: 'Help someone today',
      actionLabel: 'Open mitzvahs',
      href: '/MitzvahCircle',
      avatars: ['M'],
    },
    {
      id: 'feed-live-tonight',
      type: 'event',
      urgency: 'today',
      eyebrow: 'Tonight',
      title: `What is happening tonight in ${networkLabel}?`,
      meta: 'Events, rides, shiurim, plans',
      liveText: 'Check local activity',
      actionLabel: 'Post update',
      href: '/Feed',
      avatars: ['FT'],
    },
    {
      id: 'feed-live-community',
      type: 'community',
      urgency: 'active',
      eyebrow: 'People active',
      title: 'Join a community where people are coordinating now',
      meta: 'Sports, Torah, Shabbos, chesed',
      liveText: 'Find your people',
      actionLabel: 'Discover',
      href: '/Communities',
      avatars: ['C'],
    },
  ];

  return sortLiveItems([...liveItems, ...fallbackItems]).slice(0, 8);
}

export function buildCommunityLiveNowItems({ communities = [] } = {}) {
  const communityItems = communities.map((community) => {
    const activeNow = Number(community.activeNow || community.active_now || 0);
    const postsToday = Number(community.postsToday || community.posts_today || community.post_count || 0);
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
      href: `/Communities?community=${encodeURIComponent(community.id)}&tab=home`,
      avatars: Array.from({ length: Math.min(Math.max(activeNow, 1), 4) }, (_, index) => initials(`${name} ${index}`)),
    };
  });

  const fallbackItems = [
    {
      id: 'community-live-tonight',
      type: 'community',
      urgency: 'today',
      eyebrow: 'Tonight',
      title: 'Find the room where people are making plans, asking fast questions, or coordinating help',
      meta: 'Five Towns communities',
      liveText: 'Start with one useful post',
      actionLabel: 'Discover',
      href: '/Discover',
      avatars: ['FT'],
    },
    {
      id: 'community-live-support',
      type: 'community',
      urgency: 'active',
      eyebrow: 'Support spaces',
      title: 'Join a focused room for school, family, wellness, Torah, sports, or Shabbos needs',
      meta: 'Identity and action rooms',
      liveText: 'Pick your people',
      actionLabel: 'Browse',
      href: '/Communities',
      avatars: ['C'],
    },
  ];

  return sortLiveItems([...communityItems, ...fallbackItems]);
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

  const fallbackItems = [
    {
      id: 'market-live-free',
      type: 'marketplace',
      urgency: 'today',
      eyebrow: 'Before Shabbos',
      title: 'Post free extras, furniture, baby gear, or items that need pickup soon',
      meta: 'Trusted local marketplace',
      liveText: 'Connect useful items to neighbors',
      actionLabel: 'Post listing',
      href: '/Marketplace?post=1',
      avatars: ['M'],
    },
    {
      id: 'market-live-looking',
      type: 'marketplace',
      urgency: 'active',
      eyebrow: 'Looking for',
      title: 'Ask the community before buying new',
      meta: 'Books, cribs, sublets, Judaica, services',
      liveText: 'Someone nearby may have it',
      actionLabel: 'Ask',
      href: '/Marketplace?mode=looking',
      avatars: ['FT'],
    },
  ];

  return sortLiveItems([...listingItems, ...fallbackItems]);
}

export function buildMapLiveNowItems() {
  return [
    {
      id: 'map-minyan',
      type: 'minyan',
      urgency: 'soon',
      eyebrow: 'Map live',
      title: 'Minyan needs and shul activity show as live pins',
      meta: 'Shuls / yeshivas / mitzvahs',
      liveText: 'Tap filters to act nearby',
      actionLabel: 'Open pins',
      href: '/Map?category=shuls',
      avatars: ['FT'],
    },
    {
      id: 'map-mitzvah',
      type: 'mitzvah',
      urgency: 'urgent',
      eyebrow: 'Needs near you',
      title: 'Urgent mitzvah requests should stand out on the map',
      meta: 'Five Towns',
      liveText: 'Red pins need attention',
      actionLabel: 'View',
      href: '/MitzvahCircle',
      avatars: ['M'],
    },
    {
      id: 'map-events',
      type: 'event',
      urgency: 'today',
      eyebrow: 'Tonight',
      title: 'Events, shiurim, and local plans should be visible by town',
      meta: 'Lawrence, Cedarhurst, Woodmere, Hewlett, Inwood',
      liveText: 'Filter by what you need',
      actionLabel: 'Open map',
      href: '/Map',
      avatars: ['E'],
    },
  ];
}
