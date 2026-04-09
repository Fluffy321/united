import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
];

const LOCATIONS = [
  'Lawrence', 'Woodmere', 'Cedarhurst', 'Hewlett', 'Oceanside',
  'Valley Stream', 'Far Rockaway', 'Inwood', 'Five Towns'
];

const SHABBOS_IMAGES = [
  'https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?w=800',
  'https://images.unsplash.com/photo-1600628421055-4d30de868b8f?w=800',
  'https://images.unsplash.com/photo-1551183053-bf91798d792a?w=800',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
];

const POST_TEMPLATES = {
  // Prompts / questions
  prompt: [
    { body: "What's your favorite thing about Shabbos in {location}? 🕍" },
    { body: "Best kept kosher food secret in the Five Towns? Drop your picks below 👇" },
    { body: "How do you get your kids excited for Shabbos? Looking for ideas! 🙏" },
    { body: "What's a dvar Torah or vort that really stuck with you recently?" },
    { body: "Any recommendations for a Friday night shiur in {location}?" },
    { body: "What's your go-to Shabbos meal dish that always impresses guests? 🍽️" },
    { body: "New to {location} — which shul should I try this week?" },
    { body: "What's one act of chesed you've seen lately that inspired you?" },
    { body: "Best place for a Shabbos walk in the Five Towns? 🌳" },
    { body: "Is anyone else doing daf yomi? What masechta are you on?" },
    { body: "What's the best way to find a carpool from {location} to the city?" },
    { body: "Funniest/sweetest thing your kid said at the Shabbos table this week? 😂" },
  ],
  // Photo posts (Shabbos, food)
  photo: [
    { body: "Shabbos table is set 🕯️✨ Wishing everyone in {location} a beautiful Shabbos!" },
    { body: "Made my bubby's cholent recipe for the first time — turned out amazing! 🍲 {location} friends, the secret is the kishka." },
    { body: "Havdalah vibes in {location} 🌟 Such a peaceful end to a beautiful Shabbos." },
    { body: "Homemade challah just came out of the oven 🍞 Happy Friday from {location}!" },
    { body: "Yom Tov prep is no joke but look at this spread 😍 {location} community knows how to do it right." },
    { body: "Friday night dinner with good friends in {location} 💙 Grateful for this community." },
    { body: "This week's Shabbos desserts 🍰🍫 Baked with love in {location}!" },
    { body: "Soup season is here 🥣 My butternut squash soup is ready for Shabbos — {location} friends, wishing you a sweet one!" },
  ],
  help: [
    { title: 'Need a ride to shul this Shabbos', body: 'Looking for someone in {location} who can give me a ride to shul Friday night. I live near {street}. Any help would be amazing!' },
    { title: 'Anyone have a folding table to borrow?', body: 'Making a kiddush next Shabbos and need 2-3 extra folding tables. Can anyone in {location} help? Will return right after.' },
    { title: 'Looking for a chavrusa for daf yomi', body: 'Just started daf yomi and looking for someone in {location} to learn with, either in person or on Zoom. Available evenings.' },
    { title: 'Need babysitter for Yom Tov', body: 'Looking for a responsible babysitter in {location} for upcoming Yom Tov. Two kids ages 4 and 7. Please reach out if interested!' },
    { title: 'Can anyone watch my dog over Pesach?', body: 'Traveling for Pesach and need someone to care for my friendly labradoodle. Based in {location}. Happy to pay or trade favors.' },
    { title: 'Anyone know a good frum plumber?', body: 'Dealing with a leaky faucet in {location} and need a recommendation for a reliable, frum plumber. Any suggestions welcome!' },
    { title: 'Borrowing a high chair for Shabbos guests', body: 'Having guests with a toddler this Shabbos — does anyone in {location} have a high chair we can borrow for the weekend?' },
    { title: 'Help moving boxes this Sunday', body: 'Moving to a new apartment in {location} this Sunday and could use a few extra hands for 2-3 hours. Will provide pizza and drinks!' },
  ],
  event: [
    { title: 'Shiur on Hilchos Shabbos — Tuesday Night', body: 'Join us Tuesday evening for an engaging shiur on practical Hilchos Shabbos at the {location} community center. All levels welcome. 8:00 PM.' },
    { title: 'Community Melave Malka this Saturday Night', body: 'Join us after Shabbos for a beautiful Melave Malka in {location}! Live music, great food, and a chance to connect with neighbors.' },
    { title: "Women's Learning Circle — New Session Starting", body: "A new women's learning group is starting in {location}! We'll be studying Pirkei Avos together. First class is free. Come join!" },
    { title: 'Purim Costume Exchange Event', body: 'Bring your gently used costumes and swap for something new! Free event at the {location} JCC. Great way to save money and go green.' },
    { title: "Kids' Tu B'Shvat Seder — Sunday Afternoon", body: "Bring the family to our Tu B'Shvat Seder for kids in {location}! Fun activities, fruits, and songs. Ages 3-10 welcome." },
    { title: 'Chessed Network Monthly Volunteer Meeting', body: 'All volunteers and interested community members are invited to our monthly meeting in {location}. Come hear updates and sign up for upcoming opportunities.' },
    { title: 'Speed Friending — Meet New Neighbors!', body: 'New to the {location} area? Join our "speed friending" event — 5 minutes with 12 different neighbors. Fun, easy, and you might make a lifelong friend!' },
    { title: "Lag B'Omer Bonfire at the Park", body: "Annual Lag B'Omer bonfire in {location}! Bring marshmallows, bring your kids, bring your neighbors. Starts at nightfall. All welcome!" },
    { title: 'Free Community Yoga — Tznius-Friendly', body: "Women's outdoor yoga session this Sunday morning in {location}. Free and open to all. Bring a mat and a smile!" },
    { title: 'Father & Son Learning Event', body: 'Special Sunday morning father & son learning event at the {location} shul. Breakfast included. All ages welcome.' },
    { title: 'Kosher Food Fair Coming to Five Towns!', body: "Don't miss the annual kosher food fair in {location}! Local vendors, samples, live music, and more. Sunday afternoon, all welcome." },
    { title: "Sisterhood Shabbaton — Women's Weekend Retreat", body: "Calling all women! Our annual Shabbaton is filling up fast. Join us for a meaningful and fun weekend in {location}. Early-bird pricing ends soon." },
  ],
  job: [
    { title: 'PT Bookkeeper Needed — Frum Office', body: 'Small frum-owned business in {location} is looking for a part-time bookkeeper. Flexible hours, Shabbos/Yom Tov off. QuickBooks experience preferred.' },
    { title: 'Looking for a Jewish Studies Teacher', body: 'Local day school near {location} has an opening for a Judaics teacher (grades 4-6). Must be dynamic and engaging. Competitive salary.' },
    { title: 'Nanny Wanted — Two Days a Week', body: 'Young family in {location} needs a reliable nanny 2 days/week. Kids ages 2 and 5. Must be warm, patient, and frum. References required.' },
    { title: 'Driver Needed for After-School Carpool', body: 'Looking for a responsible driver in {location} for a 3-day/week carpool. Kids are 8-12 years old. Must have clean record. Paid position.' },
    { title: 'Kosher Catering Business Hiring', body: 'Growing kosher catering company in {location} is hiring prep cooks and servers for events. Evening/weekend work. Great team environment.' },
    { title: 'Tutor Wanted for Bar Mitzvah Prep', body: "Our son is a year out from his bar mitzvah and we're looking for an experienced tutor in {location}. Please reach out if interested." },
  ],
  // Reduced housing templates (fewer options = naturally less frequent)
  housing: [
    { title: 'Beautiful 3BR Apartment Available in {location}', body: 'Spacious 3-bedroom apartment available in the heart of {location}. Walking distance to shul and kosher stores. Perfect for young family.' },
    { title: 'Seeking Frum Roommate — Large Room Available', body: 'Looking for a frum roommate to share a great apartment in {location}. Large bedroom, kosher kitchen, walking distance to shul. Available now.' },
    { title: 'Summer Sublet Available — {location}', body: 'Going away for the summer and have a fully furnished 2BR apartment available in {location}. Walking to shul. Looking for responsible tenants.' },
  ],
  shul: [
    { title: 'New Minyan Starting in {location}', body: 'Exciting news — a new early minyan is starting at the {location} shul! Shacharis at 6:45 AM on weekdays. All are welcome to join us.' },
    { title: "Rabbi's Weekly Parsha Shiur", body: "Join our rabbi every Thursday night at 8 PM for an engaging shiur on the weekly parsha. Free and open to the community in {location}." },
    { title: 'Youth Group Volunteers Needed', body: 'Our youth group in {location} is looking for madrichim and volunteers for Shabbos programming. Great opportunity for teens and young adults.' },
    { title: 'Chesed Committee Forming — Join Us!', body: "We're forming a new chesed committee at our shul in {location}. Looking for people to help coordinate meal trains, rides, and more." },
  ],
  news: [
    { title: 'New Kosher Restaurant Opening in {location}', body: 'Exciting news for the kosher food scene! A new dairy restaurant is opening in {location} next month. Menu previews look amazing — full details coming soon.' },
    { title: 'Community Eruv Updated After Storm', body: "Important update for {location}: The eruv was checked and repaired following this week's storm. Please check your local eruv status before Shabbos." },
    { title: 'Day School Enrollment Open for Next Year', body: 'Registration for the upcoming school year at the {location} area day school is now open. Spaces are limited — register early to secure your spot.' },
    { title: 'Five Towns Kosher Market Expanding', body: 'Great news — the beloved local kosher market in {location} is expanding its prepared foods section. New hot bar and more options coming this spring.' },
  ],
  feed: [
    { title: 'Shout out to the {location} community!', body: "Just moved to {location} and I'm blown away by how warm and welcoming everyone has been. So grateful to be part of this community!" },
    { title: 'Best kosher restaurant in the Five Towns?', body: "New to the area and looking for the best spots to eat. What are everyone's favorites? Drop your recommendations below!" },
    { title: 'Amazing dvar Torah from this Shabbos', body: 'Heard a beautiful vort about emunah this Shabbos in {location}. Wanted to share because it really stuck with me — happy to share if anyone wants to hear it.' },
    { title: 'Grateful for this community 🙏', body: 'After a tough week, several neighbors in {location} showed up with meals, babysitting, and kind words. This is what the Five Towns is all about.' },
    { title: 'Looking for a Pesach seder invitation', body: "First year in {location} and will be alone for the second seder. If anyone has room at their table, I would be so grateful. Happy to bring a dish!" },
  ],
};

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTimestamp(hoursBack) {
  const now = Date.now();
  const offset = Math.random() * hoursBack * 60 * 60 * 1000;
  return new Date(now - offset).toISOString();
}

