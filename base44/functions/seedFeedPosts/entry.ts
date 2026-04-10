import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ── Weekly rotation seed ─────────────────────────────────────
// Deterministic shuffle based on ISO week number so the feed
// surfaces a different mix every week, consistently within the week.
function weekNumber() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function weeklyPick(arr, seed, count) {
  const rng = seededRandom(seed);
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

// ── Author pool ───────────────────────────────────────────────
const SEED_AUTHORS = [
  { name: 'Devorah Katz', id: 'seed_001' },
  { name: 'Moshe Friedman', id: 'seed_002' },
  { name: 'Rivka Goldstein', id: 'seed_003' },
  { name: 'Yossi Schwartz', id: 'seed_004' },
  { name: 'Chana Bernstein', id: 'seed_005' },
  { name: 'Ari Levine', id: 'seed_006' },
  { name: 'Miriam Cohen', id: 'seed_007' },
  { name: 'Tzvi Weiss', id: 'seed_008' },
  { name: 'Esther Blum', id: 'seed_009' },
  { name: 'Noam Shapiro', id: 'seed_010' },
  { name: 'Leah Rosenberg', id: 'seed_011' },
  { name: 'Benny Klein', id: 'seed_012' },
  { name: 'Tova Mandel', id: 'seed_013' },
  { name: 'Akiva Segal', id: 'seed_014' },
  { name: 'Faigy Adler', id: 'seed_015' },
  { name: 'Yehuda Gross', id: 'seed_016' },
  { name: 'Nechama Lipman', id: 'seed_017' },
  { name: 'Pinchus Berger', id: 'seed_018' },
];

const LOCATIONS = [
  'Lawrence', 'Woodmere', 'Cedarhurst', 'Hewlett', 'Oceanside',
  'Valley Stream', 'Far Rockaway', 'Inwood', 'Five Towns'
];

const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
  'https://images.unsplash.com/photo-1551183053-bf91798d792a?w=800',
  'https://images.unsplash.com/photo-1600628421055-4d30de868b8f?w=800',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
  'https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?w=800',
  'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=800',
  'https://images.unsplash.com/photo-1607877361964-d8a3064e68c3?w=800',
  'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
];

// ── Large rotating post pool ──────────────────────────────────
// Each category has many more templates than will ever be shown in
// one week, so the weekly pick surfaces a fresh subset each time.

