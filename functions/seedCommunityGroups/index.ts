import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── 50 COMMUNITY GROUPS ─────────────────────────────────────────────────────
const GROUPS = [
  // Local Life
  { name: 'Five Towns Alerts', description: 'Real-time alerts and updates for the Five Towns community', category: 'Local Life', member_count: 148 },
  { name: 'Lost & Found Five Towns', description: 'Lost something? Found something? Post it here.', category: 'Local Life', member_count: 74 },
  { name: 'Babysitters & Tutors', description: 'Find or offer babysitting and tutoring services in the Five Towns', category: 'Local Life', member_count: 63 },
  { name: 'Jobs & Internships', description: 'Local job listings, internship opportunities, and career advice', category: 'Local Life', member_count: 82 },
  { name: 'Five Towns Buy / Sell / Free', description: 'Buy, sell, or give away items in the Five Towns community', category: 'Local Life', member_count: 172 },
  { name: 'Housing & Rentals', description: 'Find apartments, rentals, and housing opportunities nearby', category: 'Local Life', member_count: 95 },
  { name: 'Kosher Restaurant Reviews', description: 'Reviews, recommendations, and news about local kosher restaurants', category: 'Local Life', member_count: 110 },
  { name: 'Five Towns Parents Network', description: 'Parenting tips, school advice, and local family resources', category: 'Local Life', member_count: 137 },
  { name: 'Car Pool & Rides', description: 'Coordinate carpools, airport rides, and local transportation', category: 'Local Life', member_count: 89 },
  { name: 'Neighborhood Watch', description: 'Keep our streets safe — share safety tips and alerts', category: 'Local Life', member_count: 121 },
  { name: 'Five Towns Real Estate', description: 'Home buying, selling, and investment discussions', category: 'Local Life', member_count: 68 },
  { name: 'Local Business Owners', description: 'Support and connect Five Towns small business owners', category: 'Local Life', member_count: 54 },

  // Chessed
  { name: 'Mitzvah Map Volunteers', description: 'Coordinate volunteer efforts and chesed opportunities nearby', category: 'Chessed', member_count: 96 },
  { name: 'Bikur Cholim Volunteers', description: 'Visit and support community members who are ill or recovering', category: 'Chessed', member_count: 57 },
  { name: 'Meal Train Coordinators', description: 'Organize meals for new parents, mourners, and those in need', category: 'Chessed', member_count: 73 },
  { name: 'Holiday Chesed Projects', description: 'Holiday-specific chesed drives — Yom Tov packages, Purim mishloach manos, and more', category: 'Chessed', member_count: 88 },
  { name: 'Tomchei Shabbos Helpers', description: 'Volunteer to prepare and deliver Shabbos food packages to those in need', category: 'Chessed', member_count: 64 },
  { name: 'Special Needs Support Network', description: 'Resources and support for families with children or adults with special needs', category: 'Chessed', member_count: 45 },
  { name: 'Mental Health Awareness FT', description: 'Breaking stigmas and sharing resources around mental wellness in our community', category: 'Chessed', member_count: 58 },
  { name: 'Senior Care & Companion', description: 'Connecting seniors with companions, drivers, and practical help', category: 'Chessed', member_count: 42 },

  // Social
  { name: 'Pickup Basketball', description: 'Organize pickup basketball games in the Five Towns area', category: 'Social', member_count: 51 },
  { name: 'Young Adults Hangouts', description: 'Social events and hangouts for young Jewish adults', category: 'Social', member_count: 69 },
  { name: 'Shabbos Table Guests', description: 'Host or be hosted — find a Shabbos meal in your neighborhood', category: 'Social', member_count: 93 },
  { name: 'Five Towns Foodies', description: 'Share kosher recipes, restaurant tips, and food photos', category: 'Social', member_count: 107 },
  { name: 'Hiking & Outdoors', description: 'Organize hikes, nature walks, and outdoor adventures near Five Towns', category: 'Social', member_count: 48 },
  { name: 'Book Club – Jewish Fiction', description: 'Monthly reads and discussions of Jewish literature and fiction', category: 'Social', member_count: 37 },
  { name: 'Women\'s Fitness & Wellness', description: 'Workouts, wellness tips, and motivation for women in our community', category: 'Social', member_count: 61 },
  { name: 'Men\'s Learning & Schmooze', description: 'Weekly learning sessions followed by good food and conversation', category: 'Social', member_count: 44 },
  { name: 'Moms of Teens', description: 'A safe space for moms navigating the teen years together', category: 'Social', member_count: 76 },
  { name: 'Young Couples FT', description: 'Events, advice, and connection for newly married couples', category: 'Social', member_count: 55 },
  { name: 'Five Towns Sports Network', description: 'All things sports — leagues, games, fantasy, and more', category: 'Social', member_count: 88 },

  // Learning
  { name: 'Daf Yomi Chat', description: 'Daily Daf Yomi discussions, questions, and insights', category: 'Learning', member_count: 112 },
  { name: 'Weekly Parsha Discussion', description: 'Explore the weekly Torah portion with divrei Torah and questions', category: 'Learning', member_count: 98 },
  { name: 'Halacha Q&A', description: 'Post your halacha questions and get answers from knowledgeable community members', category: 'Learning', member_count: 86 },
  { name: 'Women\'s Torah Learning', description: 'Shiurim, resources, and discussions for women who love learning', category: 'Learning', member_count: 73 },
  { name: 'Jewish History Buffs', description: 'Deep dives into Jewish history, personalities, and events', category: 'Learning', member_count: 52 },
  { name: 'Nach Learners', description: 'Group learning and discussion of the books of Prophets and Writings', category: 'Learning', member_count: 41 },
  { name: 'Mussar & Middot', description: 'Daily mussar study and discussions on character development', category: 'Learning', member_count: 39 },
  { name: 'Five Towns Shiurim Board', description: 'Listings of all local shiurim — times, locations, and topics', category: 'Learning', member_count: 130 },
  { name: 'Chumash & Rashi Study', description: 'Weekly study sessions covering Chumash with Rashi\'s commentary', category: 'Learning', member_count: 67 },

  // Institutional
  { name: 'HAFTR Community', description: 'Community hub for HAFTR students, parents, and alumni', category: 'Institutional', subcategory: 'School', member_count: 111 },
  { name: 'DRS Yeshiva Families', description: 'Parents, students, and alumni of DRS Yeshiva High School', category: 'Institutional', subcategory: 'School', member_count: 87 },
  { name: 'HALB School Community', description: 'Hebrew Academy of Long Beach parents and community', category: 'Institutional', subcategory: 'School', member_count: 103 },
  { name: 'Young Israel Woodmere Members', description: 'Official group for Young Israel of Woodmere community', category: 'Institutional', subcategory: 'Shul', member_count: 158 },
  { name: 'Aish Kodesh Community', description: 'Community group for Aish Kodesh shul members and friends', category: 'Institutional', subcategory: 'Shul', member_count: 94 },
  { name: 'Five Towns Kollel Circle', description: 'Connect with and support Five Towns Kollel', category: 'Institutional', subcategory: 'Shul', member_count: 48 },
  { name: 'Ma\'ayanot Alumnae Network', description: "Ma'ayanot graduates staying connected and giving back", category: 'Institutional', subcategory: 'School', member_count: 72 },
  { name: 'Chabad FT Community', description: 'Events, learning, and connection through Chabad of the Five Towns', category: 'Institutional', subcategory: 'Shul', member_count: 65 },
  { name: 'YOSS Alumni & Parents', description: 'Yeshiva of the South Shore — alumni network and parent community', category: 'Institutional', subcategory: 'School', member_count: 81 },
  { name: 'Friendship Circle Volunteers', description: 'Volunteer for and support Friendship Circle of the Five Towns', category: 'Institutional', subcategory: 'Camp', member_count: 59 },
  { name: 'Hatzalah Five Towns Support', description: 'Support and updates for Hatzalah volunteers and community', category: 'Institutional', subcategory: 'Shul', member_count: 144 },
];