function generatePost(existingTitles) {
  const types = ['help', 'event', 'job', 'housing', 'shul', 'news', 'feed', 'prompt', 'photo'];
  // Rebalanced: more prompts, photos, events; less housing
  const weights =    [18,    20,     10,   5,        8,     8,     10,    13,       8];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  let type = types[0];
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand <= 0) { type = types[i]; break; }
  }

  const templates = POST_TEMPLATES[type] || POST_TEMPLATES.feed;
  const template = randomFrom(templates);
  const location = randomFrom(LOCATIONS);
  const author = randomFrom(SEED_AUTHORS);
  const streets = ['Oak St', 'Maple Ave', 'Cedar Ln', 'Washington Blvd', 'Main St', 'Park Ave'];

  const title = (template.title || '').replace('{location}', location).replace('{street}', randomFrom(streets));
  const body = template.body.replace('{location}', location).replace('{street}', randomFrom(streets));

  // Skip duplicate titled posts
  if (title && existingTitles.has(title)) return null;

  const boardMap = {
    help: 'help', event: 'events', job: 'jobs',
    housing: 'housing', shul: 'shul', news: 'feed', feed: 'feed',
    prompt: 'feed', photo: 'feed'
  };

  const postType = (type === 'prompt' || type === 'photo') ? 'feed' : type;

  const post = {
    user_id: author.id,
    user_name: author.name,
    type: postType,
    board: boardMap[type] || 'feed',
    title: title || null,
    body,
    location_text: location,
    city: 'Five Towns',
    is_seeded: true,
    likes_count: randomInt(0, 18),
    comments_count: randomInt(0, 7),
    created_date: randomTimestamp(72),
  };

  if (type === 'prompt') {
    post.post_subtype = 'question';
  }

  if (type === 'photo') {
    post.image_url = randomFrom(SHABBOS_IMAGES);
    post.likes_count = randomInt(5, 30);
  }

  if (type === 'event') {
    const future = new Date(Date.now() + randomInt(1, 14) * 24 * 60 * 60 * 1000);
    post.event_date = future.toISOString().split('T')[0];
    post.event_time = `${randomInt(18, 21)}:00`;
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
    // called from scheduler — ok
  }

  try {
    const allPosts = await base44.asServiceRole.entities.UnifiedPost.list('-created_date', 200);
    const realPosts = allPosts.filter(p => !p.is_seeded);
    const seededPosts = allPosts.filter(p => p.is_seeded);

    let targetSeeded = 100;
    if (realPosts.length >= 200) targetSeeded = 20;
    else if (realPosts.length >= 100) targetSeeded = 40;
    else if (realPosts.length >= 50) targetSeeded = 60;
    else if (realPosts.length >= 20) targetSeeded = 80;

    const cutoff = Date.now() - 72 * 60 * 60 * 1000;
    const oldSeeded = seededPosts.filter(p => new Date(p.created_date).getTime() < cutoff);
    for (const post of oldSeeded.slice(0, 50)) {
      await base44.asServiceRole.entities.UnifiedPost.delete(post.id);
    }

    const recentSeeded = seededPosts.filter(p => new Date(p.created_date).getTime() >= cutoff);
    const toCreate = Math.max(0, targetSeeded - recentSeeded.length);

    if (toCreate === 0) {
      return Response.json({ ok: true, message: 'Feed already has sufficient seeded posts', created: 0 });
    }

    const existingTitles = new Set(allPosts.map(p => p.title).filter(Boolean));

    const newPosts = [];
    let attempts = 0;
    while (newPosts.length < toCreate && attempts < toCreate * 3) {
      attempts++;
      const post = generatePost(existingTitles);
      if (post) {
        if (post.title) existingTitles.add(post.title);
        newPosts.push(post);
      }
    }

    let created = 0;
    const batchSize = 20;
    for (let i = 0; i < newPosts.length; i += batchSize) {
      const batch = newPosts.slice(i, i + batchSize);
      await base44.asServiceRole.entities.UnifiedPost.bulkCreate(batch);
      created += batch.length;
    }

    return Response.json({ ok: true, created, realPosts: realPosts.length, targetSeeded, oldDeleted: oldSeeded.length });
  } catch (error) {
    console.error('seedFeedPosts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});