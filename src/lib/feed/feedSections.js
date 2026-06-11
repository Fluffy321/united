import { Activity, CalendarDays, MessageCircle } from 'lucide-react';
import { getPostLivePriority, matchesText, postDate } from './feedRanking.js';

const uniquePosts = (posts, predicate, limit, used = new Set()) => {
  const picked = [];
  for (const post of posts) {
    if (!post?.id || used.has(post.id) || !predicate(post)) continue;
    picked.push(post);
    used.add(post.id);
    if (picked.length >= limit) break;
  }
  return picked;
};

export const buildFeedSections = (posts) => {
  const ranked = [...posts].sort((a, b) => {
    const priority = getPostLivePriority(b) - getPostLivePriority(a);
    if (priority !== 0) return priority;
    const timeA = new Date(postDate(a) || 0).getTime() || 0;
    const timeB = new Date(postDate(b) || 0).getTime() || 0;
    return timeB - timeA;
  });
  const used = new Set();
  const happeningNow = uniquePosts(ranked, (post) => (
    post.type === 'help'
    || getPostLivePriority(post) > 0
    || matchesText(post, /urgent|now|tonight|today|minyan|maariv|mincha|shacharis|ride|carpool|pickup|meal|volunteer|need/)
    || Number(post.comments_count || 0) >= 12
  ), 7, used);
  const today = uniquePosts(ranked, (post) => (
    post.type === 'news'
    || post.type === 'feed'
    || matchesText(post, /recommend|question|discussion|business|restaurant|shop|menu|opening|update|lost|found|looking|best/)
  ), 7, used);
  const upcoming = uniquePosts(ranked, (post) => (
    post.type === 'event'
    || post.event_date
    || matchesText(post, /event|shiur|class|game|meetup|shabbos|tomorrow|this week|rsvp|opportunity|community/)
  ), 6, used);

  const fillSection = (items, limit) => (
    items.length ? items : uniquePosts(ranked, () => true, limit, used)
  );

  return [
    {
      key: 'happening-now',
      title: 'Happening Now',
      subtitle: 'Minyan needs, rides, volunteer requests, events starting soon, and active threads.',
      icon: Activity,
      pills: ['Minyan needed', 'Ride available', 'Volunteer request', 'Event soon'],
      items: fillSection(happeningNow, 4),
    },
    {
      key: 'today',
      title: 'Today',
      subtitle: 'New businesses, neighbor questions, recommendations, announcements, and useful local talk.',
      icon: MessageCircle,
      pills: ['New businesses', 'Discussions', 'Recommendations', 'Local updates'],
      items: fillSection(today, 5),
    },
    {
      key: 'upcoming',
      title: 'Upcoming',
      subtitle: 'Events, community opportunities, Shabbos plans, carpools, and things to join next.',
      icon: CalendarDays,
      pills: ['Events', 'Community opportunities', 'Shabbos plans', 'RSVP'],
      items: fillSection(upcoming, 4),
    },
  ];
};
