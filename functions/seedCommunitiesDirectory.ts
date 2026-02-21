import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── SEED DATA ───────────────────────────────────────────────────────────────

const CITIES = [
  { city: 'New York', neighborhoods: ['Upper West Side', 'Washington Heights', 'Flatbush', 'Borough Park', 'Crown Heights', 'Riverdale', 'Kew Gardens Hills', 'Forest Hills', 'Great Neck'] },
  { city: 'New Jersey', neighborhoods: ['Teaneck', 'Englewood', 'Lakewood', 'Passaic', 'Bergenfield', 'Paramus', 'Fair Lawn', 'Livingston', 'West Orange'] },
  { city: 'Miami', neighborhoods: ['Bal Harbour', 'Surfside', 'Aventura', 'North Miami Beach', 'Boca Raton', 'Hollywood', 'Hallandale', 'Sunny Isles'] },
  { city: 'Los Angeles', neighborhoods: ['Pico-Robertson', 'Hancock Park', 'Beverly Hills', 'Valley Village', 'Encino', 'Tarzana', 'Westwood', 'Beverlywood'] },
  { city: 'Chicago', neighborhoods: ['West Rogers Park', 'Skokie', 'Lincolnwood', 'Morton Grove', 'Buffalo Grove', 'Northbrook'] },
  { city: 'Toronto', neighborhoods: ['Thornhill', 'North York', 'Lawrence Park', 'Bayside', 'Vaughan', 'Markham'] },
  { city: 'London', neighborhoods: ['Golders Green', 'Stamford Hill', 'Edgware', 'Hendon', 'Finchley', 'Temple Fortune', 'Borehamwood'] },
  { city: 'Jerusalem', neighborhoods: ['Rechavia', 'Katamon', 'Geula', 'Mea Shearim', 'Ramot', 'Ramat Eshkol', 'Talpiot'] },
  { city: 'Tel Aviv', neighborhoods: ['Ramat Aviv', 'Dizengoff', 'Florentin', 'Neve Tzedek', 'Ramat Gan', 'Bnei Brak'] },
  { city: 'Five Towns', neighborhoods: ['Lawrence', 'Cedarhurst', 'Woodmere', 'Hewlett', 'Inwood'] },
];

const SHUL_NAMES = [
  'Congregation Beth Israel', 'Young Israel of {n}', 'Congregation Shaarei Torah',
  'Congregation Beit Yosef', 'Kehillas {n}', 'Congregation Ohel Moshe',
  'Congregation Ahavas Yisroel', 'Congregation Ohr HaChaim', 'Congregation Kol Torah',
  'Beit Knesset {n}', 'Congregation Bais Ephraim', 'Congregation Tifereth Israel',
  'Congregation Shaarei Rachamim', 'Congregation Beis Tefila', 'Congregation Adas Israel',
  'Congregation Shaarei Orah', 'Congregation Mishkan Yaakov', 'Congregation Aish Kodesh',
  'Kehillas Beis Avrohom', 'Congregation Zichron Dovid', 'Young Israel of {n} Heights',
  "Or Chadash Congregation", 'Congregation Reishis Chochma', 'Congregation Shaar HaShamayim',
  'Agudath Israel of {n}', 'The {n} Minyan', 'Beit Knesset HaGra', 'Congregation Ohr Shraga',
];

const SCHOOL_NAMES = [
  'Hebrew Academy of {n}', 'Torah Day School of {n}', 'Yeshiva of {n}',
  'Jewish Community Day School', 'Beit Rivkah School', 'Beis Yaakov of {n}',
  '{n} Jewish Academy', 'Hillel Academy', 'Torah Institute of {n}',
  'Maimonides Day School', 'Rambam Academy', 'Bnos Beis Yaakov',
  'Yeshiva Darchei Torah', 'Torah Temimah Elementary', 'Shulamith School',
  'Ohr Torah Day School', 'Ezra Academy', 'RASG Hebrew Academy',
];

