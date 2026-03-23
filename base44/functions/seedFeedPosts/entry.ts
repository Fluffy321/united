import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Seed accounts to author posts
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

const POST_TEMPLATES = {
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
    { title: 'Women\'s Learning Circle — New Session Starting', body: 'A new women\'s learning group is starting in {location}! We\'ll be studying Pirkei Avos together. First class is free. Come join!' },
    { title: 'Purim Costume Exchange Event', body: 'Bring your gently used costumes and swap for something new! Free event at the {location} JCC. Great way to save money and go green.' },
    { title: 'Kids\' Tu B\'Shvat Seder — Sunday Afternoon', body: 'Bring the family to our Tu B\'Shvat Seder for kids in {location}! Fun activities, fruits, and songs. Ages 3-10 welcome.' },
    { title: 'Chessed Network Monthly Volunteer Meeting', body: 'All volunteers and interested community members are invited to our monthly meeting in {location}. Come hear updates and sign up for upcoming opportunities.' },
    { title: 'Speed Friending — Meet New Neighbors!', body: 'New to the {location} area? Join our "speed friending" event — 5 minutes with 12 different neighbors. Fun, easy, and you might make a lifelong friend!' },
    { title: 'Lag B\'Omer Bonfire at the Park', body: 'Annual Lag B\'Omer bonfire in {location}! Bring marshmallows, bring your kids, bring your neighbors. Starts at nightfall. All welcome!' },
  ],
  job: [
    { title: 'PT Bookkeeper Needed — Frum Office', body: 'Small frum-owned business in {location} is looking for a part-time bookkeeper. Flexible hours, Shabbos/Yom Tov off. QuickBooks experience preferred.' },
    { title: 'Looking for a Jewish Studies Teacher', body: 'Local day school near {location} has an opening for a Judaics teacher (grades 4-6). Must be dynamic and engaging. Competitive salary.' },
    { title: 'Nanny Wanted — Two Days a Week', body: 'Young family in {location} needs a reliable nanny 2 days/week. Kids ages 2 and 5. Must be warm, patient, and frum. References required.' },
    { title: 'Real Estate Agent Partner Opportunity', body: 'Established frum real estate agent in {location} area is looking for a motivated partner. Flexible hours, great earning potential.' },
    { title: 'Driver Needed for After-School Carpool', body: 'Looking for a responsible driver in {location} for a 3-day/week carpool. Kids are 8-12 years old. Must have clean record. Paid position.' },
    { title: 'Kosher Catering Business Hiring', body: 'Growing kosher catering company in {location} is hiring prep cooks and servers for events. Evening/weekend work. Great team environment.' },
    { title: 'Tutor Wanted for Bar Mitzvah Prep', body: 'Our son is a year out from his bar mitzvah and we\'re looking for an experienced tutor in {location}. Please reach out if interested.' },
    { title: 'Social Media Manager for Frum Brand', body: 'Growing frum lifestyle brand is looking for a creative social media manager. Remote work, flexible hours. Experience with Instagram preferred.' },
  ],
  housing: [
    { title: 'Beautiful 3BR Apartment Available in {location}', body: 'Spacious 3-bedroom apartment available in the heart of {location}. Walking distance to shul and kosher stores. Perfect for young family.' },
    { title: 'Seeking Frum Roommate — Large Room Available', body: 'Looking for a frum roommate to share a great apartment in {location}. Large bedroom, kosher kitchen, walking distance to shul. Available now.' },
    { title: 'Summer Sublet Available — {location}', body: 'Going away for the summer and have a fully furnished 2BR apartment available in {location}. Walking to shul. Looking for responsible tenants.' },
    { title: 'Looking to Rent a House in Five Towns', body: 'Young family looking to rent a 4-bedroom house in {location} or nearby area. Frum, quiet, excellent references. Flexible on price for the right place.' },
    { title: 'Condo For Sale — Great Location', body: '2BR condo for sale in {location}. Updated kitchen, in-unit laundry, near shul and school. Great starter home for young couple.' },
    { title: 'Short-Term Housing Needed — Pesach Break', body: 'Family of 5 looking for short-term housing in {location} area over Pesach break. Prefer kosher-for-Pesach kitchen. Will pay fair rate.' },
    { title: 'Studio Available — Walking Distance to Shul', body: 'Cozy studio apartment available immediately in {location}. Ideal for a single or couple. Walking distance to multiple shuls.' },
  ],
  shul: [
    { title: 'New Minyan Starting in {location}', body: 'Exciting news — a new early minyan is starting at the {location} shul! Shacharis at 6:45 AM on weekdays. All are welcome to join us.' },
    { title: 'Kiddush Sponsorship Available for Parshas Beshalach', body: 'Looking to sponsor the kiddush at our shul in {location} in memory of a loved one or for a simcha? Contact the office for details.' },
    { title: 'Rabbi\'s Weekly Parsha Shiur', body: 'Join our rabbi every Thursday night at 8 PM for an engaging shiur on the weekly parsha. Free and open to the community in {location}.' },
    { title: 'Shul Dinner Early-Bird Pricing Ending Soon', body: 'Don\'t miss early-bird pricing for our annual gala dinner in {location}! Great entertainment, great food, great cause. Reserve your seats today.' },
    { title: 'Youth Group Volunteers Needed', body: 'Our youth group in {location} is looking for madrichim and volunteers for Shabbos programming. Great opportunity for teens and young adults.' },
    { title: 'Chesed Committee Forming — Join Us!', body: 'We\'re forming a new chesed committee at our shul in {location}. Looking for people to help coordinate meal trains, rides, and more.' },
    { title: 'New Member Welcome Shabbaton', body: 'All new members and prospective members of our community in {location} are invited to a special welcome Shabbaton. RSVP to reserve your spot.' },
  ],
  news: [
    { title: 'New Kosher Restaurant Opening in {location}', body: 'Exciting news for the kosher food scene! A new dairy restaurant is opening in {location} next month. Menu previews look amazing — full details coming soon.' },
    { title: 'Community Eruv Updated After Storm', body: 'Important update for {location}: The eruv was checked and repaired following this week\'s storm. Please check your local eruv status before Shabbos.' },
    { title: 'New Mikva Hours Starting This Month', body: 'The local mikva in {location} has updated its hours. New schedule is now available on their website. Please plan accordingly.' },
    { title: 'Day School Enrollment Open for Next Year', body: 'Registration for the upcoming school year at the {location} area day school is now open. Spaces are limited — register early to secure your spot.' },
    { title: 'Five Towns Kosher Market Expanding', body: 'Great news — the beloved local kosher market in {location} is expanding its prepared foods section. New hot bar and more options coming this spring.' },
    { title: 'Community Hatzalah Fundraiser Update', body: 'Thank you to everyone who supported the Hatzalah fundraiser in {location}! We exceeded our goal thanks to the incredible generosity of our community.' },
  ],
  feed: [
    { title: 'Shout out to the {location} community!', body: 'Just moved to {location} and I\'m blown away by how warm and welcoming everyone has been. So grateful to be part of this community!' },
    { title: 'Best kosher restaurant in the Five Towns?', body: 'New to the area and looking for the best spots to eat. What are everyone\'s favorites? Drop your recommendations below!' },
    { title: 'Reminder: Zmanim change next week', body: 'Heads up to everyone in {location} — zmanim are shifting significantly next week. Make sure to check your zmanim app for updated candle lighting times.' },
    { title: 'Anyone else loving this weather?', body: 'Finally getting some sunshine in {location}! Perfect weather for a walk to shul. Hope everyone is having a beautiful day!' },
    { title: 'Looking for a Pesach seder invitation', body: 'First year in {location} and will be alone for the second seder. If anyone has room at their table, I would be so grateful. Happy to bring a dish!' },
    { title: 'Amazing dvar Torah from this Shabbos', body: 'Heard a beautiful vort about emunah this Shabbos in {location}. Wanted to share because it really stuck with me — happy to share if anyone wants to hear it.' },
    { title: 'Grateful for this community 🙏', body: 'After a tough week, several neighbors in {location} showed up with meals, babysitting, and kind words. This is what the Five Towns is all about.' },
    { title: 'Lost: Blue kippah near {location} park', body: 'Lost my father\'s blue knit kippah somewhere near the park in {location}. It has sentimental value. Please message me if you\'ve seen it!' },
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
  const types = ['help', 'event', 'job', 'housing', 'shul', 'news', 'feed'];
  // Weight distribution: more general/help posts
  const weights = [20, 15, 15, 15, 10, 10, 15];
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
  const title = template.title
    .replace('{location}', location)
    .replace('{street}', randomFrom(streets));
  const body = template.body
    .replace('{location}', location)
    .replace('{street}', randomFrom(streets));

  // Skip if title already exists
  if (existingTitles.has(title)) return null;

  const boardMap = {
    help: 'help', event: 'events', job: 'jobs',
    housing: 'housing', shul: 'shul', news: 'feed', feed: 'feed'
  };

  const post = {
    user_id: author.id,
    user_name: author.name,
    type,
    board: boardMap[type] || 'feed',
    title,
    body,
    location_text: location,
    city: 'Five Towns',
    is_seeded: true,
    likes_count: randomInt(0, 18),
    comments_count: randomInt(0, 7),
    created_date: randomTimestamp(72),
  };

  // Add event-specific fields
  if (type === 'event') {
    const future = new Date(Date.now() + randomInt(1, 14) * 24 * 60 * 60 * 1000);
    post.event_date = future.toISOString().split('T')[0];
    const hours = randomInt(18, 21);
    post.event_time = `${hours}:00`;
  }

  return post;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow scheduled invocation (no user) OR admin user
  let isScheduled = false;
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    // No user = called from scheduler
    isScheduled = true;
  }

  try {
    // Count real posts to determine seeding volume
    const allPosts = await base44.asServiceRole.entities.UnifiedPost.list('-created_date', 200);
    const realPosts = allPosts.filter(p => !p.is_seeded);
    const seededPosts = allPosts.filter(p => p.is_seeded);

    // Scale down seeding as real posts grow
    let targetSeeded = 100;
    if (realPosts.length >= 200) targetSeeded = 20;
    else if (realPosts.length >= 100) targetSeeded = 40;
    else if (realPosts.length >= 50) targetSeeded = 60;
    else if (realPosts.length >= 20) targetSeeded = 80;

    // Remove old seeded posts beyond 72 hours to keep feed fresh
    const cutoff = Date.now() - 72 * 60 * 60 * 1000;
    const oldSeeded = seededPosts.filter(p => new Date(p.created_date).getTime() < cutoff);
    for (const post of oldSeeded.slice(0, 50)) {
      await base44.asServiceRole.entities.UnifiedPost.delete(post.id);
    }

    // Count recent seeded posts (within 72h)
    const recentSeeded = seededPosts.filter(p => new Date(p.created_date).getTime() >= cutoff);
    const toCreate = Math.max(0, targetSeeded - recentSeeded.length);

    if (toCreate === 0) {
      return Response.json({ ok: true, message: 'Feed already has sufficient seeded posts', created: 0 });
    }

    // Build title dedup set
    const existingTitles = new Set(allPosts.map(p => p.title).filter(Boolean));

    // Generate posts
    const newPosts = [];
    let attempts = 0;
    while (newPosts.length < toCreate && attempts < toCreate * 3) {
      attempts++;
      const post = generatePost(existingTitles);
      if (post) {
        existingTitles.add(post.title);
        newPosts.push(post);
      }
    }

    // Insert in batches of 20
    let created = 0;
    const batchSize = 20;
    for (let i = 0; i < newPosts.length; i += batchSize) {
      const batch = newPosts.slice(i, i + batchSize);
      await base44.asServiceRole.entities.UnifiedPost.bulkCreate(batch);
      created += batch.length;
    }

    return Response.json({
      ok: true,
      created,
      realPosts: realPosts.length,
      targetSeeded,
      oldDeleted: oldSeeded.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});