const POOL = {
  shabbat: [
    { body: 'Shabbos table is set 🕯️✨ Wishing everyone in {location} a beautiful and peaceful Shabbos!' },
    { body: 'Homemade challah just came out of the oven 🍞 The whole house smells amazing. Good Shabbos from {location}!' },
    { body: 'Who else feels like Shabbos comes in faster every week? Between the cooking, cleaning, and getting the kids ready — but the moment the candles are lit, everything is perfect. Shabbat Shalom from {location} 🕯️' },
    { body: 'Kiddush levana last night in {location} — such a beautiful minhag. The whole family came outside. Kids were so excited.' },
    { body: 'Havdalah just ended and I already miss Shabbos 😂 Anyone else count down to next week the moment it\'s over? {location} fam, have a wonderful week!' },
    { body: 'Having guests for Shabbos for the first time in our new home in {location}! So excited — please daven it all comes together 🙏' },
    { body: 'There\'s something so special about Shabbos morning in {location} — quiet streets, neighbors walking to shul, the smell of cholent in every house. Grateful for this community.' },
    { body: 'Tip for Friday afternoons: I make a huge batch of roasted vegetables on Thursday night so Shabbos morning is completely stress free. Anyone else have a pre-Shabbos cooking hack? Sharing from {location} 🧑‍🍳' },
    { body: 'My kids asked if we could have guests every Shabbos after this week\'s meal. Something about kids at the table makes everything more special. {location} families — love our community ❤️' },
    { body: 'Beautiful devar Torah from the rav this Shabbos in {location} — he connected the parasha to something happening in the world right now and it really hit differently. Anyone else there?' },
    { body: 'Pre-Shabbos chaos is real but I wouldn\'t trade it 😅 Soup is on, challah is braided, house smells like Shabbos. Wishing a great Shabbat to everyone in {location}!' },
    { body: 'Shabbos afternoon nap is an underrated mitzvah. Fight me. 😴 {location} — enjoy your Shabbos!' },
  ],

  torah: [
    { body: 'Heard an incredible vort this Shabbos on the connection between the parasha and tefillah. Would love to share it — anyone interested? Drop a comment.' },
    { body: 'Starting a new masechta this week after finishing siyum. Something about that feeling of turning to daf alef again never gets old. Learning in {location} 📖' },
    { body: 'The rav\'s shiur Thursday night was one of the best this year — he spoke about the concept of lifnei iver in modern context. Standing room only in {location}. So good.' },
    { body: 'Question for the learning crowd: does anyone have a good source sheet on the topic of kavod habriot? Preparing for a chavrusa and want to go deep. {location}' },
    { body: 'Just completed a parasha shiur series I\'ve been doing for 3 years. Starting a new one on Nevi\'im. If anyone in {location} wants to join a weekly Zoom chevruta, reach out!' },
    { body: 'My 6-year-old came home from school and taught ME a vort from the parasha. I had nothing to add — that\'s the win. {location} parents, are your kids blowing your mind too? 😂' },
    { body: 'For anyone looking for a solid weekly dvar Torah source — the rav\'s emails are incredible and always practical. If you\'re not subscribed, DM me and I\'ll pass on the info. {location}' },
    { body: 'Fascinating shiur yesterday on the halachos of the eruv in a modern city. So many details most people don\'t know about. Grateful for the talmidei chachamim in {location} who share this knowledge.' },
    { body: 'What\'s everyone learning this Elul / before Rosh Hashana to prepare? I\'m going through the Rambam on teshuva and it\'s really hitting. {location} learning community — what are you doing?' },
    { body: 'There\'s something about learning Torah in the morning before work that sets the whole day differently. Even 15 minutes. Tried it for a month and won\'t stop. {location}' },
  ],

  parenting: [
    { body: 'Any recommendations for a math tutor for a 7th grader in {location}? She\'s great but needs some extra support before finals. Prefer someone patient and fun.' },
    { body: 'Best after-school programs for kids ages 8-10 in {location}? We\'ve been doing one activity but looking to explore something new next year — art, music, sports, anything!' },
    { body: 'My son just told me his favorite part of school is recess. At least he\'s honest? 😂 {location} parents, how do you keep kids motivated in the second half of the year?' },
    { body: 'Question for parents — how do you handle screen time on Shabbos for your kids? We have a system that works most of the time but looking for new ideas. {location}' },
    { body: 'Camp registration is opening soon and I am NOT ready for the stress of decision-making 😅 Anyone want to share what camps their kids loved this past summer? {location} families — help!' },
    { body: 'My 9-year-old finished her first full chapter book in Hebrew this week. Can\'t describe the pride. The day school system here in {location} is doing something right. 📚' },
    { body: 'Funniest thing my 5-year-old said at the Shabbos table: "Abba, if Hashem made everything, who made Hashem?" I was speechless for 10 seconds. {location} parenting is not for the faint of heart 😂' },
    { body: 'Is there a moms\' group for parents of kids with learning differences in {location}? Looking for community and resources, not just professionals. Would love to connect with other families.' },
    { body: 'My kid came home from school excited about a chesed project they\'re doing — I love seeing that spark. The educators in {location} area schools are really doing something special.' },
    { body: 'Carpool coordination is basically a part-time job. Any parents in {location} using an app or group to manage it better? The morning rush is killing me.' },
  ],

  food: [
    { body: 'Made my bubby\'s brisket recipe for the first time in years — turned out exactly right. Some things taste like childhood. {location} ❤️' },
    { body: 'Tried making homemade rugelach this week. Took 3 hours and they were gone in 20 minutes. Worth it? Absolutely. {location}' },
    { body: 'Best kosher pizza in the Five Towns — I need the community\'s honest opinions. Rank your top 3 in the comments. {location} people, let\'s settle this.' },
    { body: 'My butternut squash soup is officially Shabbos-ready. Secret ingredient? A tiny bit of ginger and apple. Game changer. {location} shabbos prep ✅' },
    { body: 'Recommendation for a good kosher sushi place in {location}? Taking the family out this Sunday and everyone is craving something different. Help!' },
    { body: 'First time making gefilte fish from scratch this year. My mother is proud. My husband doesn\'t understand why I didn\'t just buy it. He has a point. 😂 {location}' },
    { body: 'Yom Tov cooking is in full swing 🍲 Made three different kugels this week and I\'m already tired of doing dishes. But the smell of this kitchen — there\'s nothing like it. {location}' },
    { body: 'Who has a go-to cholent recipe they swear by? I\'ve been making the same one for years and want to try something new. {location} crowd — what\'s your secret ingredient?' },
    { body: 'New dairy restaurant opened in {location} and the shakshuka is incredible. Also the cheese pizza. Also the desserts. Basically everything. Go.' },
    { body: 'Hosting 18 people for Shabbos this week. Send help. And maybe extra cholent. 😅 {location}' },
    { body: 'Looking for a good recipe for kokosh cake — my bubby passed away and I\'m trying to recreate her version from memory. Anyone have a classic recipe? {location}' },
    { body: 'Five Towns kosher food scene is genuinely underrated. Had an incredible meal at a new spot in {location} last week. We\'re lucky to live here.' },
  ],

  help: [
    { title: 'Ride to JFK tomorrow morning?', body: 'Anyone driving to JFK from {location} tomorrow between 5-7am? Happy to split an Uber or pay for gas. Early flight — any help appreciated!' },
    { title: 'Looking for a chavrusa', body: 'Just moved to {location} and looking for someone to learn daf yomi with. Available weekday mornings or evenings. In person preferred, Zoom ok too.' },
    { title: 'Borrowing a high chair for Shabbos', body: 'Guests coming with a 1-year-old this Shabbos. Does anyone in {location} have a high chair we can borrow for the weekend? Will return Sunday.' },
    { title: 'Recommendation: frum handyman?', body: 'Looking for a reliable frum handyman in {location} for some small household repairs. Anyone have someone they trust and recommend? Thanks!' },
    { title: 'Anyone have extra Pesach dishes?', body: 'First year keeping two sets for Pesach and we\'re short on some items. Does anyone in {location} have extra Pesach dishes they\'re not using? Happy to buy or borrow.' },
    { title: 'Need a babysitter tonight', body: 'Last minute — does anyone know of a babysitter available tonight in {location}? 7pm–10pm for two kids. Happy to pay well. Please reach out!' },
    { title: 'Dog sitter over Yom Tov?', body: 'Traveling for Yom Tov and need someone to care for our friendly golden retriever in {location}. 3 nights. Happy to compensate. He\'s the best dog ever, I promise.' },
    { title: 'Anyone have a folding table to lend?', body: 'Making a kiddush next Shabbos and need 2 extra folding tables. Can anyone in {location} help? Will return Monday morning. Thank you!' },
    { title: 'Sukkah building help needed', body: 'Could use 1-2 extra sets of hands putting up the sukkah this week. Happy to return the favor — it\'s easier together! {location}' },
    { title: 'Help with shiva meal coordination', body: 'A family in {location} is sitting shiva this week. If anyone wants to coordinate meals or rides, please reach out so we can organize it properly.' },
  ],

  events: [
    { title: 'Torah Shiur — Tuesday Night', body: 'Join us Tuesday evening at 8pm for a shiur on practical halacha in the home. Open to all levels. Light refreshments. {location} community center.' },
    { title: 'Melave Malka This Saturday Night', body: 'Join us Saturday night after Shabbos for a beautiful melave malka in {location}! Live music, hot food, and a chance to extend the Shabbos spirit. All welcome.' },
    { title: "Women's Learning Circle Starting", body: "New women's shiur starting next week in {location}! We'll be studying Pirkei Avos together over 8 sessions. Free to attend. First class is this Thursday." },
    { title: 'Speed Friending — Meet New Neighbors', body: 'New to the {location} area? Join our community "speed friending" evening. Fun, structured, and a great way to meet people you might have never crossed paths with otherwise.' },
    { title: 'Father & Son Learning Event', body: 'Special Sunday morning learning event at the {location} shul. Fathers and sons of all ages welcome. Breakfast included. Starts 9am.' },
    { title: 'Annual Kosher Food Fair', body: "Don't miss the Five Towns kosher food fair in {location}! Local vendors, samples, live demos, and great community energy. Sunday afternoon, all welcome." },
    { title: 'Volunteer Day at the Food Pantry', body: 'Join us this Sunday morning for a community volunteer day at the local food pantry in {location}. Great for families with older kids too. No experience needed.' },
    { title: 'Community Trivia Night', body: 'Jewish trivia night at the {location} shul! Teams of 4, prizes for the winners, tons of laughs. All ages welcome. Register by Wednesday.' },
    { title: "Sisterhood Shabbaton — Women's Weekend", body: "Annual women's Shabbaton filling up fast! A meaningful, fun, and refreshing weekend away. Based out of {location}. Early-bird pricing ends Friday." },
    { title: "Lag B'Omer Bonfire", body: "Annual community Lag B'Omer bonfire in {location}! Bring the family, bring marshmallows, bring your neighbors. Starts at nightfall. All welcome." },
    { title: "Kids' Havdalah Party", body: 'Community kids havdalah party this Saturday night in {location}! Songs, snacks, and fun activities. Ages 3–10. RSVP appreciated but not required.' },
    { title: 'Jewish Book Club Launch', body: 'Starting a monthly Jewish book club in {location}! First read TBD by vote. Open to anyone who loves reading and thoughtful conversation. First meeting next Wednesday.' },
  ],

  simcha: [
    { body: 'Mazel tov to the Stein family on the birth of a baby girl! 🎀 May she be a bracha to the whole family and the {location} community!' },
    { body: 'Mazel tov to our neighbors on their son\'s Bar Mitzvah this Shabbos! 🎉 Watching him lein was incredibly moving. So much nachas. {location} is proud.' },
    { body: 'Big mazel tov to a dear family in {location} — just got engaged! 💍 Wishing them much happiness, a beautiful vort, and a quick l\'chaim!' },
    { body: 'Our daughter finished her last high school exam today! 🎓 Four years flew by. Mazel tov to all the graduates in {location} — the world is yours.' },
    { body: 'Simcha alert 🎊 A longtime {location} family just celebrated their 25th anniversary! We should all be zoche to that kind of love and partnership.' },
    { body: 'Happy to share — my brother just got a new job he\'s been working toward for years 🙏 Sometimes the right things take time. Celebrating in {location} tonight.' },
    { body: 'Mazel tov to the Cohen family — their youngest just made it into her first-choice high school! The relief on that mom\'s face this morning was everything. {location}' },
  ],

  recommendations: [
    { body: 'New to {location} — which shul should I try this Shabbos? Looking for somewhere warm and welcoming with a good kiddush 😄' },
    { body: 'Best pediatrician in the Five Towns area? Just moved to {location} and need recommendations for a great doctor for our three kids.' },
    { body: 'Does anyone have a recommendation for a good frum accountant in {location}? Tax season is coming and I need someone who understands the community nuances.' },
    { body: 'Looking for a dentist in {location} — ideally one who is frum or at least very familiar with the community schedule. Kids and adults. Any recommendations?' },
    { body: 'Best place to buy freshly baked challahs in {location} if you didn\'t make your own? I need a backup plan for the next few weeks.' },
    { body: 'Any recommendations for a florist in {location} for Shabbos flowers? Looking for somewhere that does beautiful arrangements without charging a fortune.' },
    { body: 'Who does everyone use for cleaning help in {location}? Need weekly or biweekly. Reliable and trustworthy is the main thing.' },
    { body: 'Recommendation for a good Jewish summer camp — modern Orthodox, great for teens, reasonably priced? We\'re in the {location} area. Would love honest feedback!' },
  ],

  jobs: [
    { title: 'PT Bookkeeper — Frum Office', body: 'Small frum-owned business in {location} looking for a part-time bookkeeper. Flexible hours, Shabbos and Yom Tov off. QuickBooks experience helpful.' },
    { title: 'Nanny Wanted — 3 Days a Week', body: 'Young family in {location} needs a warm, reliable nanny 3 days/week. Kids ages 2 and 6. Must have experience and references. Great family to work for.' },
    { title: 'Tutoring Opportunity', body: 'Looking for a patient and effective tutor for our 6th grader in {location} — Chumash and Navi. Preferably female, afternoons. Happy to discuss rate.' },
    { title: 'Bar Mitzvah Tutor Needed', body: 'Son is 14 months from his bar mitzvah and we\'re starting prep. Looking for an experienced teacher in {location} who is engaging and warm. Reach out!' },
    { title: 'Shabbos Babysitter Wanted', body: 'Looking for a responsible babysitter in {location} for occasional Shabbos evenings. Kids are great, home is warm. Contact us if interested.' },
    { title: 'Jewish Studies Teacher Opening', body: 'Local school near {location} has an opening for a Judaics teacher, grades 3-5. Must be passionate and experienced. Competitive salary. Apply by end of month.' },
  ],

  housing: [
    { title: '3BR Available — Walking to Shul', body: 'Beautiful 3-bedroom apartment available in {location}. Walking distance to shul and kosher stores. Perfect for a young family. Available next month.' },
    { title: 'Seeking Frum Roommate', body: 'Looking for a frum roommate to share a great apartment in {location}. Large room, fully kosher kitchen, walking distance to shul. Available now.' },
    { title: 'Summer Sublet — {location}', body: 'Going away for the summer and have a 2BR furnished apartment available in {location}. Walking to shul, eruv, everything. Message for details.' },
  ],

  shul: [
    { title: 'New Early Minyan Starting', body: 'Exciting news — a new weekday shacharis minyan is starting in {location} at 6:45am. Perfect for early risers and before-work daveners. All welcome!' },
    { title: "Rabbi's Weekly Parsha Shiur", body: 'Reminder: Thursday night parsha shiur at 8pm. This week\'s topic is always especially relevant — bring a friend. {location} shul.' },
    { title: 'Youth Group Madrichim Needed', body: 'Looking for teen and young adult volunteers to help run Shabbos youth group in {location}. Great experience, great kids, great cause.' },
    { title: 'Chesed Committee Forming', body: "We're launching a new chesed committee at the {location} shul! Looking for people to help coordinate meals, rides, and general community support. Join us." },
    { title: 'High Holiday Mahzorim Available', body: 'We have beautiful new Mahzorim available at the shul in {location} in time for the Yamim Noraim. Contact the office to reserve yours.' },
  ],

  community: [
    { body: 'Just moved to {location} and I\'m blown away by how warm everyone has been. Neighbors brought food, helped us with the kids, showed us around. This is what Jewish community means 🙏' },
    { body: 'Grateful for the {location} community today. When things are hard, people just show up. No questions, no fanfare — just kindness. We\'re lucky to live here.' },
    { body: 'Shoutout to the {location} eruv committee — they check it every week without fail, rain or shine. The unsung heroes of Friday afternoon. Thank you 🙏' },
    { body: 'The chesed in this community never stops amazing me. Someone organized a full meal train for a neighbor in 2 hours this week. {location} is something special.' },
    { body: 'After 7 years in {location}, we\'re moving to a new neighborhood next month. Going to miss this community more than words can express. Keep doing what you do 💙' },
    { body: 'Anyone else feel like they know every family on their block in {location}? That\'s not normal anywhere else in America. It\'s a treasure.' },
  ],
};