const YESHIVA_NAMES = [
  'Yeshivas Ohr Elchonon', 'Mesivta of {n}', 'Yeshiva Gedola of {n}',
  'Beis Medrash of {n}', 'Kollel Beis HaTalmud', 'Yeshivas Bircas Mordechai',
  'Zichron Meir Yeshiva', 'Yeshivas Mir {n}', 'Yeshiva Ketana of {n}',
  'Mesivtha Tifereth Jerusalem', 'Beis HaMidrash of {n}', 'Kollel Torah Mitzion',
  'Yeshivas Chofetz Chaim', 'Ner Israel of {n}',
];

const SEMINARY_NAMES = [
  'Bais Yaakov Seminary of {n}', '{n} Seminary for Women', 'Machon Chaya',
  'Ateres Bais Yaakov', "Bnos Chava Seminary", 'Torah Academy Seminary',
  'Beis Leah Seminary', 'Ohr Sarah Seminary',
];

const ORG_NAMES = [
  'Jewish Federation of {n}', 'Bikur Cholim of {n}', 'AMIT {n} Chapter',
  'Hatzalah of {n}', 'Tomchei Shabbos {n}', 'Chabad of {n}',
  'Aish HaTorah {n}', 'NCSY {n} Region', 'JCC of {n}',
  'Friendship Circle of {n}', 'HASC Center', 'Bnei Akiva of {n}',
  'Emunah of {n}', 'Wizo {n}', 'ORT {n}', 'Jewish Outreach Network {n}',
];

// Real domains whose Clearbit logos are known to resolve, mapped by community name fragment
const KNOWN_LOGO_DOMAINS = {
  'Chabad':    'chabad.org',
  'Aish':      'aish.com',
  'NCSY':      'ncsy.org',
  'JCC':       'jcc.org',
  'Hatzalah':  'hatzalah.org',
  'HASC':      'hasc.org',
  'Bnei Akiva':'bneiakiva.org',
  'ORT':       'ort.org',
};

function getClearbitLogo(name) {
  for (const [key, domain] of Object.entries(KNOWN_LOGO_DOMAINS)) {
    if (name.includes(key)) return `https://logo.clearbit.com/${domain}`;
  }
  return null;
}

const SHUL_DESCS = [
  'A warm and welcoming Orthodox congregation with daily minyanim and engaging shiurim for all levels.',
  'Vibrant Modern Orthodox shul fostering a strong sense of community through Torah learning and chesed.',
  'Traditional congregation serving the community with Shabbat programming, youth groups, and adult education.',
  'Close-knit kehilla with a focus on joyful, meaningful tefillah and strong social connections.',
  'Dynamic shul with diverse membership offering everything from beginner classes to advanced chavrusos.',
  'Established congregation providing spiritual leadership and community programming for over 50 years.',
  'Progressive Orthodox community blending traditional davening with modern relevance and inclusivity.',
  'Family-oriented shul with active Shabbos youth program, weeknight shiurim, and holiday events.',
  'A spiritual home built on Torah values with an emphasis on warmth, growth, and community involvement.',
  'Sephardic congregation maintaining rich minhagim while creating meaningful modern Jewish experiences.',
];

const SCHOOL_DESCS = [
  'Providing students with a dual-curriculum education combining rigorous Torah studies and academic excellence.',
  'Nurturing the whole child through Jewish values, strong secular academics, and extracurricular enrichment.',
  'A coeducational Jewish day school preparing students for lives of Torah observance and professional success.',
  'Dedicated to developing future Jewish leaders through integrated religious and general studies.',
  'Girls school committed to bnos Yisroel development through Torah, midot, and academic achievement.',
  'Building strong Jewish identity alongside a college-prep curriculum that opens doors to top universities.',
];

const YESHIVA_DESCS = [
  'Advanced Torah learning program for post-high school students in a warm and structured beit midrash environment.',
  'Kollel dedicated to in-depth Talmud study and halacha with a community outreach component.',
  'Mesivta combining intensive limudei kodesh with a strong secular program preparing students for higher education.',
  'Elite yeshiva gedola where serious bochurim can reach their potential in Torah scholarship.',
];