// Auto-join these groups for the requesting user
const AUTO_JOIN_NAMES = new Set([
  'Five Towns Alerts',
  'Mitzvah Map Volunteers',
  'Pickup Basketball',
  'Daf Yomi Chat',
  'Young Israel Woodmere Members',
]);

// ─── Mock post content by category ───────────────────────────────────────────
const MOCK_POSTS = {
  'Local Life': [
    { title: 'Lost: Black wallet near Central Ave', body: 'Found near the ShopRite on Central Ave. Has ID and cards inside. Please reach out to claim.' },
    { title: 'Anyone need a babysitter this Shabbos?', body: 'My daughter is available to babysit Friday night and Shabbos afternoon. Very responsible, 17 years old. Call/text.' },
    { title: 'Heads up: Construction on Broadway', body: 'Starting Monday there will be significant road work on Broadway between Woodmere and Lawrence. Expect delays.' },
    { title: 'Selling: Pekelach game set, like new', body: 'Kids barely used it. Asking $15. Pickup in Woodmere.' },
    { title: '🚨 Alert: Car broken into on Pine St', body: 'Our car was broken into last night on Pine St. Please check your vehicles and lock your cars.' },
    { title: 'Tutoring available — Math and English', body: 'Certified teacher offering tutoring for grades 3-8. Patient and experienced. References available.' },
  ],
  'Chessed': [
    { title: 'Meal train needed for Greenberg family', body: 'Please sign up to bring a meal for the Greenberg family who just had a baby. Link in comments.' },
    { title: 'Bikur Cholim visit — anyone available?', body: 'Looking for volunteers to visit patients at South Nassau this Sunday afternoon.' },
    { title: '🙏 Thank you to everyone who helped!', body: 'Wanted to express sincere hakarat hatov to all the amazing community members who stepped up.' },
    { title: 'Tomchei Shabbos needs drivers', body: 'We need 3-4 drivers this week for deliveries before Shabbos. Routes are short, about 45 min each.' },
    { title: 'Holiday package donations needed', body: 'We are preparing mishloach manos packages for families in need. Donations of shelf-stable food welcome.' },
    { title: 'Special needs resources', body: 'Sharing a list of local resources, therapists, and programs for families with special needs children.' },
  ],
  'Social': [
    { title: 'Pickup game Sunday morning — who\'s in?', body: 'Lawrence gym, 8am Sunday. 5-on-5. Need 2 more players. Message me to confirm.' },
    { title: 'Shabbos meal — anyone looking for a place?', body: 'We have room at our table this Shabbos! Young adults and couples welcome. Message for details.' },
    { title: 'Great new kosher sushi spot!', body: 'Tried the new place on Central Ave — amazing tuna rolls, reasonable prices. Highly recommend!' },
    { title: 'Women\'s hike this Sunday 7am', body: 'Hike at Caumsett State Park. All levels welcome. Bring water and good shoes!' },
    { title: 'Monthly book club meeting recap', body: 'We finished "The Sacrifice of Tamar" this month. Great discussion! Voting on next book now.' },
    { title: 'Young adults event next week', body: 'Trivia night at a local venue. Cost is $10/person. Sign up in the comments!' },
  ],
  'Learning': [
    { title: 'Today\'s daf — Bava Metzia 47', body: 'Great gemara today about kinyanim. The Rashi on 47b is particularly illuminating. Thoughts?' },
    { title: 'Parsha question: Vayikra', body: 'Why does the Torah use the small alef in Vayikra? Several mefarshim address this — would love to hear your takes.' },
    { title: 'Halacha Q: Using a phone on Chol Hamoed', body: 'What are the parameters for using smartphones for work-related purposes on Chol Hamoed? Asking for a friend 😄' },
    { title: 'Shiur tonight: Rav Soloveitchik on teshuva', body: 'Reminder: Shiur tonight at 8:30pm in the shul beis medrash. All are welcome.' },
    { title: 'Recommended sefer — Nefesh HaRav', body: 'For anyone interested in Rav Soloveitchik\'s worldview, this is essential reading.' },
    { title: 'Women\'s Tehillim group forming', body: 'Looking to start a weekly Tehillim group, Sundays at 9am. Who\'s interested?' },
  ],
  'Institutional': [
    { title: 'Upcoming school fundraiser', body: 'Annual dinner is coming up — please consider reserving your tickets early this year. Great cause!' },
    { title: 'Shul kiddush sponsorship available', body: 'Looking for a sponsor for next Shabbos kiddush in memory of a loved one. Contact the office.' },
    { title: 'New shiur schedule posted', body: 'Updated shiur schedule for this zman is now available on the website and shul bulletin board.' },
    { title: 'Alumni reunion — save the date', body: 'Class reunion is being planned for June. More details to follow — spread the word to your classmates!' },
    { title: 'Parent teacher conferences', body: 'Sign up for your PT conference slot through the school portal. Slots are filling quickly!' },
    { title: 'Announcement: New assistant rabbi', body: 'We are thrilled to welcome our new assistant rabbi to the community. Please join us in welcoming him!' },
  ],
};

