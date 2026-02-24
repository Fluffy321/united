import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CORE_TEN = [
  {
    name: "Young Israel of Lawrence-Cedarhurst",
    type: "Shul",
    neighborhood: "Cedarhurst",
    address: "8 Spruce Street, Cedarhurst, NY 11516",
    phone: "(516) 569-3324",
    website: "https://www.yilc.org",
    hours: "Shacharis: Sun 7:00/8:15AM, Mon-Fri 6:15/7:00/7:45AM; Mincha/Maariv daily — see website for full schedule",
    description_short: "One of the Five Towns' premier Modern Orthodox congregations, serving Lawrence and Cedarhurst for generations.",
    description_long: "Young Israel of Lawrence-Cedarhurst (YILC) is one of the most established and vibrant Orthodox synagogues in the Five Towns area, proudly located at the corner of Broadway and Spruce in Cedarhurst. Founded decades ago, the shul has grown into a dynamic spiritual home for hundreds of families across Lawrence and Cedarhurst. YILC is known for its warm, welcoming atmosphere and its commitment to both Torah learning and communal involvement. The shul offers a robust schedule of daily minyanim, weekly shiurim, and engaging programming for all ages. Under dedicated rabbinic leadership, YILC has long been a pillar of chesed and Jewish identity in the community. Its youth programs, adult education offerings, and holiday events draw members from across the Five Towns. YILC is also deeply involved in Israel advocacy and communal support initiatives. Whether you are a longtime member or a first-time visitor, you will find a kehilla that is both serious about Torah and serious about welcoming every Jew.",
    is_claimed: false,
    is_seeded: false,
    is_featured: true,
  },
  {
    name: "Congregation Beth Sholom",
    type: "Shul",
    neighborhood: "Lawrence",
    address: "390 Broadway, Lawrence, NY 11559",
    phone: "(516) 569-3600",
    website: "https://www.bethsholomlawrence.org",
    hours: "Shacharis: Sun 8:00AM, Mon-Fri 6:45/7:30AM; Mincha/Maariv daily — see website",
    description_short: "Founded in 1928, Congregation Beth Sholom is one of the most storied Orthodox shuls in the Five Towns.",
    description_long: "Congregation Beth Sholom holds the distinction of being one of the oldest and most respected Orthodox congregations in the Five Towns, having been founded in 1928. Located on Broadway in Lawrence, Beth Sholom has served as a spiritual anchor for the community through generations of growth and change. The shul is known for its warm, family-oriented atmosphere and its commitment to traditional tefillah alongside a modern sensibility. Beth Sholom offers a full range of daily minyanim, Shabbos and Yom Tov davening, and a rich calendar of Torah learning and social programs. Its members are deeply connected to one another, creating a true sense of mishpacha within the walls of the shul. The congregation has historically attracted leading rabbinic figures and scholars, enriching the community's intellectual and spiritual life. With strong youth programs and a welcoming spirit for newcomers, Beth Sholom continues to thrive as a cornerstone of Lawrence's Jewish community. It remains a place where long-standing tradition meets the needs of today's modern Orthodox family.",
    is_claimed: false,
    is_seeded: false,
    is_featured: true,
  },
  {
    name: "Congregation Sons of Israel",
    type: "Shul",
    neighborhood: "Woodmere",
    address: "111 Irving Place, Woodmere, NY 11598",
    phone: "(516) 374-0655",
    website: "https://www.csoiwoodmere.org",
    hours: "Shacharis: Sun 8:00AM, Mon-Fri 7:00AM; Shabbos 9:00AM — see website for full schedule",
    description_short: "A traditional Conservative synagogue founded in 1928, serving the heart of Woodmere for nearly a century.",
    description_long: "Congregation Sons of Israel (CSOI) has been a beloved institution in Woodmere since its founding in 1928, holding a unique and irreplaceable place in the fabric of Five Towns Jewish life. Located at 111 Irving Place, CSOI operates as a traditional Conservative congregation that has proudly maintained its commitment to accessible, meaningful Jewish practice for nearly 100 years. The shul is home to a diverse and dedicated membership that spans multiple generations of Woodmere families. CSOI's prayer services are known for their warmth, musical quality, and sense of communal spirit. Beyond services, the congregation offers robust adult education programs, a rich social calendar, and strong youth programming. The shul has long been a hub of lifecycle events — bar and bat mitzvahs, weddings, and memorial services — that have woven it into the hearts of countless families. CSOI prides itself on being an inclusive and welcoming home for Jews of all backgrounds. Its historic building and enduring presence make it a true landmark of the Five Towns.",
    is_claimed: false,
    is_seeded: false,
    is_featured: true,
  },
  {
    name: "Aish Kodesh",
    type: "Shul",
    neighborhood: "Woodmere",
    address: "894 Woodmere Place, Woodmere, NY 11598",
    phone: "(516) 374-8596",
    website: "https://www.aishkodesh.org",
    hours: "Shacharis: Sun 7:45/9:00AM, Mon-Fri 6:15/7:15AM; Mincha/Maariv daily — see website",
    description_short: "A dynamic Sephardic-style Orthodox congregation in Woodmere known for inspiring davening and deep Torah learning.",
    description_long: "Aish Kodesh is one of the most spiritually vibrant and intellectually stimulating Orthodox congregations in the Five Towns, located in the heart of Woodmere. The shul is known for its particularly inspired, soulful style of tefillah that draws Jews seeking a deeper, more meaningful connection to prayer. Under passionate rabbinic leadership, Aish Kodesh has become a center of Torah study and kiruv, attracting both longtime observant families and those newer to Orthodox life. The congregation features an extraordinarily diverse array of shiurim, classes, and learning opportunities throughout the week. Aish Kodesh's Shabbos davening is widely regarded as among the most moving in the Five Towns, with a warm communal energy that newcomers immediately feel. The shul places a strong emphasis on individual spiritual growth alongside communal connection. Its programming spans all age groups, from youth to seniors, ensuring every member has a place to grow. Aish Kodesh represents a model of how a modern Orthodox shul can be both rigorously traditional and deeply inspiring.",
    is_claimed: false,
    is_seeded: false,
    is_featured: true,
  },
  {
    name: "Khal Bnei Torah",
    type: "Shul",
    neighborhood: "Woodmere",
    address: "843 Central Avenue, Woodmere, NY 11598",
    phone: "",
    website: "https://kehilathbnaitorah.shulcloud.com",
    hours: "Shacharis: Sun 7:00/8:45AM; Mincha/Maariv daily — see website for zmanim",
    description_short: "A close-knit Ashkenazic Orthodox kehilla in Woodmere dedicated to serious Torah learning and communal warmth.",
    description_long: "Khal Bnei Torah is a traditional Ashkenazic Orthodox congregation located in Woodmere, serving a dedicated membership that values both rigorous Torah study and genuine communal connection. The kehilla is known for its serious approach to davening and learning, offering multiple daily minyanim and a packed schedule of shiurim throughout the week. Members of Khal Bnei Torah are drawn by the shul's atmosphere of sincere yiras Shamayim and the strong bonds formed among its families. The shul attracts a mix of young families and established community members, creating a multigenerational environment of growth and support. Khal Bnei Torah has built a reputation for producing Torah scholars and community leaders who go on to serve the broader Five Towns kehilla. The shul's intimate size fosters deep relationships and a true sense of belonging for all who daven there. Holiday programming and weekly Shabbos gatherings are highlights of the community calendar. Khal Bnei Torah stands as a model of what a focused, Torah-centered Orthodox community can achieve.",
    is_claimed: false,
    is_seeded: false,
    is_featured: true,
  },
  {
    name: "Beis Tefilah of Woodmere",
    type: "Shul",
    neighborhood: "Woodmere",
    address: "409 Edward Avenue, Woodmere, NY 11598",
    phone: "(516) 374-5523",
    website: "https://www.btwoodmere.org",
    hours: "Shacharis: Sun 7:45/9:00AM, Mon-Fri 6:20/7:00/7:45AM; Mincha/Maariv daily — see website",
    description_short: "A warm and welcoming Orthodox shul on Edward Avenue in Woodmere, known as the Julius Sand Synagogue.",
    description_long: "Beis Tefilah of Woodmere, officially known as the Julius Sand Synagogue, is one of Woodmere's most cherished Orthodox congregations, located on Edward Avenue in the heart of the neighborhood. The shul has served generations of Woodmere families with a combination of traditional Orthodox practice and genuine communal warmth. Rabbi Ephraim Polakoff has led the kehilla with distinction, cultivating an atmosphere where every member feels seen and valued. Beis Tefilah's davening is known for its uplifting energy and the active participation of its members, who take pride in their shared spiritual experience. The shul offers a full week of Torah classes, shiurim, and educational programming for all ages. Lifecycle events — from brisim and bar mitzvahs to shivas — are integral to the shul's fabric, reinforcing the bonds of community that have been built over decades. The congregation has a strong tradition of chesed, mobilizing members to support one another and the broader community in times of need. Beis Tefilah of Woodmere remains a true spiritual home for the many families who call it their own.",
    is_claimed: false,
    is_seeded: false,
    is_featured: true,
  },
  {
    name: "Chabad of Woodmere",
    type: "Shul",
    neighborhood: "Woodmere",
    address: "748 Central Avenue, Woodmere, NY 11598",
    phone: "(516) 295-9790",
    website: "https://www.chabadfivetowns.com",
    hours: "Shacharis: Sun 9:30AM, Mon-Fri 7:00AM; Shabbos 10:00AM — see website",
    description_short: "Chabad of the Five Towns brings joyful, inclusive Jewish outreach and vibrant programming to the Woodmere community.",
    description_long: "Chabad of the Five Towns, with its Woodmere location at 748 Central Avenue, is a vibrant center of Jewish outreach, education, and programming serving Jews of all backgrounds across Woodmere and the surrounding area. Under the leadership of Rabbi Pesach Burston and the broader Chabad team, the center has become a beloved destination for Jewish learning, holiday celebrations, and personal spiritual guidance. Chabad is known for its unconditional warmth and acceptance of every Jew, regardless of background or level of observance. The Woodmere location hosts a full schedule of Shabbos and weekday davening, as well as classes, children's programs, and major holiday events that draw hundreds of participants. The center's Gan Chamesh early childhood program has become a cornerstone of the local Jewish educational landscape. Chabad's distinctive approach to Jewish outreach — meeting people where they are and inspiring them to grow — has transformed countless lives in the Five Towns. Whether you are a longtime Chabad follower or stepping into a Jewish environment for the first time, you will find a genuinely welcoming home at Chabad of the Five Towns.",
    is_claimed: false,
    is_seeded: false,
    is_featured: true,
  },
  {
    name: "Ohr Torah of Woodmere",
    type: "Shul",
    neighborhood: "Woodmere",
    address: "410 Hungry Harbor Road, Valley Stream, NY 11581",
    phone: "(516) 791-2130",
    website: "https://www.ohrtorah.org",
    hours: "Shacharis: Sun 7:00/8:30AM, Mon-Fri 6:15/7:00AM; Mincha/Maariv daily — see website",
    description_short: "Founded in 1963, Ohr Torah is North Woodmere's original Orthodox shul — a warm mishpacha shul for the whole family.",
    description_long: "Congregation Ohr Torah, known as the North Woodmere Jewish Center, has been the spiritual home of the North Woodmere community since its founding in 1963. Proudly serving as the area's first Orthodox Ashkenazic synagogue, Ohr Torah has grown into what is lovingly called the 'Mishpacha Shul' — a true family shul in every sense of the word. For over six decades, the congregation has been at the center of lifecycle celebrations, weekly Shabbos gatherings, and the daily rhythm of Jewish life for North Woodmere families. The shul is known for its inclusive, family-friendly atmosphere and the deep personal relationships that form naturally among its members. Ohr Torah offers daily minyanim, a rich Shabbos program, and ongoing Torah learning opportunities for all ages and backgrounds. The congregation has historically served both Ashkenazic and Sephardic members, reflecting the diverse tapestry of the North Woodmere community. Under committed lay and rabbinic leadership, the shul has continuously evolved to meet the needs of its growing membership. Ohr Torah stands as a testament to the enduring strength of community-centered Orthodox Jewish life in the Five Towns.",
    is_claimed: false,
    is_seeded: false,
    is_featured: true,
  },
  {
    name: "Shaaray Tefila of Lawrence",
    type: "Shul",
    neighborhood: "Lawrence",
    address: "25 Central Avenue, Lawrence, NY 11559",
    phone: "(516) 239-2444",
    website: "http://www.shaaray-tefilah.org",
    hours: "Shacharis: Sun & holidays Neitz/7:00/8:00AM, Mon/Thu Neitz/6:00/7:00/7:45AM, Tue/Wed/Fri 6:30/7:15AM",
    description_short: "A distinguished Orthodox congregation in Lawrence offering multiple daily minyanim and a rich tradition of Torah and tefillah.",
    description_long: "Congregation Shaaray Tefila is one of Lawrence's most respected and long-standing Orthodox synagogues, located at 25 Central Avenue in the heart of the community. The shul is known for its exceptional davening schedule, offering some of the most comprehensive weekday minyan options in the Five Towns, including early Neitz minyanim for early risers. Shaaray Tefila has cultivated a reputation for serious tefillah and a deep commitment to halacha and Torah learning. The congregation maintains a well-stocked Beis Medrash — the Beis Medrash Zichron Amram — which serves as a hub for ongoing Torah study throughout the week. Members of Shaaray Tefila span a wide range of ages and backgrounds, united by their shared love of authentic Jewish practice and communal connection. The shul's rabbinic and lay leadership have worked to ensure that every member, whether a long-time Lawrencian or a newcomer, feels welcomed and at home. Shaaray Tefila's holiday programming, shiurim, and social events create a full-spectrum Jewish experience that goes far beyond the weekly Shabbos service. It remains a vital and vibrant part of the Lawrence Jewish community.",
    is_claimed: false,
    is_seeded: false,
    is_featured: true,
  },
  {
    name: "Congregation Bais Tefilah",
    type: "Shul",
    neighborhood: "Woodmere",
    address: "409 Edward Avenue, Woodmere, NY 11598",
    phone: "(516) 374-5523",
    website: "https://www.btwoodmere.org",
    hours: "Shacharis: Sun 7:45/9:00AM, Mon-Fri 6:20/7:00/7:45AM; Mincha/Maariv daily — see website",
    description_short: "One of Woodmere's cornerstone Orthodox congregations, Congregation Bais Tefilah has anchored the community for decades.",
    description_long: "Congregation Bais Tefilah of Woodmere has long been one of the anchoring institutions of Jewish life in the Five Towns, proudly serving the Woodmere community from its home on Edward Avenue. The shul's history is intertwined with the growth and development of Woodmere as a major center of Orthodox Jewish life on Long Island. Known for its traditional davening, warm communal spirit, and commitment to Torah education, Bais Tefilah has been the spiritual home for countless families over the generations. The congregation hosts a wide variety of shiurim, Torah classes, and communal events throughout the year, ensuring that Jewish learning is woven into the daily life of its members. Bais Tefilah's chesed network is a model for the broader community, mobilizing members to support neighbors in need with meals, rides, and practical assistance. The shul's lifecycle events — joyous simchos and the support offered during times of mourning — are conducted with extraordinary care and sensitivity. Its youth programs and engagement initiatives ensure that the next generation feels deeply connected to their heritage and to the kehilla. Congregation Bais Tefilah continues to be a place of prayer, learning, and community that the Five Towns would be incomplete without.",
    is_claimed: false,
    is_seeded: false,
    is_featured: true,
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const results = [];

    for (const shul of CORE_TEN) {
      // Check if it already exists by exact name
      const existing = await base44.asServiceRole.entities.Community.filter({ name: shul.name });

      if (existing.length > 0) {
        // Update existing
        await base44.asServiceRole.entities.Community.update(existing[0].id, shul);
        results.push({ action: 'updated', name: shul.name });
      } else {
        // Create new
        await base44.asServiceRole.entities.Community.create(shul);
        results.push({ action: 'created', name: shul.name });
      }
    }

    // Delete all communities NOT in the core ten list (only unclaimed, unFeatured extras)
    const allCommunities = await base44.asServiceRole.entities.Community.list();
    const coreNames = new Set(CORE_TEN.map(s => s.name));
    const toDelete = allCommunities.filter(c => !coreNames.has(c.name) && !c.is_claimed);

    for (const c of toDelete) {
      await base44.asServiceRole.entities.Community.delete(c.id);
    }

    return Response.json({ success: true, upserted: results, deleted: toDelete.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});