const SEMINARY_DESCS = [
  'Year-in-Israel program helping young women deepen their connection to Torah, mitzvot, and Jewish identity.',
  'Comprehensive seminary experience combining halacha, Jewish philosophy, and practical life skills.',
  'Inspiring post-high school program for young women through meaningful Torah learning and character development.',
];

const ORG_DESCS = [
  'Providing essential social services, food assistance, and community support to Jewish families in need.',
  'Connecting Jewish youth to their heritage through engaging programming, travel, and leadership development.',
  'Chesed organization dedicated to supporting the sick, elderly, and vulnerable members of our community.',
  'Building vibrant Jewish life through educational programs, cultural events, and community advocacy.',
  'Outreach organization bringing Jews of all backgrounds closer to their heritage with warmth and no judgment.',
  'Community resource center offering counseling, financial assistance, and social programming year-round.',
];

const UPCOMING_EVENTS = [
  { title: 'Shabbaton Weekend', body: 'Join us for a community Shabbaton with special guests, inspiring davening, and delicious meals. All are welcome!' },
  { title: 'Guest Speaker: Rabbi Yisroel Reisman', body: 'A special shiur on contemporary halacha questions. Light refreshments will be served.' },
  { title: 'Annual Chesed Drive', body: 'Help us collect food and clothing for families in need. Drop-off locations available throughout the week.' },
  { title: 'Youth Shabbos Program', body: 'Exciting activities, divrei Torah, and prizes for kids ages 5–12 this Shabbos morning.' },
  { title: 'Melave Malka & Kumzits', body: 'End Shabbos beautifully with live music, singing, and a warm atmosphere. Motzei Shabbos at 9pm.' },
  { title: 'Annual Dinner & Gala', body: 'Celebrate our community\'s achievements at our annual fundraising dinner. Formal attire requested.' },
  { title: 'Learning Together: Siyum HaShas', body: 'Join us as we complete a mesechta together and celebrate Jewish learning with the whole community.' },
  { title: 'Women\'s Morning Shiur', body: 'Weekly Torah class for women covering parsha, halacha, and Jewish philosophy. Coffee and refreshments provided.' },
  { title: 'Teen Volunteers Recruitment', body: 'High school students: join our volunteer program and earn community service hours while making a difference.' },
  { title: 'Summer Camp Fair', body: 'Meet representatives from top Jewish summer camps and find the perfect program for your children.' },
  { title: 'Purim Carnival & Seudah', body: 'Family-friendly Purim celebration with games, costumes, prizes, and a community seudah.' },
  { title: 'Sukkos Lulav & Etrog Sale', body: 'Premium species available. Pre-order for the best selection. Delivery options available.' },
];

