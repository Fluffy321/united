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
  return sortLiveItems(requests.map((request) => {
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
  }));
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

  return sortLiveItems(items);
}

export function buildCommunityLiveNowItems({ communities = [] } = {}) {
  return sortLiveItems(communities.map((community) => {
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
  }));
}

export function buildMarketplaceLiveNowItems({ listings = [] } = {}) {
  return sortLiveItems(listings.map((listing) => {
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
  }));
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
  ];
}
