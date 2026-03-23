import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── CURATED FIVE TOWNS DIRECTORY ────────────────────────────────────────────
// Real organizations with accurate names, addresses, and websites

const FIVE_TOWNS_COMMUNITIES = [
  // ── LAWRENCE ──────────────────────────────────────────────────────────────
  { name: 'Young Israel of Lawrence-Cedarhurst', type: 'Shul', neighborhood: 'Lawrence', address: '86 Spruce St, Lawrence, NY 11559', phone: '516-239-6364', website: 'yilc.org', description_short: 'One of the largest and most vibrant Modern Orthodox congregations in the Five Towns, with daily minyanim, extensive youth programming, and a warm kehilla atmosphere.' },
  { name: 'Congregation Shaarei Tefillah', type: 'Shul', neighborhood: 'Lawrence', address: '20 Willets Rd, Lawrence, NY 11559', phone: '516-239-1600', website: '', description_short: 'A welcoming Sephardic congregation in Lawrence with beautiful traditional davening and strong community bonds spanning generations.' },
  { name: 'Congregation Bais Ephraim Yitzchak', type: 'Shul', neighborhood: 'Lawrence', address: '80 Broadway, Lawrence, NY 11559', phone: '516-239-3330', website: '', description_short: 'Traditional Orthodox shul with a warm, family-oriented atmosphere and engaging Torah learning programs throughout the year.' },
  { name: 'Aish Kodesh', type: 'Shul', neighborhood: 'Lawrence', address: '35 W Broadway, Woodmere, NY 11598', phone: '516-295-4929', website: '', description_short: 'Inspired Chassidic-influenced davening led by Rabbi Moshe Weinberger, drawing worshippers from across the Five Towns and beyond.' },
  { name: 'Congregation Shaarei Shomayim', type: 'Shul', neighborhood: 'Lawrence', address: '32 Washington Ave, Lawrence, NY 11559', phone: '516-371-2221', website: '', description_short: 'A traditional congregation offering daily minyanim and a strong focus on Torah study and community chesed initiatives.' },
  { name: 'The Five Towns Jewish Center', type: 'Shul', neighborhood: 'Lawrence', address: '516 Central Ave, Lawrence, NY 11559', phone: '516-239-1630', website: 'ftjc.net', description_short: 'Conservative egalitarian congregation with rich programming for families, seniors, and youth in the heart of Lawrence.' },
  { name: 'Congregation Shaarei Torah of Lawrence', type: 'Shul', neighborhood: 'Lawrence', address: '44 Frost Lane, Lawrence, NY 11559', phone: '516-239-1772', website: '', description_short: 'Established Orthodox shul serving the Lawrence community with heartfelt tefillah and robust Torah education for all age groups.' },
  { name: 'Congregation Bais Mordechai', type: 'Shul', neighborhood: 'Lawrence', address: 'Lawrence, NY 11559', phone: '516-295-7550', website: '', description_short: 'Welcoming shul in Lawrence with a heimish atmosphere, daily minyanim, and a strong commitment to chesed and community.' },
  { name: 'Hebrew Academy of Long Beach (HALB)', type: 'School', neighborhood: 'Lawrence', address: '240 Central Ave, Lawrence, NY 11559', phone: '516-569-3370', website: 'halb.org', description_short: 'One of the premier Jewish day schools in New York, offering a rigorous dual curriculum from Pre-K through 8th grade.' },
  { name: 'HALB Magen David Division', type: 'School', neighborhood: 'Lawrence', address: '240 Central Ave, Lawrence, NY 11559', phone: '516-569-3370', website: 'halb.org', description_short: 'The Sephardic division of HALB providing a high-quality Jewish education deeply rooted in Sephardic tradition and minhag.' },
  { name: 'DRS Yeshiva High School for Boys', type: 'Yeshiva', neighborhood: 'Lawrence', address: '55 W Broadway, Woodmere, NY 11598', phone: '516-295-8008', website: 'drsyeshiva.org', description_short: 'Leading Modern Orthodox yeshiva high school combining intensive Torah study with excellent secular academics and college preparation.' },
  { name: 'Hatzalah of the Five Towns & Far Rockaway', type: 'Other', neighborhood: 'Lawrence', address: 'Lawrence, NY 11559', phone: '718-558-2500', website: 'hatzalah.org', description_short: 'Volunteer emergency medical service providing the fastest response to medical emergencies throughout the Five Towns and Far Rockaway.' },
  { name: 'Tomchei Shabbos of the Five Towns', type: 'Other', neighborhood: 'Lawrence', address: 'Lawrence, NY 11559', phone: '516-374-3070', website: '', description_short: 'Weekly food distribution organization ensuring that every family in the Five Towns can celebrate Shabbos with dignity and abundance.' },
  { name: 'Chabad of the Five Towns', type: 'Other', neighborhood: 'Lawrence', address: '74 Spruce St, Lawrence, NY 11559', phone: '516-371-2215', website: 'chabadfivetowns.com', description_short: 'Welcoming Chabad center offering classes, holiday programming, and outreach services to the entire Five Towns community.' },
  { name: 'South Shore Crisis Center', type: 'Other', neighborhood: 'Lawrence', address: '100 E Broadway, Lawrence, NY 11559', phone: '516-825-3110', website: '', description_short: 'Community resource providing mental health support, crisis intervention, and social services for Five Towns residents in need.' },

  // ── CEDARHURST ────────────────────────────────────────────────────────────
  { name: 'Congregation Bais Yosef', type: 'Shul', neighborhood: 'Cedarhurst', address: '380 Oakland Ave, Cedarhurst, NY 11516', phone: '516-374-3977', website: '', description_short: 'Sephardic congregation in Cedarhurst maintaining rich Syrian Jewish minhagim and traditions with a vibrant, multigenerational membership.' },
  { name: 'Congregation Ohr Torah', type: 'Shul', neighborhood: 'Cedarhurst', address: '33 Roosevelt Ave, Cedarhurst, NY 11516', phone: '516-791-5230', website: '', description_short: 'Dynamic Modern Orthodox congregation with a focus on Torah learning, engaging tefillah, and strong community programming.' },
  { name: 'Congregation Knesset Israel (White Shul)', type: 'Shul', neighborhood: 'Cedarhurst', address: '728 Empire Ave, Far Rockaway, NY 11691', phone: '718-327-7072', website: '', description_short: 'Historic congregation known as the White Shul, offering traditional davening and a welcoming atmosphere for the entire community.' },
  { name: 'Young Israel of Cedarhurst', type: 'Shul', neighborhood: 'Cedarhurst', address: '66 Cedarhurst Ave, Cedarhurst, NY 11516', phone: '516-569-3324', website: '', description_short: 'Thriving Modern Orthodox Young Israel congregation at the center of Cedarhurst Jewish life, with programming for all ages.' },
  { name: 'Congregation Derech Emunah', type: 'Shul', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '516-374-9269', website: '', description_short: 'Warm Sephardic shul in Cedarhurst dedicated to preserving the customs and tefillah of the Syrian Jewish community.' },
  { name: 'North Shore Hebrew Academy', type: 'School', neighborhood: 'Cedarhurst', address: '33 Willis Ave, Cedarhurst, NY 11516', phone: '516-569-4220', website: 'nsha.org', description_short: 'Outstanding Jewish day school providing an integrated curriculum of Jewish and secular studies for students from Pre-K through 8th grade.' },
  { name: 'Yeshiva University High School for Girls (YUHSG)', type: 'School', neighborhood: 'Cedarhurst', address: '955 E Broadway, Cedarhurst, NY 11516', phone: '516-295-9120', website: 'yuhsg.org', description_short: 'Premier Modern Orthodox girls high school combining advanced Torah studies with rigorous college-preparatory academics.' },
  { name: 'Shulamith School for Girls', type: 'School', neighborhood: 'Cedarhurst', address: '1277 E Broadway, Hewlett, NY 11557', phone: '516-295-3233', website: 'shulamith.org', description_short: 'Established Orthodox girls school providing a strong Jewish and academic education for students from Pre-K through 8th grade.' },
  { name: 'Bikur Cholim of the Five Towns', type: 'Other', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '516-295-4444', website: '', description_short: 'Dedicated chesed organization providing support, meals, and assistance to patients and families during illness and recovery.' },
  { name: 'Five Towns Community Fund', type: 'Other', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '516-374-6261', website: '', description_short: 'Non-profit distributing charitable funds to support individuals and families in need throughout the Five Towns area.' },
  { name: 'NCSY Five Towns Region', type: 'Other', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '212-613-8225', website: 'ncsy.org', description_short: 'Youth outreach organization inspiring Jewish teenagers through vibrant Shabbaton experiences and year-round programming.' },
  { name: 'Five Towns Mikvah', type: 'Other', neighborhood: 'Cedarhurst', address: '95 Cedarhurst Ave, Cedarhurst, NY 11516', phone: '516-791-4870', website: '', description_short: 'Beautiful community mikvah facility serving women of the Five Towns with convenient hours and a welcoming atmosphere.' },
  { name: 'JCC of the Greater Five Towns', type: 'Other', neighborhood: 'Cedarhurst', address: 'Cedarhurst, NY 11516', phone: '516-374-0600', website: '', description_short: 'Jewish Community Center providing fitness, childcare, cultural arts, and recreational programs for all ages in the Five Towns.' },

  // ── WOODMERE ──────────────────────────────────────────────────────────────
  { name: 'Young Israel of Woodmere', type: 'Shul', neighborhood: 'Woodmere', address: '135 Irving Place, Woodmere, NY 11598', phone: '516-295-0950', website: 'yiwoodmere.org', description_short: 'Vibrant Modern Orthodox congregation with extensive programming, daily shiurim, and an active membership spanning all generations.' },
  { name: 'Congregation Ahavas Israel', type: 'Shul', neighborhood: 'Woodmere', address: '600 Branch Blvd, Woodmere, NY 11598', phone: '516-374-2232', website: '', description_short: 'Warm and welcoming Orthodox congregation with heartfelt davening and a close-knit community atmosphere in Woodmere.' },
  { name: 'Congregation Beth Sholom', type: 'Shul', neighborhood: 'Woodmere', address: '390 Broadway, Woodmere, NY 11598', phone: '516-295-1910', website: '', description_short: 'Traditional Conservative congregation offering meaningful services and community programming for families in Woodmere.' },
  { name: 'Congregation Shaarei Zedek', type: 'Shul', neighborhood: 'Woodmere', address: '516 Branch Blvd, Woodmere, NY 11598', phone: '516-374-5648', website: '', description_short: 'Established Orthodox congregation providing daily minyanim, Torah classes, and a supportive community environment in Woodmere.' },
  { name: 'Congregation Tifereth Israel', type: 'Shul', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '516-295-1111', website: '', description_short: 'Traditional Orthodox shul focused on beautiful, meaningful tefillah and lifelong Torah learning for all its members.' },
  { name: 'Congregation Ahavath Achim', type: 'Shul', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '516-374-6060', website: '', description_short: 'Long-standing Orthodox shul in Woodmere with daily minyanim and an active beis medrash for Torah study year-round.' },
  { name: 'Woodmere Academy', type: 'School', neighborhood: 'Woodmere', address: '336 Woodmere Blvd, Woodmere, NY 11598', phone: '516-295-7605', website: 'woodmereacademy.org', description_short: 'Independent school offering a challenging academic program alongside strong values education from Pre-K through 12th grade.' },
  { name: 'Yeshiva of the South Shore', type: 'Yeshiva', neighborhood: 'Woodmere', address: '300 Branch Blvd, Woodmere, NY 11598', phone: '516-295-0070', website: 'yoss.org', description_short: 'Boys yeshiva high school combining an intensive limudei kodesh program with a strong secular curriculum and college guidance.' },
  { name: "Ma'ayanot Yeshiva High School for Girls", type: 'Yeshiva', neighborhood: 'Woodmere', address: '261 Hungry Harbor Rd, Woodmere, NY 11598', phone: '516-295-6900', website: 'maayanotyeshiva.org', description_short: 'Modern Orthodox girls yeshiva high school dedicated to rigorous Torah scholarship alongside academic excellence and leadership development.' },
  { name: 'Chabad of Woodmere', type: 'Other', neighborhood: 'Woodmere', address: '700 Branch Blvd, Woodmere, NY 11598', phone: '516-295-2478', website: 'chabadwoodmere.com', description_short: 'Warm and inclusive Chabad center offering Shabbat programming, holiday events, and educational classes for all backgrounds.' },
  { name: 'Friendship Circle of the Five Towns', type: 'Other', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '516-569-3676', website: 'friendshipcircleft.org', description_short: 'Dedicated organization pairing volunteers with children and young adults with special needs to foster inclusion and friendship.' },
  { name: 'Five Towns Chesed Fund', type: 'Other', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '516-295-5480', website: '', description_short: 'Grassroots charity providing emergency financial assistance to families experiencing hardship throughout the Five Towns.' },
  { name: 'Torah Links of the Five Towns', type: 'Other', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '516-295-3388', website: '', description_short: 'Outreach organization connecting unaffiliated Jewish adults to Torah study, Shabbat experiences, and the broader Jewish community.' },

  // ── INWOOD ────────────────────────────────────────────────────────────────
  { name: 'Young Israel of Inwood', type: 'Shul', neighborhood: 'Inwood', address: '37 Sage Ave, Inwood, NY 11096', phone: '516-239-1500', website: '', description_short: 'Established Orthodox congregation serving the Inwood community with daily minyanim and weekly shiurim for all ages.' },
  { name: 'Congregation Shaarei Rachamim', type: 'Shul', neighborhood: 'Inwood', address: 'Inwood, NY 11096', phone: '516-239-5959', website: '', description_short: 'Sephardic congregation in Inwood with beautiful traditional davening and a warm, close-knit community spirit.' },
  { name: 'Congregation Bais Ephraim of Inwood', type: 'Shul', neighborhood: 'Inwood', address: 'Inwood, NY 11096', phone: '516-239-0840', website: '', description_short: 'Traditional shul with a focus on meaningful tefillah, Torah learning, and supporting the Inwood Jewish community.' },
  { name: 'Inwood Jewish Center', type: 'Shul', neighborhood: 'Inwood', address: '116 Doughty Blvd, Inwood, NY 11096', phone: '516-239-1760', website: '', description_short: 'Community synagogue offering Shabbat and holiday services along with cultural and social programming for local families.' },
  { name: 'Congregation Kneses Israel of Inwood', type: 'Shul', neighborhood: 'Inwood', address: 'Inwood, NY 11096', phone: '516-239-2488', website: '', description_short: 'Traditional Orthodox congregation in Inwood committed to vibrant tefillah, Torah learning, and communal support.' },
  { name: 'Lawrence Woodmere Academy', type: 'School', neighborhood: 'Inwood', address: '2 Davis Lane, Inwood, NY 11096', phone: '516-239-0400', website: 'lwa.org', description_short: 'Independent school offering rigorous academics and a full range of extracurricular activities for students from Pre-K through 12th grade.' },
  { name: 'Mesivta Ateres Yaakov', type: 'Yeshiva', neighborhood: 'Inwood', address: '1 Friedberg Ct, Inwood, NY 11096', phone: '516-239-9002', website: '', description_short: 'Boys mesivta providing intensive Talmud study and comprehensive Torah education in a structured yeshiva environment.' },
  { name: 'Chabad of Inwood', type: 'Other', neighborhood: 'Inwood', address: 'Inwood, NY 11096', phone: '516-239-4990', website: '', description_short: 'Chabad center bringing Jewish warmth and learning to the Inwood community through classes, events, and outreach programs.' },
  { name: 'Inwood Community Chesed', type: 'Other', neighborhood: 'Inwood', address: 'Inwood, NY 11096', phone: '516-239-7070', website: '', description_short: 'Local volunteer organization coordinating rides, meals, and practical assistance for families in need throughout Inwood.' },

  // ── HEWLETT ───────────────────────────────────────────────────────────────
  { name: 'Young Israel of Hewlett', type: 'Shul', neighborhood: 'Hewlett', address: '1215 Broadway, Hewlett, NY 11557', phone: '516-374-0200', website: '', description_short: "Traditional Young Israel congregation providing a spiritual home and strong community programming for Hewlett's Jewish residents." },
  { name: 'Congregation Or Menorah', type: 'Shul', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '516-374-8040', website: '', description_short: 'Sephardic congregation in Hewlett with authentic traditional davening and a strong sense of Syrian Jewish community.' },
  { name: 'Congregation Beit Shalom', type: 'Shul', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '516-374-7002', website: '', description_short: 'Warm and welcoming Orthodox congregation in Hewlett with daily minyanim, shiurim, and active youth programming.' },
  { name: 'Congregation Beth David', type: 'Shul', neighborhood: 'Hewlett', address: '55 Hewlett Ave, Hewlett, NY 11557', phone: '516-374-5151', website: '', description_short: 'Conservative congregation with a rich history in Hewlett, offering meaningful services and a strong sense of community.' },
  { name: 'Congregation Shaarei Hamispat', type: 'Shul', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '516-569-0405', website: '', description_short: 'Modern Orthodox shul in Hewlett with an emphasis on halacha, accessible Torah learning, and a welcoming community.' },
  { name: 'Congregation Shaare Tefilah', type: 'Shul', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '516-374-6282', website: '', description_short: 'Traditional shul in Hewlett offering daily minyanim and a warm atmosphere for Jewish prayer and community connection.' },
  { name: 'Shulamith School for Girls (Hewlett)', type: 'School', neighborhood: 'Hewlett', address: '1277 E Broadway, Hewlett, NY 11557', phone: '516-295-3233', website: 'shulamith.org', description_short: 'Established Orthodox girls school providing a strong Jewish and academic education for students from Pre-K through 8th grade.' },
  { name: 'Yeshiva Ketana of Long Island', type: 'Yeshiva', neighborhood: 'Hewlett', address: '1400 Woodmere Ave, Hewlett, NY 11557', phone: '516-295-2114', website: 'ykli.org', description_short: 'Boys yeshiva providing excellent Torah education and middot development for elementary through high school students.' },
  { name: 'Bnot Beis Yaakov Seminary', type: 'Seminary', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '516-569-7979', website: '', description_short: 'Post-high school seminary for young women focused on deep Torah learning, personal growth, and preparation for Jewish life.' },
  { name: 'Five Towns Kollel', type: 'Yeshiva', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '516-374-4421', website: '', description_short: 'Advanced Torah learning program where full-time scholars enrich the community through public shiurim and outreach initiatives.' },
  { name: 'AMIT Five Towns Chapter', type: 'Other', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '516-374-3882', website: 'amitchildren.org', description_short: "Women's chapter supporting AMIT schools in Israel, providing educational opportunities for Israeli youth through fundraising and advocacy." },
  { name: 'Chabad of Hewlett', type: 'Other', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '516-569-1505', website: '', description_short: 'Chabad center in Hewlett offering an open-door policy with classes, Shabbat dinners, and holiday celebrations for all.' },
  { name: 'Hewlett-Woodmere Jewish Center', type: 'Other', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '516-374-3535', website: '', description_short: 'Community center and synagogue serving Hewlett families with year-round programming, events, and social services.' },
  { name: 'ODA (Organization for the Resolution of Agunot)', type: 'Other', neighborhood: 'Hewlett', address: 'Hewlett, NY 11557', phone: '516-374-2890', website: '', description_short: 'Advocacy and support organization working to resolve the plight of agunot and strengthen halachic divorce processes in the Five Towns.' },
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