const MOCK_AUTHORS = [
  { user_name: 'Mordechai Levine', user_id: 'seed_user_1' },
  { user_name: 'Chana Shapiro', user_id: 'seed_user_2' },
  { user_name: 'Yosef Goldberg', user_id: 'seed_user_3' },
  { user_name: 'Rivka Stern', user_id: 'seed_user_4' },
  { user_name: 'Avi Weiss', user_id: 'seed_user_5' },
  { user_name: 'Miriam Cohen', user_id: 'seed_user_6' },
  { user_name: 'Binyamin Katz', user_id: 'seed_user_7' },
  { user_name: 'Devorah Friedman', user_id: 'seed_user_8' },
  { user_name: 'Nachum Klein', user_id: 'seed_user_9' },
  { user_name: 'Sara Blum', user_id: 'seed_user_10' },
];

const MOCK_COMMENTS = [
  'Totally agree with this!',
  'Thanks for sharing, very helpful.',
  'Can you send me more details?',
  'We went through something similar — happy to talk.',
  'Yasher koach for posting this!',
  'This is exactly what our community needs.',
  'Shared with my family, they appreciate it!',
  'Following for updates 🙏',
  'Incredible how much this community steps up.',
  'Sent you a message!',
  'Count me in!',
  'Great idea, let\'s make it happen.',
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function recentDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(rand(7, 22), rand(0, 59), 0, 0);
  return d.toISOString();
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { phase = 'groups', offset = 0, limit = 10 } = body;
    const db = base44.asServiceRole;

    // ── PHASE 1: Create groups + memberships ────────────────────────────────
    if (phase === 'groups') {
      // Delete old seeded groups
      const existingGroups = await db.entities.CommunityGroup.list('-created_date', 500);
      const seededOld = existingGroups.filter(g => g.is_seeded);
      console.log(`[seedCG] Removing ${seededOld.length} old seeded groups…`);
      for (let i = 0; i < seededOld.length; i += 10) {
        await Promise.all(seededOld.slice(i, i + 10).map(g => db.entities.CommunityGroup.delete(g.id)));
        await delay(200);
      }

      // Create all groups
      console.log('[seedCG] Creating groups…');
      const createdGroups = [];
      for (let i = 0; i < GROUPS.length; i += 10) {
        const batch = GROUPS.slice(i, i + 10);
        const created = await Promise.all(batch.map(g => db.entities.CommunityGroup.create({
          ...g, is_seeded: true, is_private: false, post_count: 6,
        })));
        createdGroups.push(...created);
        await delay(300);
      }

      // Auto-join user into core groups
      const autoGroups = createdGroups.filter(g => AUTO_JOIN_NAMES.has(g.name));
      const existingMemberships = await db.entities.GroupMember.filter({ user_id: user.id });
      const alreadyJoined = new Set(existingMemberships.map(m => m.group_id));
      const toJoin = autoGroups.filter(g => !alreadyJoined.has(g.id));
      await Promise.all(toJoin.map(g => db.entities.GroupMember.create({
        group_id: g.id, user_id: user.id, user_name: user.full_name, role: 'member',
      })));

      console.log(`[seedCG] Groups done: ${createdGroups.length}, memberships: ${toJoin.length}`);
      return Response.json({ ok: true, phase: 'groups', groups_created: createdGroups.length, memberships_created: toJoin.length });
    }

    // ── PHASE 2: Seed posts for first N groups ──────────────────────────────
    if (phase === 'posts') {
      const allGroups = await db.entities.CommunityGroup.filter({ is_seeded: true });
      const slice = allGroups.slice(offset, offset + limit);
      console.log(`[seedCG] Seeding posts for groups ${offset}–${offset + slice.length}`);

      let postsCreated = 0;
      for (const group of slice) {
        const templates = MOCK_POSTS[group.category] || MOCK_POSTS['Local Life'];
        for (let i = 0; i < 6; i++) {
          const template = templates[i % templates.length];
          const author = pickRandom(MOCK_AUTHORS);
          await db.entities.CommunityPost.create({
            community_id: group.id,
            author_user_id: author.user_id,
            author_name: author.user_name,
            title: template.title,
            body: template.body,
            type: 'general',
            is_seeded: true,
            is_official: false,
            is_pinned: false,
          });
          postsCreated++;
          await delay(150);
        }
      }

      return Response.json({ ok: true, phase: 'posts', posts_created: postsCreated, offset, limit });
    }

    return Response.json({ error: 'Unknown phase. Use phase=groups or phase=posts' }, { status: 400 });
  } catch (err) {
    console.error('[seedCG] ERROR:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});