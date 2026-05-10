import React, { useMemo, useState } from 'react';
import { Bell, CalendarDays, CheckCircle2, Compass, HeartHandshake, MessageCircle, Plus, Radio, Search, ShieldCheck, Sparkles, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CommunityHubCard from '@/components/communities/CommunityHubCard';
import CommunityHubDetail from '@/components/communities/CommunityHubDetail';
import CreateCommunityForm from '@/components/communities/CreateCommunityForm';

const categories = ['All', 'Shuls', 'Chesed', 'Learning', 'Events', 'Singles', 'Parents', 'Neighborhoods', 'Hobbies', 'Lifestyle', 'Values', 'Buy/Sell'];

const categoryHighlights = {
  Shuls: 'border-violet-200 bg-violet-50 text-violet-800',
  Chesed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Learning: 'border-amber-200 bg-amber-50 text-amber-800',
  Events: 'border-rose-200 bg-rose-50 text-rose-800',
  Singles: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800',
  Parents: 'border-orange-200 bg-orange-50 text-orange-800',
  Neighborhoods: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  Hobbies: 'border-lime-200 bg-lime-50 text-lime-800',
  Lifestyle: 'border-teal-200 bg-teal-50 text-teal-800',
  Values: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  'Buy/Sell': 'border-stone-200 bg-stone-50 text-stone-800',
};

const launchTemplates = [
  { title: 'Hobby circles', category: 'Hobbies', body: 'Basketball, running, cooking, music, photography, chess, book clubs, and creative groups.' },
  { title: 'Lifestyle groups', category: 'Lifestyle', body: 'Newly married, young parents, empty nesters, singles, commuters, remote workers, and newcomers.' },
  { title: 'Religious values', category: 'Values', body: 'Halacha-minded homes, Sephardi minhagim, baalei teshuva support, tznius, learning, and Shabbos growth.' },
  { title: 'Shul circles', category: 'Shuls', body: 'Daily minyan people, shiur groups, Shabbos plans, kiddush volunteers, newcomer welcomes, and local updates.' },
];

const networkLoops = [
  'Daily prompts that start real conversations',
  'Interest matching for people nearby',
  'Shul-connected groups without making shuls the whole app',
  'Join buttons that turn lurkers into members',
  'Pinned posts for what matters this week',
  'Moderator tools for warm, focused spaces',
];

const conversationStarters = [
  { title: 'What are you looking for this week?', body: 'A chavrusa, meal invite, basketball run, babysitter lead, ride, or good local recommendation.' },
  { title: 'People near you', body: 'Surface members with shared interests, similar life stage, and overlapping shul or neighborhood circles.' },
  { title: 'Small groups that stick', body: 'A cooking circle, Daf review pod, new families table, walking group, singles event crew, or marketplace lane.' },
];

const communityRetentionCards = [
  {
    icon: Radio,
    title: 'Pinned weekly pulse',
    body: 'Every community gets one visible “what matters this week” post so members do not land in an empty room.',
    stat: '1 anchor post',
  },
  {
    icon: Bell,
    title: 'Followed thread alerts',
    body: 'Threads with replies become reasons to return, especially questions, rides, Shabbos plans, and recommendations.',
    stat: 'Reply loops',
  },
  {
    icon: CalendarDays,
    title: 'Events plus reminders',
    body: 'Groups can act like mini websites with upcoming events, saved plans, RSVP intent, and gentle reminders.',
    stat: 'Calendar layer',
  },
  {
    icon: ShieldCheck,
    title: 'Verified leadership',
    body: 'Admin and moderator labels build trust before schools and shuls eventually replace email chains here.',
    stat: 'Trust signals',
  },
];

const hubPlaybook = [
  'Claimed shul pages for minyanim, shiurim, kiddush, alerts, and member posts',
  'Joined communities power each person’s feed, map, events, and notifications',
  'Moderated Jewish social networks by shul, interest, lifestyle, neighborhood, and values',
  'Local recommendations replace scattered WhatsApp threads and stale directories',
];

const initialCommunities = [
  {
    id: 'five-towns-shul-network',
    name: 'Five Towns Shul Network',
    category: 'Shuls',
    privacy: 'Public',
    location: 'Five Towns',
    featured: true,
    joined: true,
    memberCount: 1248,
    recentActivity: 'Daily minyan update posted 18 minutes ago',
    description: 'A shared board for minyanim, shiurim, shul announcements, kiddush details, and neighborhood needs.',
    rules: ['Use respectful language.', 'Post shul times with dates.', 'No fundraising posts without admin approval.'],
    roles: [
      { name: 'Rabbi Stein', role: 'Admin' },
      { name: 'Miriam Cohen', role: 'Moderator' },
      { name: 'Avi Rosen', role: 'Member' },
    ],
    posts: [
      { id: 'p1', type: 'Announcement', author: 'Rabbi Stein', title: 'Motzei Shabbos learning schedule', body: 'New winter schedule is posted for Avos Ubanim and the late Maariv minyan.', time: '18m ago', likes: 42, comments: 8, pinned: true, liked: false },
      { id: 'p2', type: 'Question', author: 'Miriam Cohen', title: 'Need a weekday Daf Yomi slot?', body: 'A few people asked for a later Daf group. Reply if 9:15 PM works better.', time: '2h ago', likes: 18, comments: 14, pinned: false, liked: true },
    ],
    events: ['Community melave malka - Saturday 8:30 PM', 'Parent-child learning - Sunday 10:00 AM'],
    announcements: ['New shul bulletin is available.', 'Please update your neighborhood in settings.'],
    resources: ['Minyan times PDF', 'Local eruv status', 'Gemach directory'],
  },
  {
    id: 'chesed-response-circle',
    name: 'Chesed Response Circle',
    category: 'Chesed',
    privacy: 'Private',
    location: 'Woodmere',
    featured: true,
    joined: true,
    memberCount: 684,
    recentActivity: 'Three volunteer slots filled today',
    description: 'Coordinated help for meals, rides, hospital visits, errands, and urgent community support.',
    rules: ['Protect family privacy.', 'Only share confirmed needs.', 'Mark requests complete when covered.'],
    roles: [
      { name: 'Rachel Bloom', role: 'Admin' },
      { name: 'Moshe Klein', role: 'Moderator' },
      { name: 'Esti Feld', role: 'Member' },
    ],
    posts: [
      { id: 'p3', type: 'Chesed request', author: 'Rachel Bloom', title: 'Meals needed for Thursday night', body: 'Two dinner slots remain open. Dairy or pareve both work.', time: '35m ago', likes: 31, comments: 6, pinned: true, liked: false },
      { id: 'p4', type: 'Announcement', author: 'Moshe Klein', title: 'Ride team update', body: 'Please include pickup window and whether a car seat is needed.', time: '4h ago', likes: 11, comments: 2, pinned: false, liked: false },
    ],
    events: ['Volunteer orientation - Tuesday 8:00 PM'],
    announcements: ['New meal train template added.'],
    resources: ['Meal train checklist', 'Hospital bikur cholim guide', 'Emergency contacts'],
  },
  {
    id: 'five-towns-parent-exchange',
    name: 'Five Towns Parent Exchange',
    category: 'Parents',
    privacy: 'Private',
    location: 'Lawrence',
    featured: false,
    joined: false,
    memberCount: 512,
    recentActivity: 'Carpool question active today',
    description: 'A parent-run social space for carpools, playdates, babysitting leads, Shabbos plans, supplies, and practical local questions.',
    rules: ['Keep children private.', 'No teacher criticism threads.', 'Use neighborhood or age labels when helpful.'],
    roles: [
      { name: 'Leah Weiss', role: 'Admin' },
      { name: 'Daniel Price', role: 'Moderator' },
    ],
    posts: [
      { id: 'p5', type: 'Question', author: 'Leah Weiss', title: 'Afternoon carpool from Cedarhurst', body: 'Looking for one seat on Mondays and Wednesdays.', time: '1h ago', likes: 7, comments: 11, pinned: false, liked: false },
      { id: 'p6', type: 'Question', author: 'Daniel Price', title: 'Best rainy-day indoor ideas?', body: 'Looking for local places that work well with younger kids on Sunday afternoons.', time: '6h ago', likes: 22, comments: 3, pinned: true, liked: false },
    ],
    events: ['Parent coffee meetup - Wednesday 8:15 PM'],
    announcements: ['Babysitter recommendation thread refreshed.'],
    resources: ['Babysitter leads', 'Rainy day ideas', 'Carpool board'],
  },
  {
    id: 'daily-learning-beis',
    name: 'Daily Learning Beis',
    category: 'Learning',
    privacy: 'Public',
    location: 'Online and Five Towns',
    featured: true,
    joined: false,
    memberCount: 438,
    recentActivity: 'New learning post 12 minutes ago',
    description: 'Daily Torah posts, Daf Yomi discussion, halacha Q&A, and short shiur recommendations.',
    rules: ['Cite sources when possible.', 'Keep debate respectful.', 'Ask practical halacha to your rav.'],
    roles: [
      { name: 'Rabbi Adler', role: 'Admin' },
      { name: 'Eli Bar', role: 'Moderator' },
    ],
    posts: [
      { id: 'p7', type: 'Learning post', author: 'Rabbi Adler', title: 'Short thought on the parsha', body: 'Today we are looking at how small acts of consistency shape a home.', time: '12m ago', likes: 55, comments: 9, pinned: true, liked: true },
      { id: 'p8', type: 'Question', author: 'Eli Bar', title: 'Best Mishnah app for review?', body: 'Looking for something simple for 10-minute daily review blocks.', time: '3h ago', likes: 9, comments: 17, pinned: false, liked: false },
    ],
    events: ['Guest shiur - Thursday 9:00 PM', 'Daf review - Sunday 7:45 AM'],
    announcements: ['New source sheet posted weekly.'],
    resources: ['Weekly source sheet', 'Daf Yomi links', 'Halacha review list'],
  },
  {
    id: 'simcha-events-board',
    name: 'Simcha & Events Board',
    category: 'Events',
    privacy: 'Public',
    location: 'Five Towns',
    featured: false,
    joined: true,
    memberCount: 803,
    recentActivity: 'New event posted this morning',
    description: 'Mazel tov posts, communal events, setup help, rides, and local celebration details.',
    rules: ['Confirm public details before posting.', 'No private addresses unless approved.', 'Keep simcha threads kind and useful.'],
    roles: [
      { name: 'Shira Feld', role: 'Admin' },
      { name: 'Noam Cohen', role: 'Member' },
    ],
    posts: [
      { id: 'p9', type: 'Event', author: 'Shira Feld', title: 'Community sheva brachos help', body: 'Setup volunteers needed at 6:00 PM. Please comment if available.', time: '45m ago', likes: 27, comments: 5, pinned: false, liked: false },
      { id: 'p10', type: 'Announcement', author: 'Noam Cohen', title: 'Mazel tov to the Levy family', body: 'Bar mitzvah details are in the event thread.', time: '7h ago', likes: 61, comments: 12, pinned: false, liked: true },
    ],
    events: ['Community sheva brachos - Monday 7:30 PM', 'Chanukah concert planning - next week'],
    announcements: ['Event volunteer signups are open.'],
    resources: ['Local halls list', 'Setup checklist', 'Simcha vendor notes'],
  },
  {
    id: 'jewish-singles-circle',
    name: 'Jewish Singles Circle',
    category: 'Singles',
    privacy: 'Private',
    location: 'Nassau and Queens',
    featured: false,
    joined: false,
    memberCount: 276,
    recentActivity: 'Moderator added an event',
    description: 'A moderated space for appropriate singles events, introductions, learning nights, and social opportunities.',
    rules: ['Moderated posts only.', 'Respect privacy.', 'No screenshots or forwarding.'],
    roles: [
      { name: 'Tamar Klein', role: 'Admin' },
      { name: 'Ari Katz', role: 'Moderator' },
    ],
    posts: [
      { id: 'p11', type: 'Event', author: 'Tamar Klein', title: 'Board game night signup', body: 'Limited spots available. Details shared after approval.', time: '5h ago', likes: 14, comments: 4, pinned: true, liked: false },
    ],
    events: ['Board game night - Motzei Shabbos', 'Learning and coffee - Wednesday'],
    announcements: ['New member approvals happen twice a week.'],
    resources: ['Event guidelines', 'Moderator contact'],
  },
  {
    id: 'young-parents-five-towns',
    name: 'Young Parents Five Towns',
    category: 'Parents',
    privacy: 'Public',
    location: 'Cedarhurst and Woodmere',
    featured: false,
    joined: false,
    memberCount: 344,
    recentActivity: 'Park meetup thread active',
    description: 'Playdates, Shabbos hosting, babysitting leads, parent questions, and new family introductions.',
    rules: ['No medical advice threads.', 'Keep babysitter info respectful.', 'Use first names only for children.'],
    roles: [
      { name: 'Naomi Adler', role: 'Admin' },
      { name: 'Ben Torah', role: 'Moderator' },
    ],
    posts: [
      { id: 'p12', type: 'Question', author: 'Naomi Adler', title: 'Sunday park meetup?', body: 'Thinking 10:30 AM at Andrew J. Parise Park if weather holds.', time: '1h ago', likes: 23, comments: 16, pinned: false, liked: false },
    ],
    events: ['Park meetup - Sunday 10:30 AM', 'New families meal train - next month'],
    announcements: ['Winter indoor play list updated.'],
    resources: ['Babysitter leads', 'Park list', 'Parent resource doc'],
  },
  {
    id: 'cedarhurst-neighborhood-watch',
    name: 'Cedarhurst Neighborhood Board',
    category: 'Neighborhoods',
    privacy: 'Public',
    location: 'Cedarhurst',
    featured: false,
    joined: false,
    memberCount: 591,
    recentActivity: 'Lost item returned today',
    description: 'Local alerts, lost and found, road closures, store updates, and helpful neighborhood information.',
    rules: ['No lashon hara.', 'Verify safety alerts.', 'Keep business posts limited and relevant.'],
    roles: [
      { name: 'Yoni Green', role: 'Admin' },
      { name: 'Chani Davis', role: 'Moderator' },
    ],
    posts: [
      { id: 'p13', type: 'Announcement', author: 'Yoni Green', title: 'Road work on Central Ave', body: 'Expect delays near Central Ave until 3:00 PM.', time: '28m ago', likes: 19, comments: 7, pinned: false, liked: false },
    ],
    events: ['Neighborhood cleanup - Sunday 11:00 AM'],
    announcements: ['Lost siddur was returned.'],
    resources: ['Local emergency numbers', 'Eruv map', 'Municipal links'],
  },
  {
    id: 'five-towns-pickleball',
    name: 'Five Towns Pickleball & Sports',
    category: 'Hobbies',
    privacy: 'Public',
    location: 'Cedarhurst and Lawrence',
    featured: true,
    joined: false,
    memberCount: 219,
    recentActivity: 'Two courts reserved for Thursday night',
    description: 'Pickup games, walking groups, basketball runs, pickleball meetups, and casual fitness with local Jewish friends.',
    rules: ['Post times and skill level clearly.', 'Keep games inclusive.', 'Confirm attendance if you reserve a spot.'],
    roles: [
      { name: 'Josh Miller', role: 'Admin' },
      { name: 'Ari Stein', role: 'Moderator' },
    ],
    posts: [
      { id: 'p14', type: 'Event', author: 'Josh Miller', title: 'Thursday pickleball ladder', body: 'Beginner-friendly court opens at 8:15 PM. Bring a paddle if you have one.', time: '22m ago', likes: 16, comments: 9, pinned: true, liked: false },
      { id: 'p15', type: 'Question', author: 'Ari Stein', title: 'Sunday morning basketball?', body: 'Looking for 8 more for a low-pressure run after Shacharis.', time: '3h ago', likes: 8, comments: 12, pinned: false, liked: false },
    ],
    events: ['Pickleball ladder - Thursday 8:15 PM', 'Sunday basketball - 9:30 AM'],
    announcements: ['Winter indoor gym list updated.'],
    resources: ['Court signup sheet', 'Local gym list', 'Beginner rules'],
  },
  {
    id: 'shabbos-table-hosts',
    name: 'Shabbos Table Hosts',
    category: 'Lifestyle',
    privacy: 'Private',
    location: 'Five Towns',
    featured: false,
    joined: true,
    memberCount: 367,
    recentActivity: 'Four guests matched for this Shabbos',
    description: 'A warm place to host, be hosted, welcome newcomers, arrange meals, and make Shabbos feel less anonymous.',
    rules: ['Hosts approve details privately.', 'Do not post exact addresses.', 'Keep family preferences respectful.'],
    roles: [
      { name: 'Tova Green', role: 'Admin' },
      { name: 'Dovid Katz', role: 'Moderator' },
    ],
    posts: [
      { id: 'p16', type: 'Chesed request', author: 'Tova Green', title: 'Two guests looking for lunch', body: 'New couple in Woodmere would love a Shabbos lunch invite this week.', time: '41m ago', likes: 24, comments: 7, pinned: true, liked: true },
      { id: 'p17', type: 'Announcement', author: 'Dovid Katz', title: 'Host preference form updated', body: 'Added allergies, walking distance, and kids-at-table fields.', time: '5h ago', likes: 13, comments: 2, pinned: false, liked: false },
    ],
    events: ['Newcomer melave malka - next month'],
    announcements: ['Host matching opens every Tuesday.'],
    resources: ['Host preference form', 'Guest matching guidelines', 'Allergy checklist'],
  },
  {
    id: 'modern-orthodox-home-builders',
    name: 'Modern Orthodox Home Builders',
    category: 'Values',
    privacy: 'Private',
    location: 'Online and Five Towns',
    featured: false,
    joined: false,
    memberCount: 302,
    recentActivity: 'New discussion on kids and screens',
    description: 'Thoughtful discussion for families trying to build committed, warm, Torah-centered homes in modern life.',
    rules: ['Assume sincerity.', 'No judging other families.', 'Practical halacha goes to your rav.'],
    roles: [
      { name: 'Rabbi Adler', role: 'Admin' },
      { name: 'Maya Rosen', role: 'Moderator' },
    ],
    posts: [
      { id: 'p18', type: 'Question', author: 'Maya Rosen', title: 'Phones at the Shabbos table?', body: 'What boundaries have actually worked in your home?', time: '55m ago', likes: 33, comments: 21, pinned: false, liked: false },
      { id: 'p19', type: 'Learning post', author: 'Rabbi Adler', title: 'Small rituals that shape a home', body: 'A short source-based note on consistency, warmth, and shared responsibility.', time: '2h ago', likes: 48, comments: 6, pinned: true, liked: true },
    ],
    events: ['Parent values roundtable - Tuesday 8:30 PM'],
    announcements: ['Monthly topic: technology and kedusha.'],
    resources: ['Family discussion guide', 'Recommended shiurim', 'Shabbos table prompts'],
  },
  {
    id: 'jewish-marketplace-fivetowns',
    name: 'Five Towns Jewish Marketplace',
    category: 'Buy/Sell',
    privacy: 'Public',
    location: 'Five Towns',
    featured: false,
    joined: false,
    memberCount: 731,
    recentActivity: 'Three listings added today',
    description: 'A moderated community marketplace for furniture, baby gear, seforim, gemach items, rentals, and local recommendations.',
    rules: ['No unsafe items.', 'Mark sold quickly.', 'No duplicate business spam.'],
    roles: [
      { name: 'Chani Davis', role: 'Admin' },
      { name: 'Yoni Green', role: 'Moderator' },
    ],
    posts: [
      { id: 'p20', type: 'Announcement', author: 'Chani Davis', title: 'Pesach appliance gemach list', body: 'Updated pickup times and contact people are in resources.', time: '1h ago', likes: 18, comments: 5, pinned: true, liked: false },
      { id: 'p21', type: 'Question', author: 'Yoni Green', title: 'Looking for folding chairs', body: 'Need 12 chairs for a vort next week. Borrow or buy.', time: '4h ago', likes: 6, comments: 8, pinned: false, liked: false },
    ],
    events: [],
    announcements: ['Marketplace rules refreshed.'],
    resources: ['Gemach directory', 'Listing guidelines', 'Pickup etiquette'],
  },
];

function buildCommunity(data) {
  return {
    ...data,
    id: `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
    featured: false,
    joined: true,
    memberCount: 1,
    recentActivity: 'Created just now',
    roles: [{ name: 'You', role: 'Admin' }],
	    posts: [
	      {
        id: `post-${Date.now()}`,
        type: 'Announcement',
        author: 'You',
	        title: 'Welcome to the community',
	        body: 'This space is ready for a focused feed, announcements, questions, resources, events, and member introductions.',
        time: 'Just now',
        likes: 0,
        comments: 0,
        pinned: true,
        liked: false,
      },
    ],
    events: [],
    announcements: ['Community created. Add your first real announcement when ready.'],
    resources: ['Community guidelines'],
  };
}

export default function Communities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState(initialCommunities);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === selectedCommunityId),
    [communities, selectedCommunityId]
  );

  const filteredCommunities = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return communities.filter((community) => {
      const matchesQuery =
        !cleanQuery ||
        community.name.toLowerCase().includes(cleanQuery) ||
        community.description.toLowerCase().includes(cleanQuery) ||
        community.location.toLowerCase().includes(cleanQuery);
      const matchesCategory = category === 'All' || community.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, communities, query]);

  const featuredCommunities = filteredCommunities.filter((community) => community.featured);
  const joinedCommunities = filteredCommunities.filter((community) => community.joined);
  const suggestedCommunities = filteredCommunities.filter((community) => !community.joined);
  const activityFeed = useMemo(() => {
    return communities
      .flatMap((community) => community.posts.map((post) => ({ ...post, communityId: community.id, communityName: community.name, communityCategory: community.category })))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned))
      .slice(0, 8);
  }, [communities]);
  const joinedCount = communities.filter((community) => community.joined).length;
  const totalMembers = communities.reduce((sum, community) => sum + community.memberCount, 0);
  const totalPosts = communities.reduce((sum, community) => sum + community.posts.length, 0);
  const totalEvents = communities.reduce((sum, community) => sum + community.events.length, 0);

  const toggleJoin = (communityId) => {
    setCommunities((current) =>
      current.map((community) => {
        if (community.id !== communityId) return community;
        const joined = !community.joined;
        return {
          ...community,
          joined,
          memberCount: Math.max(0, community.memberCount + (joined ? 1 : -1)),
          recentActivity: joined ? 'You joined just now' : 'You left this community',
        };
      })
    );
  };

  const toggleLikePost = (communityId, postId) => {
    setCommunities((current) =>
      current.map((community) => {
        if (community.id !== communityId) return community;
        return {
          ...community,
          posts: community.posts.map((post) => {
            if (post.id !== postId) return post;
            return {
              ...post,
              liked: !post.liked,
              likes: Math.max(0, post.likes + (post.liked ? -1 : 1)),
            };
          }),
        };
      })
    );
  };

  const createCommunity = (community) => {
    const newCommunity = buildCommunity(community);
    setCommunities((current) => [newCommunity, ...current]);
    setSelectedCommunityId(newCommunity.id);
    setShowCreate(false);
  };

  if (selectedCommunity) {
    return (
      <CommunityHubDetail
        community={selectedCommunity}
        onBack={() => setSelectedCommunityId(null)}
        onToggleJoin={() => toggleJoin(selectedCommunity.id)}
        onToggleLike={(postId) => toggleLikePost(selectedCommunity.id, postId)}
      />
    );
  }

  return (
    <main className="app-page mobile-safe-bottom">
      <section className="mobile-page-wide px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="app-card mb-4 overflow-hidden">
          <div className="grid gap-0 sm:grid-cols-[1fr_240px]">
            <div className="relative overflow-hidden p-4 sm:p-6">
              <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[48px] bg-blue-50" />
              <button
                onClick={() => navigate('/Messages')}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                aria-label="Messages"
              >
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </button>
              <p className="relative mb-2 flex items-center gap-2 text-[13px] font-black text-blue-700">
                <Sparkles className="h-4 w-4" />
                Five Towns Jewish social networks
              </p>
              <h1 className="relative text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">Communities</h1>
              <p className="relative mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-700">
                Create and join the focused local networks that make the Five Towns feel connected: hobbies, lifestyles, religious values, shul circles, neighborhoods, and everyday Jewish life.
              </p>

              <div className="relative mt-4 flex flex-wrap gap-2">
                <PulsePill icon={HeartHandshake} label="Purpose-built groups" />
                <PulsePill icon={MessageCircle} label={`${totalPosts} active threads`} />
                <PulsePill icon={CalendarDays} label={`${totalEvents} upcoming events`} />
              </div>
            </div>

            <div className="border-t border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4 sm:border-l sm:border-t-0 sm:p-4">
              <div className="app-card mb-3 p-3">
                <p className="text-[12px] font-black uppercase tracking-wide text-slate-800">Build the local hub</p>
                <p className="mt-1 text-[13px] font-medium leading-5 text-slate-700">Launch a circle people return to for conversation, plans, introductions, resources, and daily belonging.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Communities" value={communities.length} tone="blue" />
                <MetricCard label="Joined by you" value={joinedCount} tone="emerald" />
                <MetricCard label="Members" value={totalMembers.toLocaleString()} tone="amber" />
	                <MetricCard label="Networks" value={categories.length - 1} tone="rose" />
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="app-button-primary mt-3 h-11 w-full"
              >
                <Plus className="h-4 w-4" />
                Create Community
              </button>
            </div>
          </div>
        </div>

	        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_360px]">
	          <section className="app-card p-3">
	            <div className="mb-3 flex items-center justify-between gap-3">
	              <div>
	                <h2 className="text-[17px] font-black text-slate-950">Five Towns pulse</h2>
	                <p className="text-[12px] font-medium text-slate-500">A live-feeling feed across the Jewish networks people belong to.</p>
	              </div>
	              <Radio className="h-5 w-5 text-blue-600" />
	            </div>
	            <div className="space-y-2">
	              {activityFeed.map((post) => (
	                <button
	                  key={`${post.communityId}-${post.id}`}
	                  onClick={() => setSelectedCommunityId(post.communityId)}
	                  className="flex w-full items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left transition hover:bg-white active:scale-[0.99]"
	                >
	                  <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${categoryHighlights[post.communityCategory] || 'border-slate-200 bg-white text-slate-600'}`}>
	                    {post.communityCategory}
	                  </span>
	                  <span className="min-w-0 flex-1">
	                    <span className="block truncate text-[13px] font-black text-slate-950">{post.title}</span>
	                    <span className="block truncate text-[12px] font-semibold text-slate-500">{post.communityName} · {post.time} · {post.comments} replies</span>
	                  </span>
	                </button>
	              ))}
	            </div>
	          </section>

	          <section className="app-card p-3">
	            <div className="mb-3 flex items-center gap-2">
	              <ShieldCheck className="h-5 w-5 text-emerald-700" />
	              <div>
	                <h2 className="text-[17px] font-black text-slate-950">Social network engine</h2>
	                <p className="text-[12px] font-medium text-slate-500">Make people discover, join, post, and come back.</p>
	              </div>
	            </div>
	            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
	              {networkLoops.map((tool) => (
	                <div key={tool} className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-800">
	                  <CheckCircle2 className="h-4 w-4 shrink-0" />
	                  {tool}
	                </div>
	              ))}
	            </div>
	          </section>
	        </div>

	        <section className="app-card mb-5 p-3">
	          <div className="mb-3 flex items-center justify-between gap-3">
	            <div>
	              <h2 className="text-[17px] font-black text-slate-950">Conversation starters</h2>
	              <p className="text-[12px] font-medium text-slate-500">Built-in reasons for members to post before a group feels empty.</p>
	            </div>
	            <Bell className="h-5 w-5 text-blue-600" />
	          </div>
	          <div className="grid gap-2 md:grid-cols-3">
	            {conversationStarters.map((starter) => (
	              <div key={starter.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
	                <p className="text-[14px] font-black text-slate-950">{starter.title}</p>
	                <p className="mt-1 text-[12px] font-medium leading-5 text-slate-600">{starter.body}</p>
	              </div>
	            ))}
	          </div>
	        </section>

	        <section className="app-card mb-5 overflow-hidden">
	          <div className="border-b border-slate-100 p-3">
	            <p className="text-[12px] font-black uppercase tracking-wide text-emerald-700">Retention systems</p>
	            <h2 className="mt-1 text-[17px] font-black text-slate-950">What keeps communities alive</h2>
	            <p className="mt-1 text-[12px] font-medium leading-5 text-slate-500">Simple operating pieces that make groups feel active without adding clutter.</p>
	          </div>
	          <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
	            {communityRetentionCards.map((card) => (
	              <div key={card.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
	                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
	                  <card.icon className="h-4 w-4" />
	                </div>
	                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{card.stat}</p>
	                <p className="mt-0.5 text-[14px] font-black text-slate-950">{card.title}</p>
	                <p className="mt-1 text-[12px] font-medium leading-5 text-slate-600">{card.body}</p>
	              </div>
	            ))}
	          </div>
	        </section>

	        <section className="app-card mb-5 overflow-hidden">
	          <div className="border-b border-slate-100 p-3">
	            <p className="text-[12px] font-black uppercase tracking-wide text-blue-700">Hub playbook</p>
	            <h2 className="mt-1 text-[17px] font-black text-slate-950">How JUnited becomes the Five Towns layer</h2>
	            <p className="mt-1 text-[12px] font-medium leading-5 text-slate-500">Communities are the identity system for the whole app.</p>
	          </div>
	          <div className="grid gap-2 p-3 sm:grid-cols-2">
	            {hubPlaybook.map((item) => (
	              <div key={item} className="rounded-2xl bg-blue-50 px-3 py-2 text-[12px] font-bold leading-5 text-blue-800">
	                {item}
	              </div>
	            ))}
	          </div>
	        </section>

        <div className="app-card mb-5 p-3">
          <div className="flex flex-col gap-3">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, topic, or neighborhood"
                className="app-input pl-10 pr-3 text-sm"
              />
            </label>

            <div className="mobile-scroll-x flex items-center gap-2 pb-1">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`h-10 shrink-0 rounded-xl border px-3 text-sm font-semibold transition ${
                    category === item
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item}
                  {item !== 'All' && (
                    <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${category === item ? 'bg-white/15 text-white' : categoryHighlights[item] || 'bg-slate-100 text-slate-500'}`}>
                      {communities.filter((community) => community.category === item).length}
                    </span>
                  )}
                </button>
              ))}
	        </div>

	        <section className="mb-5 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
	          <div className="mb-3 flex items-center justify-between gap-3">
	            <div>
	              <h2 className="text-[17px] font-black text-slate-950">Launch templates</h2>
	              <p className="text-[12px] font-medium text-slate-500">Fast paths for the communities people actually want to join.</p>
	            </div>
	            <Star className="h-5 w-5 text-amber-500" />
	          </div>
	          <div className="motion-stagger grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
	            {launchTemplates.map((template) => (
	              <button
	                key={template.title}
	                onClick={() => {
	                  setCategory(template.category);
	                  setQuery('');
	                }}
	                className="motion-press rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-white active:scale-[0.99]"
	              >
	                <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black ${categoryHighlights[template.category] || 'border-slate-200 bg-white text-slate-600'}`}>
	                  {template.category}
	                </span>
	                <p className="mt-2 text-[14px] font-black text-slate-950">{template.title}</p>
	                <p className="mt-1 text-[12px] font-medium leading-5 text-slate-600">{template.body}</p>
	              </button>
	            ))}
	          </div>
	        </section>
          </div>
        </div>

        {filteredCommunities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">No communities found</h2>
            <p className="mt-1 text-sm text-slate-500">Try another search, switch categories, or create a new community.</p>
          </div>
        ) : (
          <div className="motion-stagger space-y-7">
            {featuredCommunities.length > 0 && (
              <CommunitySection
                title="Featured Communities"
                subtitle="High-signal hubs with strong activity this week."
                communities={featuredCommunities}
                onOpen={setSelectedCommunityId}
                onToggleJoin={toggleJoin}
                featured
              />
            )}

            {joinedCommunities.length > 0 && (
              <CommunitySection
                title="Joined Communities"
                subtitle="Your current boards, groups, and local circles."
                communities={joinedCommunities}
                onOpen={setSelectedCommunityId}
                onToggleJoin={toggleJoin}
              />
            )}

            {suggestedCommunities.length > 0 && (
              <CommunitySection
                title="Suggested Communities"
                subtitle="Good places to join next based on the local hub."
                communities={suggestedCommunities}
                onOpen={setSelectedCommunityId}
                onToggleJoin={toggleJoin}
              />
            )}
          </div>
        )}
      </section>

      {showCreate && (
        <CreateCommunityForm
          categories={categories.filter((item) => item !== 'All')}
          onCreate={createCommunity}
          onClose={() => setShowCreate(false)}
        />
      )}
    </main>
  );
}

function CommunitySection({ title, subtitle, communities, onOpen, onToggleJoin, featured = false }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          <p className="text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>
        <div className="hidden items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 sm:flex">
          <Compass className="h-3.5 w-3.5" />
          {communities.length}
        </div>
      </div>

      <div className="motion-stagger grid gap-3 sm:grid-cols-2">
        {communities.map((community) => (
          <CommunityHubCard
            key={community.id}
            community={community}
            featured={featured}
            onOpen={() => onOpen(community.id)}
            onToggleJoin={() => onToggleJoin(community.id)}
          />
        ))}
      </div>
    </section>
  );
}

function PulsePill({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm">
      <Icon className="h-3.5 w-3.5 text-blue-600" />
      {label}
    </span>
  );
}

function MetricCard({ label, value, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className={`inline-flex rounded-full px-2 py-1 text-[11px] font-black ${tones[tone]}`}>{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
