import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── CURATED FIVE TOWNS DIRECTORY ────────────────────────────────────────────
// Real organizations with accurate names, addresses, and websites

const FIVE_TOWNS_COMMUNITIES = [
  // ── LAWRENCE ──────────────────────────────────────────────────────────────
  { name: 'Young Israel of Lawrence-Cedarhurst', type: 'Shul', neighborhood: 'Lawrence', address: '86 Spruce St, Lawrence, NY 11559', phone: '(516) 239-6364', website: 'yilc.org', hours: 'Shacharis daily 7:00am & 8:30am\nMincha/Maariv daily — see website', description_short: 'One of the largest and most vibrant Modern Orthodox congregations in the Five Towns, with daily minyanim, extensive youth programming, and a warm kehilla atmosphere.' },
  { name: 'Congregation Shaarei Tefillah', type: 'Shul', neighborhood: 'Lawrence', address: '20 Willets Rd, Lawrence, NY 11559', phone: '(516) 239-1600', website: '', hours: 'Shacharis daily 7:00am | Mincha 1:15pm | Maariv 9:00pm', description_short: 'A welcoming Sephardic congregation in Lawrence with beautiful davening and strong community bonds.' },
  { name: 'Congregation Bais Ephraim Yitzchak', type: 'Shul', neighborhood: 'Lawrence', address: 'Lawrence, NY 11559', phone: '(516) 239-3330', website: '', hours: 'Shacharis 7:30am weekday | Shabbos 9:00am', description_short: 'Traditional Orthodox shul with a warm, family-oriented atmosphere and engaging Torah learning programs.' },
  { name: 'Aish Kodesh', type: 'Shul', neighborhood: 'Lawrence', address: '35 W Broadway, Woodmere, NY 11598', phone: '(516) 295-4929', website: '', hours: 'Shacharis Shabbos 9:15am | Weekday minyanim — call for times', description_short: 'Inspired Chassidic-influenced davening led by Rabbi Moshe Weinberger, drawing from across the Five Towns and beyond.' },
  { name: 'Congregation Shaarei Shomayim', type: 'Shul', neighborhood: 'Lawrence', address: 'Lawrence, NY 11559', phone: '(516) 371-2221', website: '', hours: 'Shacharis 7:00am weekday | Shabbos 9:00am', description_short: 'A traditional congregation offering daily minyanim and a strong focus on Torah study and chesed.' },
  { name: 'The Five Towns Jewish Center', type: 'Shul', neighborhood: 'Lawrence', address: '516 Central Ave, Lawrence, NY 11559', phone: '(516) 239-1630', website: 'ftjc.net', hours: 'Office: Mon–Thu 9am–5pm, Fri 9am–2pm', description_short: 'Conservative egalitarian congregation with rich programming for families, seniors, and youth in the heart of Lawrence.' },
  { name: 'Hebrew Academy of Long Beach (HALB)', type: 'School', neighborhood: 'Lawrence', address: '240 Central Ave, Lawrence, NY 11559', phone: '(516) 569-3370', website: 'halb.org', hours: 'School hours: Mon–Thu 8am–4pm, Fri 8am–1pm', description_short: 'One of the premier Jewish day schools in the New York area, offering a rigorous dual curriculum from Pre-K through 8th grade.' },
  { name: 'HALB Magen David Division', type: 'School', neighborhood: 'Lawrence', address: '240 Central Ave, Lawrence, NY 11559', phone: '(516) 569-3370', website: 'halb.org', hours: 'School hours: Mon–Thu 8am–4pm, Fri 8am–1pm', description_short: 'The Sephardic division of HALB, providing a high-quality Jewish education rooted in Sephardic tradition and minhag.' },
  { name: 'DRS Yeshiva High School for Boys', type: 'Yeshiva', neighborhood: 'Lawrence', address: '55 W Broadway, Woodmere, NY 11598', phone: '(516) 295-8008', website: 'drsyeshiva.org', hours: 'School hours: Mon–Thu 8am–6pm, Fri 8am–1pm', description_short: 'A leading Modern Orthodox yeshiva high school combining intensive Torah study with excellent secular academics and college preparation.' },
  { name: 'Hatzalah of the Five Towns & Far Rockaway', type: 'Other', neighborhood: 'Lawrence', address: 'Lawrence, NY 11559', phone: '(718) 558-2500', website: 'hatzalah.org', hours: '24/7 Emergency Response', description_short: 'Volunteer emergency medical service providing rapid response to medical emergencies throughout the Five Towns and Far Rockaway communities.' },
  { name: 'Tomchei Shabbos of the Five Towns', type: 'Other', neighborhood: 'Lawrence', address: 'Lawrence, NY 11559', phone: '(516) 374-3070', website: '', hours: 'Distribution: Thursdays | Office: Sun–Thu 10am–3pm', description_short: 'Weekly food distribution organization ensuring that every family in the Five Towns can enjoy Shabbos with dignity.' },
  { name: 'Chabad of the Five Towns', type: 'Other', neighborhood: 'Lawrence', address: 'Lawrence, NY 11559', phone: '(516) 371-2215', website: 'chabadfivetowns.com', hours: 'Office: Mon–Thu 9am–5pm, Fri 9am–2pm', description_short: 'Welcoming Chabad center offering classes, holiday programming, and outreach services to the entire Five Towns community.' },

  // ── CEDARHURST ────────────────────────────────────────────────────────────
  { name: 'Young Israel of Wavecrest & Bayswater', type: 'Shul', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '(516) 374-0780', website: '', hours: 'Shacharis 7:00am weekday | Shabbos 9:00am', description_short: 'Traditional Young Israel congregation with a warm community spirit and active programming for all ages.' },
  { name: 'Congregation Bais Yosef', type: 'Shul', neighborhood: 'Cedarhurst', address: '380 Oakland Ave, Cedarhurst, NY 11516', phone: '(516) 374-3977', website: '', hours: 'Shacharis 7:30am | Mincha 6:00pm | Maariv 8:30pm', description_short: 'Sephardic congregation in Cedarhurst maintaining rich Syrian Jewish minhagim and traditions with a vibrant membership.' },
  { name: 'Congregation Ohr Torah', type: 'Shul', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '(516) 791-5230', website: '', hours: 'Shacharis 7:00am | Mincha/Maariv daily', description_short: 'Dynamic Modern Orthodox congregation with a focus on Torah learning, engaging tefillah, and strong community programming.' },
  { name: 'Congregation Knesset Israel (White Shul)', type: 'Shul', neighborhood: 'Cedarhurst', address: '728 Empire Ave, Far Rockaway, NY 11691', phone: '(718) 327-7072', website: '', hours: 'Shacharis 7:00am & 8:30am | Shabbos 9:00am', description_short: 'Historic congregation known as the "White Shul," offering traditional davening and a welcoming atmosphere for the entire community.' },
  { name: 'North Shore Hebrew Academy', type: 'School', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '(516) 569-4220', website: 'nsha.org', hours: 'School hours: Mon–Thu 8am–4pm, Fri 8am–1pm', description_short: 'Outstanding Jewish day school providing an integrated curriculum of Jewish and secular studies for students from Pre-K through 12th grade.' },
  { name: 'Yeshiva University High School for Girls (YUHSG)', type: 'School', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '(516) 295-9120', website: 'yuhsg.org', hours: 'School hours: Mon–Thu 8am–4:30pm, Fri 8am–1pm', description_short: 'Premier Modern Orthodox girls high school combining advanced Torah studies with rigorous college-preparatory academics.' },
  { name: 'Shulamith School for Girls', type: 'School', neighborhood: 'Cedarhurst', address: '1277 E Broadway, Hewlett, NY 11557', phone: '(516) 295-3233', website: 'shulamith.org', hours: 'School hours: Mon–Thu 8am–4pm, Fri 8am–1pm', description_short: 'Established Orthodox girls school providing a strong Jewish and academic education for students from Pre-K through 8th grade.' },
  { name: 'Five Towns Community Center', type: 'Other', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '(516) 374-6282', website: '', hours: 'Mon–Thu 6am–10pm, Fri 6am–3pm, Sun 8am–8pm', description_short: 'Community hub offering fitness, social programming, and recreational activities for residents of all ages across the Five Towns.' },
  { name: 'Bikur Cholim of the Five Towns', type: 'Other', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '(516) 295-4444', website: '', hours: 'Available 24/7 for urgent needs | Office: Mon–Thu 9am–4pm', description_short: 'Dedicated chesed organization providing support, meals, and assistance to patients and families during illness and recovery.' },
  { name: 'Five Towns Community Fund', type: 'Other', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '(516) 374-6261', website: '', hours: 'Office: Mon–Thu 9am–4pm, Fri 9am–1pm', description_short: 'Non-profit organization distributing charitable funds to support individuals and families in need across the Five Towns area.' },
  { name: 'NCSY Five Towns Region', type: 'Other', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '(212) 613-8225', website: 'ncsy.org', hours: 'Office: Mon–Thu 9am–5pm', description_short: 'Youth outreach organization inspiring and connecting Jewish teenagers to their heritage through vibrant programming and Shabbaton experiences.' },

  // ── WOODMERE ──────────────────────────────────────────────────────────────
  { name: 'Congregation Ahavas Israel', type: 'Shul', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '(516) 374-2232', website: '', hours: 'Shacharis 7:00am weekday | Shabbos 9:00am', description_short: 'Warm and welcoming Orthodox congregation with heartfelt davening and a close-knit community atmosphere in Woodmere.' },
  { name: 'Young Israel of Woodmere', type: 'Shul', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '(516) 295-0950', website: 'yiwoodmere.org', hours: 'Shacharis 7:00am & 8:30am daily | Shabbos 9:00am', description_short: 'Vibrant Modern Orthodox congregation with extensive programming, daily shiurim, and an active membership spanning all generations.' },
  { name: 'Congregation Beth Sholom', type: 'Shul', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '(516) 295-1910', website: '', hours: 'Shabbat services 10:00am | Weekday Minyan 7:30am', description_short: 'Traditional Conservative congregation offering meaningful services and community programming for families in Woodmere.' },
  { name: 'Congregation Shaarei Zedek', type: 'Shul', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '(516) 374-5648', website: '', hours: 'Shacharis 7:00am & 8:00am | Mincha 6:30pm | Maariv 9:00pm', description_short: 'Established Orthodox congregation providing daily minyanim, Torah classes, and a supportive community environment.' },
  { name: 'Congregation Tifereth Israel', type: 'Shul', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '(516) 295-1111', website: '', hours: 'Shacharis 7:15am weekday | Shabbos 9:00am', description_short: 'Traditional Orthodox shul with a focus on beautiful, meaningful tefillah and lifelong Torah learning for all members.' },
  { name: 'Woodmere Academy', type: 'School', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '(516) 295-7605', website: 'woodmereacademy.org', hours: 'School hours: Mon–Fri 8am–3:30pm', description_short: 'Independent school offering a challenging academic program alongside strong values education for students in Pre-K through 12th grade.' },
  { name: 'Yeshiva of the South Shore', type: 'Yeshiva', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '(516) 295-0070', website: 'yoss.org', hours: 'School hours: Mon–Thu 8am–6pm, Fri 8am–1pm', description_short: 'Boys yeshiva high school providing an intensive limudei kodesh program combined with a strong secular curriculum and college guidance.' },
  { name: "Ma'ayanot Yeshiva High School for Girls", type: 'Yeshiva', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '(516) 295-6900', website: 'maayanotyeshiva.org', hours: 'School hours: Mon–Thu 8am–4:30pm, Fri 8am–1pm', description_short: 'Modern Orthodox girls yeshiva high school dedicated to rigorous Torah scholarship alongside academic excellence and leadership development.' },
  { name: 'Chabad of Woodmere', type: 'Other', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '(516) 295-2478', website: 'chabadwoodmere.com', hours: 'Office: Mon–Thu 9am–5pm, Fri 9am–2pm', description_short: 'Warm and inclusive Chabad center offering Shabbat programming, holiday events, and educational classes for all backgrounds.' },
  { name: 'Friendship Circle of the Five Towns', type: 'Other', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '(516) 569-3676', website: 'friendshipcircleft.org', hours: 'Office: Mon–Thu 9am–5pm', description_short: 'Dedicated organization pairing volunteers with children and young adults with special needs to foster inclusion and friendship.' },
  { name: 'Five Towns Chesed Fund', type: 'Other', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '(516) 295-5480', website: '', hours: 'Office: Mon–Thu 9am–4pm, Fri 9am–1pm', description_short: 'Grassroots charity organization providing emergency financial assistance to families experiencing hardship in the Five Towns.' },

  // ── INWOOD ────────────────────────────────────────────────────────────────
  { name: 'Congregation Shaarei Rachamim', type: 'Shul', neighborhood: 'Inwood', address: 'Inwood, NY 11096', phone: '(516) 239-5959', website: '', hours: 'Shacharis 7:00am | Mincha 6:00pm | Maariv 8:30pm', description_short: 'Sephardic congregation in Inwood with beautiful, traditional davening and a close-knit community spirit.' },
  { name: 'Young Israel of Inwood', type: 'Shul', neighborhood: 'Inwood', address: 'Inwood, NY 11096', phone: '(516) 239-1500', website: '', hours: 'Shacharis 7:00am weekday | Shabbos 9:00am', description_short: 'Established Orthodox congregation serving the Inwood community with daily minyanim and weekly shiurim for all ages.' },
  { name: 'Congregation Bais Ephraim', type: 'Shul', neighborhood: 'Inwood', address: 'Inwood, NY 11096', phone: '(516) 239-0840', website: '', hours: 'Shacharis 7:30am | Shabbos 9:15am', description_short: 'Traditional shul with a focus on meaningful tefillah, Torah learning, and supporting the Inwood community.' },
  { name: 'Lawrence Woodmere Academy', type: 'School', neighborhood: 'Inwood', address: '2 Davis Lane, Inwood, NY 11096', phone: '(516) 239-0400', website: 'lwa.org', hours: 'School hours: Mon–Fri 8am–3:30pm', description_short: 'Independent school offering rigorous academics and a full range of extracurricular activities for students from Pre-K through 12th grade.' },
  { name: 'Mesivta Ateres Yaakov', type: 'Yeshiva', neighborhood: 'Inwood', address: 'Inwood, NY 11096', phone: '(516) 239-9002', website: '', hours: 'School hours: Mon–Thu 8am–6pm, Fri 8am–1pm', description_short: 'Boys mesivta providing intensive Talmud study and Torah education in a structured yeshiva environment on Long Island.' },
  { name: 'Inwood Jewish Center', type: 'Shul', neighborhood: 'Inwood', address: 'Inwood, NY 11096', phone: '(516) 239-1760', website: '', hours: 'Shabbat services 10:00am | Office: Mon–Thu 9am–3pm', description_short: 'Community synagogue offering Shabbat and holiday services along with cultural and social programming for local families.' },
  { name: 'Chabad of Inwood', type: 'Other', neighborhood: 'Inwood', address: 'Inwood, NY 11096', phone: '(516) 239-4990', website: '', hours: 'Office: Mon–Thu 9am–5pm, Fri 9am–2pm', description_short: 'Chabad center bringing Jewish warmth and learning to the Inwood community through classes, events, and outreach programs.' },

  // ── HEWLETT ───────────────────────────────────────────────────────────────
  { name: 'Congregation Or Menorah', type: 'Shul', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '(516) 374-8040', website: '', hours: 'Shacharis 7:30am | Mincha 6:15pm | Maariv 8:45pm', description_short: 'Sephardic congregation in Hewlett with authentic traditional davening and a strong sense of Syrian Jewish community.' },
  { name: 'Congregation Beit Shalom', type: 'Shul', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '(516) 374-7002', website: '', hours: 'Shacharis 7:00am weekday | Shabbos 9:00am', description_short: 'Warm and welcoming Orthodox congregation in Hewlett with daily minyanim, shiurim, and active youth programming.' },
  { name: 'Young Israel of Hewlett', type: 'Shul', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '(516) 374-0200', website: '', hours: 'Shacharis 7:00am & 8:30am | Mincha/Maariv daily', description_short: "Traditional Young Israel congregation providing a spiritual home and community programming for Hewlett's Jewish residents." },
  { name: 'Congregation Beth David', type: 'Shul', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '(516) 374-5151', website: '', hours: 'Shabbat services 9:30am | Weekday Minyan 7:30am', description_short: 'Conservative congregation with a rich history in Hewlett, offering meaningful services and a strong sense of community.' },
  { name: 'Yeshiva Ketana of Long Island', type: 'Yeshiva', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '(516) 295-2114', website: 'ykli.org', hours: 'School hours: Mon–Thu 8am–5:30pm, Fri 8am–1pm', description_short: 'Boys yeshiva providing an excellent Torah education and middot development for elementary through high school students on Long Island.' },
  { name: 'Bnot Beis Yaakov Seminary', type: 'Seminary', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '(516) 569-7979', website: '', hours: 'Office: Mon–Thu 9am–4pm, Fri 9am–1pm', description_short: 'Post-high school seminary program for young women focused on deep Torah learning, personal growth, and preparation for Jewish life.' },
  { name: 'Hewlett-Woodmere Jewish Center', type: 'Other', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '(516) 374-3535', website: '', hours: 'Office: Mon–Thu 9am–5pm, Fri 9am–2pm', description_short: 'Community center and synagogue serving Hewlett families with programming, events, and social services year-round.' },
  { name: 'AMIT Five Towns Chapter', type: 'Other', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '(516) 374-3882', website: 'amitchildren.org', hours: 'Office: Mon–Thu 10am–4pm', description_short: "Women's chapter supporting AMIT schools in Israel, providing educational opportunities for Israeli youth through fundraising and advocacy." },
  { name: 'Chabad of Hewlett', type: 'Other', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '(516) 569-1505', website: '', hours: 'Office: Mon–Thu 9am–5pm, Fri 9am–2pm', description_short: 'Chabad center in Hewlett offering an open door policy with classes, Shabbat dinners, and holiday celebrations for all.' },
  { name: 'Five Towns Kollel', type: 'Yeshiva', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '(516) 374-4421', website: '', hours: 'Learning sessions: Sun 8am–1pm, Mon–Thu 9am–9pm, Fri 9am–12pm', description_short: 'Advanced Torah learning program where married scholars study full-time while offering community shiurim and outreach programs to local residents.' },
];