const SAMPLE_POSTS = [
  { title: 'Weekly Bulletin', body: 'This week\'s davening schedule: Shacharis 7:00am & 8:30am | Mincha 1:15pm | Maariv 8:45pm. Shabbos candle lighting at the listed time on your local calendar.' },
  { title: 'Upcoming Shiur', body: 'Join us Tuesday evenings at 8:30pm for an in-depth halacha shiur. All levels welcome. Light refreshments served.' },
  { title: 'Community Announcement', body: 'We are pleased to welcome a new family to our kehilla. Please join us in making them feel at home.' },
  { title: 'Volunteer Opportunity', body: 'We need volunteers for our weekly Bikur Cholim and Tomchei Shabbos programs. Please reach out to the office.' },
  { title: 'Youth Program Update', body: 'Registration is now open for our youth groups. Spaces are limited — sign up early to secure your child\'s spot.' },
  { title: 'Mazal Tov!', body: 'Mazal tov to our community members on their simchos! May they share many happy occasions with us.' },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function makeName(templates, neighborhood) {
  const tpl = pick(templates);
  return tpl.replace('{n}', neighborhood);
}

function futureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const volumeCommunities = body.volumeCommunities || 200;
    const volumePostsPerCommunity = body.volumePostsPerCommunity || 3;
    const volumeEventsPerCommunity = body.volumeEventsPerCommunity || 2;
    const clearSeeded = body.clearSeeded || false;

    // Optional: clear previous seeded data
    if (clearSeeded) {
      const existing = await base44.asServiceRole.entities.Community.list('-created_date', 2000);
      const seeded = existing.filter(c => c.is_seeded);
      for (const c of seeded) {
        await base44.asServiceRole.entities.Community.delete(c.id);
      }
    }

    // Check what already exists to avoid dupes
    const existingCommunities = await base44.asServiceRole.entities.Community.list('-created_date', 2000);
    const existingNames = new Set(existingCommunities.map(c => c.name));

    const createdCommunities = [];
    let commCount = 0;

    // Generate communities across cities
    for (const { city, neighborhoods } of CITIES) {
      if (commCount >= volumeCommunities) break;

      for (const neighborhood of neighborhoods) {
        if (commCount >= volumeCommunities) break;

        // Generate a mix of types per neighborhood
        const entries = [
          { names: SHUL_NAMES, type: 'Shul', descs: SHUL_DESCS, count: randInt(2, 5) },
          { names: SCHOOL_NAMES, type: 'School', descs: SCHOOL_DESCS, count: randInt(1, 2) },
          { names: YESHIVA_NAMES, type: 'Yeshiva', descs: YESHIVA_DESCS, count: randInt(0, 2) },
          { names: SEMINARY_NAMES, type: 'Seminary', descs: SEMINARY_DESCS, count: randInt(0, 1) },
          { names: ORG_NAMES, type: 'Other', descs: ORG_DESCS, count: randInt(1, 3) },
        ];

        for (const { names, type, descs, count } of entries) {
          for (let i = 0; i < count; i++) {
            if (commCount >= volumeCommunities) break;
            const name = makeName(names, neighborhood);
            const uniqueName = existingNames.has(name) ? `${name} (${city})` : name;
            if (existingNames.has(uniqueName)) continue;
            existingNames.add(uniqueName);

            const logoUrl = getClearbitLogo(uniqueName);
            const community = await base44.asServiceRole.entities.Community.create({
              name: uniqueName,
              type,
              neighborhood,
              address: `${neighborhood}, ${city}`,
              description_short: pick(descs),
              is_claimed: false,
              is_featured: false,
              is_seeded: true,
              follower_count: randInt(40, 1200),
              ...(logoUrl ? { logo_url: logoUrl, logo_source: 'AUTO' } : {}),
            });

            createdCommunities.push(community);
            commCount++;
          }
        }
      }
    }

    // Seed posts + events per community
    let postCount = 0;
    let eventCount = 0;

    for (const community of createdCommunities) {
      // Posts
      const numPosts = Math.min(volumePostsPerCommunity, randInt(1, 6));
      for (let i = 0; i < numPosts; i++) {
        const post = pick(SAMPLE_POSTS);
        await base44.asServiceRole.entities.CommunityPost.create({
          community_id: community.id,
          author_user_id: 'seeded',
          author_name: community.name,
          is_official: true,
          type: 'announcement',
          title: post.title,
          body: post.body,
          is_seeded: true,
        });
        postCount++;
      }

      // Events
      const numEvents = Math.min(volumeEventsPerCommunity, randInt(1, 4));
      for (let i = 0; i < numEvents; i++) {
        const evt = pick(UPCOMING_EVENTS);
        await base44.asServiceRole.entities.CommunityPost.create({
          community_id: community.id,
          author_user_id: 'seeded',
          author_name: community.name,
          is_official: true,
          type: 'event',
          title: evt.title,
          body: evt.body,
          event_date: futureDate(randInt(3, 90)),
          event_time: `${randInt(6, 9)}:00 PM`,
          is_seeded: true,
        });
        eventCount++;
      }
    }

    return Response.json({
      ok: true,
      communities_created: commCount,
      posts_created: postCount,
      events_created: eventCount,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});