// ── Type weights (housing at ~8%, everything else balanced) ──
const TYPE_WEIGHTS = [
  ['shabbat',         14],
  ['torah',           10],
  ['parenting',        9],
  ['food',            10],
  ['help',            10],
  ['events',          12],
  ['simcha',           6],
  ['recommendations',  8],
  ['jobs',             5],
  ['housing',          4],
  ['shul',             6],
  ['community',        6],
];

function pickType(rng) {
  const total = TYPE_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [type, w] of TYPE_WEIGHTS) {
    r -= w;
    if (r <= 0) return type;
  }
  return 'community';
}

function randomFrom(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function randomInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// Spread timestamps across the past 5 days with realistic density
// (more recent = more posts, mimicking real activity)
function generateTimestamp(rng) {
  // Weight toward more recent: square the random so it clusters near 0
  const hoursBack = Math.pow(rng(), 1.5) * 120; // max 5 days
  return new Date(Date.now() - hoursBack * 3600000).toISOString();
}

function generatePost(week, postIndex, existingTitles) {
  // Seed = week * 1000 + postIndex so each week picks different combos
  const rng = seededRandom(week * 1000 + postIndex + 37);

  const type = pickType(rng);
  const templates = POOL[type] || POOL.community;

  // Pick a template deterministically within the week
  const template = templates[Math.floor(rng() * templates.length)];
  const location = randomFrom(LOCATIONS, rng);
  const author = randomFrom(SEED_AUTHORS, rng);
  const streets = ['Oak St', 'Maple Ave', 'Cedar Ln', 'Washington Blvd', 'Main St', 'Park Ave'];

  const title = (template.title || '')
    .replace('{location}', location)
    .replace('{street}', randomFrom(streets, rng));
  const body = template.body
    .replace('{location}', location)
    .replace('{street}', randomFrom(streets, rng));

  if (title && existingTitles.has(title)) return null;

  const boardMap = {
    shabbat: 'feed', torah: 'feed', parenting: 'feed', food: 'feed',
    help: 'help', events: 'events', simcha: 'feed', recommendations: 'feed',
    jobs: 'jobs', housing: 'housing', shul: 'shul', community: 'feed',
  };
  const typeMap = {
    shabbat: 'feed', torah: 'feed', parenting: 'feed', food: 'feed',
    help: 'help', events: 'event', simcha: 'feed', recommendations: 'feed',
    jobs: 'job', housing: 'housing', shul: 'shul', community: 'feed',
  };

  const post = {
    user_id: author.id,
    user_name: author.name,
    type: typeMap[type] || 'feed',
    board: boardMap[type] || 'feed',
    title: title || null,
    body,
    location_text: location,
    city: 'Five Towns',
    is_seeded: true,
    likes_count: randomInt(1, 28, rng),
    comments_count: randomInt(0, 9, rng),
    created_date: generateTimestamp(rng),
  };

  if (['shabbat', 'food'].includes(type)) {
    // Some get a photo
    if (rng() > 0.5) {
      post.image_url = randomFrom(FOOD_IMAGES, rng);
      post.likes_count = randomInt(8, 35, rng);
    }
  }

  if (type === 'events') {
    const future = new Date(Date.now() + randomInt(1, 21, rng) * 86400000);
    post.event_date = future.toISOString().split('T')[0];
    post.event_time = `${randomInt(17, 21, rng)}:00`;
  }

  if (type === 'parenting' || type === 'recommendations' || type === 'community') {
    post.post_subtype = 'question';
  }

  return post;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    // scheduler call — ok
  }

  try {
    const week = weekNumber();
    console.log(`seedFeedPosts: week=${week}`);

    const allPosts = await base44.asServiceRole.entities.UnifiedPost.list('-created_date', 300);
    const realPosts = allPosts.filter(p => !p.is_seeded);
    const seededPosts = allPosts.filter(p => p.is_seeded);

    // Scale down seeded posts as real content grows
    let targetSeeded = 100;
    if (realPosts.length >= 200) targetSeeded = 20;
    else if (realPosts.length >= 100) targetSeeded = 40;
    else if (realPosts.length >= 50) targetSeeded = 60;
    else if (realPosts.length >= 20) targetSeeded = 80;

    // Remove seeded posts older than 5 days (they'll be replaced with this week's set)
    const cutoff = Date.now() - 5 * 86400000;
    const oldSeeded = seededPosts.filter(p => new Date(p.created_date).getTime() < cutoff);
    for (const post of oldSeeded.slice(0, 80)) {
      await base44.asServiceRole.entities.UnifiedPost.delete(post.id);
    }

    const recentSeeded = seededPosts.filter(p => new Date(p.created_date).getTime() >= cutoff);
    const toCreate = Math.max(0, targetSeeded - recentSeeded.length);

    if (toCreate === 0) {
      return Response.json({ ok: true, message: 'Feed is fresh', created: 0, week });
    }

    const existingTitles = new Set(allPosts.map(p => p.title).filter(Boolean));

    // Generate posts using deterministic weekly seed so same week → same pool
    const newPosts = [];
    let attempts = 0;
    const maxIndex = toCreate * 4; // large pool to pick from
    for (let i = 0; newPosts.length < toCreate && i < maxIndex; i++) {
      attempts++;
      const post = generatePost(week, i, existingTitles);
      if (post) {
        if (post.title) existingTitles.add(post.title);
        newPosts.push(post);
      }
    }

    let created = 0;
    for (let i = 0; i < newPosts.length; i += 20) {
      const batch = newPosts.slice(i, i + 20);
      await base44.asServiceRole.entities.UnifiedPost.bulkCreate(batch);
      created += batch.length;
    }

    console.log(`seedFeedPosts done: created=${created}, week=${week}, attempts=${attempts}`);
    return Response.json({ ok: true, created, week, realPosts: realPosts.length, targetSeeded, oldDeleted: oldSeeded.length });
  } catch (error) {
    console.error('seedFeedPosts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});