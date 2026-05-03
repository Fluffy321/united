import React, { useMemo, useState } from 'react';
import { CalendarDays, Compass, HeartHandshake, MessageCircle, Plus, Search, Sparkles, Users } from 'lucide-react';
import CommunityHubCard from '@/components/communities/CommunityHubCard';
import CommunityHubDetail from '@/components/communities/CommunityHubDetail';
import CreateCommunityForm from '@/components/communities/CreateCommunityForm';

const categories = ['All', 'Shuls', 'Schools', 'Chesed', 'Learning', 'Events', 'Singles', 'Parents', 'Neighborhoods'];

const categoryHighlights = {
  Shuls: 'border-violet-200 bg-violet-50 text-violet-800',
  Schools: 'border-sky-200 bg-sky-50 text-sky-800',
  Chesed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Learning: 'border-amber-200 bg-amber-50 text-amber-800',
  Events: 'border-rose-200 bg-rose-50 text-rose-800',
  Singles: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800',
  Parents: 'border-orange-200 bg-orange-50 text-orange-800',
  Neighborhoods: 'border-cyan-200 bg-cyan-50 text-cyan-800',
};

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
    id: 'haftr-parent-board',
    name: 'HAFTR Parent Board',
    category: 'Schools',
    privacy: 'Private',
    location: 'Lawrence',
    featured: false,
    joined: false,
    memberCount: 512,
    recentActivity: 'Carpool question active today',
    description: 'A parent-run board for reminders, carpools, school forms, supplies, and grade-level questions.',
    rules: ['Keep student details private.', 'No teacher criticism threads.', 'Use grade labels when helpful.'],
    roles: [
      { name: 'Leah Weiss', role: 'Admin' },
      { name: 'Daniel Price', role: 'Moderator' },
    ],
    posts: [
      { id: 'p5', type: 'Question', author: 'Leah Weiss', title: 'Afternoon carpool from Cedarhurst', body: 'Looking for one seat on Mondays and Wednesdays.', time: '1h ago', likes: 7, comments: 11, pinned: false, liked: false },
      { id: 'p6', type: 'Announcement', author: 'Daniel Price', title: 'Science fair reminder', body: 'Boards are due Monday morning before first period.', time: '6h ago', likes: 22, comments: 3, pinned: true, liked: false },
    ],
    events: ['Parent meeting - Wednesday 8:15 PM'],
    announcements: ['Dismissal form deadline is Friday.'],
    resources: ['School calendar', 'Uniform gemach info', 'Carpool spreadsheet'],
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
    description: 'Playdates, Shabbos hosting, babysitting leads, school questions, and new family introductions.',
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
        body: 'This space is ready for announcements, questions, resources, and events.',
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
    <main className="min-h-screen bg-[#F7F9FC] pb-28">
      <section className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
        <div className="mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-5 sm:p-7">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-700">
                <Sparkles className="h-4 w-4" />
                Jewish Community Hub
              </p>
              <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Communities</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Find the groups that make Jewish life feel closer: shuls, schools, chesed, learning, events, family boards, and neighborhood updates.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <PulsePill icon={HeartHandshake} label="Chesed active today" />
                <PulsePill icon={MessageCircle} label={`${totalPosts} fresh threads`} />
                <PulsePill icon={CalendarDays} label={`${totalEvents} upcoming events`} />
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/70 p-5 lg:border-l lg:border-t-0 sm:p-6">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Communities" value={communities.length} tone="blue" />
                <MetricCard label="Joined by you" value={joinedCount} tone="emerald" />
                <MetricCard label="Members" value={totalMembers.toLocaleString()} tone="amber" />
                <MetricCard label="Categories" value={categories.length - 1} tone="rose" />
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Create Community
              </button>
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, topic, or neighborhood"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
          </div>
        </div>

        {filteredCommunities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">No communities found</h2>
            <p className="mt-1 text-sm text-slate-500">Try another search, switch categories, or create a new community.</p>
          </div>
        ) : (
          <div className="space-y-8">
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

      <div className={`grid gap-4 ${featured ? 'lg:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
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
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${tones[tone]}`}>{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
