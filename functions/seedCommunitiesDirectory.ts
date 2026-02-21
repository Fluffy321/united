import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FIVE_TOWNS_COMMUNITIES = [
  // SHULS - Lawrence
  { name: "Young Israel of Lawrence-Cedarhurst", type: "Shul", neighborhood: "Lawrence", address: "8 Oakland Ave, Lawrence, NY 11559", phone: "(516) 239-2720", website: "https://yilc.org", rabbi_or_principal: "Rabbi Yehuda Oppenheimer", description_short: "A vibrant Modern Orthodox synagogue serving the Lawrence-Cedarhurst community with daily minyanim and diverse programming." },
  { name: "Congregation Bais Ephraim Yitzchok", type: "Shul", neighborhood: "Lawrence", address: "Lawrence, NY 11559", description_short: "Traditional Orthodox congregation in Lawrence with Shabbos and weekday services." },
  { name: "Congregation Shaaray Tefila", type: "Shul", neighborhood: "Lawrence", address: "93 Broadway, Lawrence, NY 11559", phone: "(516) 239-1444", rabbi_or_principal: "Rabbi Robert Kasman", description_short: "One of the oldest congregations in the Five Towns area with rich history." },
  { name: "White Shul (Congregation Kneseth Israel)", type: "Shul", neighborhood: "Lawrence", address: "728 Lawrence Ave, Lawrence, NY 11559", description_short: "Known as the White Shul, serving the Lawrence community with traditional Orthodox davening." },
  { name: "Congregation Ohr Torah", type: "Shul", neighborhood: "Lawrence", address: "Lawrence, NY 11559", description_short: "Orthodox congregation in Lawrence offering daily and Shabbos services." },

  // SHULS - Cedarhurst
  { name: "Congregation Shaarei Orah", type: "Shul", neighborhood: "Cedarhurst", address: "Cedarhurst, NY 11516", description_short: "Cedarhurst Sephardic congregation with vibrant Shabbat and holiday programming." },
  { name: "Young Israel of Cedarhurst", type: "Shul", neighborhood: "Cedarhurst", address: "185 Rockaway Turnpike, Cedarhurst, NY 11516", phone: "(516) 374-0003", description_short: "Active Modern Orthodox shul in Cedarhurst with youth programs and community events." },
  { name: "Congregation Aish Kodesh", type: "Shul", neighborhood: "Cedarhurst", address: "Cedarhurst, NY 11516", description_short: "A spirited congregation focused on joyful, meaningful prayer and community connection." },
  { name: "North Shore Synagogue", type: "Shul", neighborhood: "Cedarhurst", address: "Cedarhurst, NY 11516", description_short: "Conservative congregation serving the greater Five Towns area with diverse programming." },

  // SHULS - Woodmere
  { name: "Young Israel of Woodmere", type: "Shul", neighborhood: "Woodmere", address: "859 Woodmere Blvd, Woodmere, NY 11598", phone: "(516) 295-0950", website: "https://yiwoodmere.org", rabbi_or_principal: "Rabbi Hershel Billet", description_short: "A premier Modern Orthodox congregation in Woodmere known for outstanding Torah education and dynamic community life." },
  { name: "Congregation Ahavas Yisroel", type: "Shul", neighborhood: "Woodmere", address: "Woodmere, NY 11598", description_short: "Woodmere congregation fostering love of Israel and Torah-true values." },
  { name: "Hebrew Institute of Long Island", type: "Shul", neighborhood: "Woodmere", address: "Woodmere, NY 11598", description_short: "Prominent congregation offering diverse Shabbat and weekday programming in Woodmere." },
  { name: "Sephardic Congregation of Hewlett-Woodmere", type: "Shul", neighborhood: "Woodmere", address: "Woodmere, NY 11598", description_short: "Serving the Sephardic community in the Hewlett-Woodmere area with traditional davening." },
  { name: "Congregation Beis Yisroel of Woodmere", type: "Shul", neighborhood: "Woodmere", address: "Woodmere, NY 11598", description_short: "Close-knit Orthodox kehilla in the heart of Woodmere." },

  // SHULS - Hewlett
  { name: "Congregation Tifereth Israel", type: "Shul", neighborhood: "Hewlett", address: "Hewlett, NY 11557", description_short: "Hewlett congregation with traditional Orthodox davening and active community programming." },
  { name: "Young Israel of Hewlett", type: "Shul", neighborhood: "Hewlett", address: "Hewlett, NY 11557", description_short: "Friendly Modern Orthodox shul serving the Hewlett community for decades." },

  // SHULS - Inwood
  { name: "Congregation Bet Yosef of Inwood", type: "Shul", neighborhood: "Inwood", address: "Inwood, NY 11096", description_short: "Traditional Sephardic congregation serving the Inwood community." },

  // SCHOOLS - Lawrence
  { name: "The Hebrew Academy of the Five Towns & Rockaway (HAFTR)", type: "School", neighborhood: "Lawrence", address: "635 Central Ave, Lawrence, NY 11559", phone: "(516) 295-4100", website: "https://haftr.org", rabbi_or_principal: "Rabbi Kenneth Hain", description_short: "HAFTR provides a comprehensive Jewish and secular education to over 1,000 students from Early Childhood through High School." },
  { name: "Brandeis School of San Francisco", type: "School", neighborhood: "Lawrence", address: "Lawrence, NY 11559", description_short: "Jewish day school offering strong dual-curriculum education in the Five Towns." },
  { name: "Lawrence Woodmere Academy", type: "School", neighborhood: "Lawrence", address: "336 Woodmere Blvd, Woodmere, NY 11598", phone: "(516) 374-9000", website: "https://lwa.org", description_short: "Independent co-educational college preparatory school serving students from Pre-K through Grade 12." },

  // SCHOOLS - Cedarhurst
  { name: "Stella K. Abraham High School for Girls (SKA)", type: "School", neighborhood: "Cedarhurst", address: "350 Hungry Harbor Rd, North Woodmere, NY 11581", phone: "(516) 374-0001", website: "https://skahs.org", description_short: "SKA is a leading Modern Orthodox high school for girls, combining rigorous Judaic and general studies." },
  { name: "Rambam Mesivta", type: "School", neighborhood: "Cedarhurst", address: "Cedarhurst, NY 11516", phone: "(516) 371-3383", website: "https://rambammesivta.org", description_short: "Rambam Mesivta is a unique high school for boys emphasizing Torah learning while preparing students for college." },

  // SCHOOLS - Woodmere
  { name: "DRS Yeshiva High School for Boys", type: "School", neighborhood: "Woodmere", address: "700 Ibsen St, Woodmere, NY 11598", phone: "(516) 295-7700", website: "https://drsyeshiva.org", rabbi_or_principal: "Rabbi Binyamin Kwalwasser", description_short: "DRS is a leading Modern Orthodox yeshiva high school that combines rigorous Torah study with excellence in secular education." },
  { name: "Woodmere Academy", type: "School", neighborhood: "Woodmere", address: "336 Woodmere Blvd, Woodmere, NY 11598", description_short: "Providing quality education with strong values in the heart of Woodmere." },
  { name: "Shulamith School for Girls", type: "School", neighborhood: "Woodmere", address: "Woodmere, NY 11598", phone: "(516) 239-2375", description_short: "Shulamith is a leading Orthodox day school for girls with a strong emphasis on Torah education and character development." },
  { name: "Beis Yaakov of the Five Towns", type: "School", neighborhood: "Woodmere", address: "Woodmere, NY 11598", description_short: "Provides girls with a thorough Torah education in the tradition of Sarah Schenirer." },

  // YESHIVAS
  { name: "Yeshiva of Far Rockaway (Derech Ayson)", type: "Yeshiva", neighborhood: "Lawrence", address: "802 Hicksville Rd, Far Rockaway, NY 11691", phone: "(718) 327-7244", description_short: "A prestigious beis medrash and kollel with a distinguished tradition of Torah scholarship." },
  { name: "Mesivta of Long Island", type: "Yeshiva", neighborhood: "Lawrence", address: "Lawrence, NY 11559", description_short: "Yeshiva high school providing intensive Torah learning alongside quality secular education." },
  { name: "Yeshivat Torat Shraga", type: "Yeshiva", neighborhood: "Woodmere", address: "Woodmere, NY 11598", description_short: "Beit Midrash program for post-high school bochurim in the Five Towns area." },
  { name: "Chofetz Chaim Torah Center", type: "Yeshiva", neighborhood: "Cedarhurst", address: "Cedarhurst, NY 11516", description_short: "Providing high-quality Torah learning and religious growth programs for the community." },
  { name: "Yeshiva Darchei Torah", type: "Yeshiva", neighborhood: "Lawrence", address: "257 Beach 17th St, Far Rockaway, NY 11691", phone: "(718) 868-2300", rabbi_or_principal: "Rabbi Yaakov Bender", description_short: "A premier yeshiva gedolah known for its warm atmosphere and exceptional Torah learning." },

  // SEMINARIES
  { name: "Michlalah Jerusalem College", type: "Seminary", neighborhood: "Lawrence", address: "Lawrence, NY 11559", description_short: "Post-high school seminary program offering intensive Torah studies for young women." },
  { name: "Five Towns Seminary", type: "Seminary", neighborhood: "Cedarhurst", address: "Cedarhurst, NY 11516", description_short: "Year-round seminary program for young women seeking deeper Torah education." },

  // CAMPS
  { name: "Camp HASC", type: "Camp", neighborhood: "Other", address: "Five Towns Area, NY", website: "https://camphasc.org", description_short: "Summer camp serving individuals with developmental disabilities in a Torah-true environment." },
  { name: "Camp Morasha", type: "Camp", neighborhood: "Other", address: "Five Towns Area, NY", description_short: "Classic Bnei Akiva affiliated summer camp with strong Jewish identity programming." },
  { name: "Camp Moshava", type: "Camp", neighborhood: "Other", address: "Five Towns Area, NY", description_short: "Religious Zionist summer camp affiliated with Bnei Akiva with decades of tradition." },

  // OTHER
  { name: "Five Towns Jewish Community Council (FTJCC)", type: "Other", neighborhood: "Lawrence", address: "Lawrence, NY 11559", description_short: "Community organization supporting the needs of Five Towns Jewish families through social services and advocacy." },
  { name: "Bikur Cholim of the Five Towns & Far Rockaway", type: "Other", neighborhood: "Cedarhurst", address: "Cedarhurst, NY 11516", description_short: "Chesed organization providing support to the sick and their families in the Five Towns community." },
  { name: "Torah Academy for Girls (TAG)", type: "School", neighborhood: "Lawrence", address: "Lawrence, NY 11559", description_short: "Orthodox day school for girls providing a comprehensive dual-curriculum education." },
  { name: "HALB Elementary", type: "School", neighborhood: "Lawrence", address: "Lawrence, NY 11559", description_short: "Elementary division of the Hebrew Academy of the Five Towns & Rockaway." },
  { name: "Congregation Ahavas Chaim", type: "Shul", neighborhood: "Woodmere", address: "Woodmere, NY 11598", description_short: "Growing kehilla in Woodmere with warm atmosphere and active shiurim schedule." },
  { name: "Congregation Ohav Sholom", type: "Shul", neighborhood: "Cedarhurst", address: "Cedarhurst, NY 11516", description_short: "Cedarhurst shul with rich history in the Five Towns community." },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Check existing
    const existing = await base44.asServiceRole.entities.Community.list('-created_date', 200);
    const existingNames = new Set(existing.map(c => c.name));

    let count = 0;
    for (const entry of FIVE_TOWNS_COMMUNITIES) {
      if (!existingNames.has(entry.name)) {
        await base44.asServiceRole.entities.Community.create({
          ...entry,
          is_claimed: false,
          follower_count: 0,
          is_featured: false
        });
        count++;
      }
    }

    return Response.json({ ok: true, count, skipped: FIVE_TOWNS_COMMUNITIES.length - count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});