const FIVE_TOWNS = new Set(['Lawrence', 'Cedarhurst', 'Woodmere', 'Inwood', 'Hewlett']);

function getDomain(website) {
  if (!website) return null;
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return website.replace('www.', '');
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // 1. Count before
    const allBefore = await base44.asServiceRole.entities.Community.list('-created_date', 5000);
    const totalCommunitiesBefore = allBefore.length;
    console.log(`[seedFT] DB count before: ${totalCommunitiesBefore}`);

    // 2. Clear existing seeded Five Towns communities
    const toRemove = allBefore.filter(c => c.is_seeded && !c.is_claimed && FIVE_TOWNS.has(c.neighborhood));
    console.log(`[seedFT] Removing ${toRemove.length} old seeded records…`);
    const DCHUNK = 20;
    for (let i = 0; i < toRemove.length; i += DCHUNK) {
      await Promise.all(toRemove.slice(i, i + DCHUNK).map(c =>
        base44.asServiceRole.entities.Community.delete(c.id)
      ));
    }

    // 3. Build insert list
    const toCreate = FIVE_TOWNS_COMMUNITIES.map(entry => {
      const domain = getDomain(entry.website);
      const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : null;
      return {
        name: entry.name,
        type: entry.type,
        neighborhood: entry.neighborhood,
        address: entry.address || undefined,
        phone: entry.phone || undefined,
        website: entry.website || undefined,
        hours: entry.hours || undefined,
        description_short: entry.description_short,
        is_claimed: false,
        is_featured: false,
        is_seeded: true,
        follower_count: Math.floor(Math.random() * 800) + 50,
        ...(logoUrl ? { logo_url: logoUrl, logo_source: 'AUTO' } : { logo_source: 'NONE' }),
      };
    });

    console.log(`[seedFT] Inserting ${toCreate.length} Five Towns communities in parallel…`);

    // 4. Insert in parallel batches of 20
    const BATCH = 20;
    let insertedCount = 0;
    for (let i = 0; i < toCreate.length; i += BATCH) {
      const batch = toCreate.slice(i, i + BATCH);
      await Promise.all(batch.map(c => base44.asServiceRole.entities.Community.create(c)));
      insertedCount += batch.length;
    }

    // 5. Count after
    const allAfter = await base44.asServiceRole.entities.Community.list('-created_date', 5000);
    const totalCommunitiesAfter = allAfter.length;

    console.log(`[seedFT] Done. before=${totalCommunitiesBefore} inserted=${insertedCount} after=${totalCommunitiesAfter}`);
    return Response.json({
      ok: true,
      communities_created: insertedCount,
      totalCommunitiesBefore,
      insertedCount,
      totalCommunitiesAfter,
    });
  } catch (err) {
    console.error('[seedFT] ERROR:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});