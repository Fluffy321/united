import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Seeded content per shul (keyed by exact community name)
const SHUL_CONTENT = {
  "Young Israel of Lawrence-Cedarhurst": {
    posts: [
      { type: "general", title: "Welcome to YILC's Community Hub", body: "We're excited to launch our community page! Stay tuned for updates, announcements, and opportunities to connect. This is your home for all things YILC.", author_name: "YILC Community", is_official: false },
      { type: "general", title: "Weekly Parsha Learning", body: "Join us every Shabbos afternoon for a shiur on the weekly parsha. All are welcome — from beginners to advanced learners. A great opportunity for the whole family.", author_name: "YILC Torah Committee" },
      { type: "general", title: "Community Kiddush This Shabbos", body: "Don't forget — we have a community kiddush this Shabbos sponsored by the Cohen family in honor of their son's bar mitzvah. Come celebrate with us!", author_name: "Shul Office" },
      { type: "announcement", title: "Shabbos Schedule — Updated", body: "This week's Shabbos schedule: Mincha/Kabbalas Shabbos at 5:15pm, Shacharis 8:45am, Musaf approximately 10:45am. Please check the website for full zmanim.", is_official: true, author_name: "YILC Office" },
      { type: "announcement", title: "Youth Program Registration Open", body: "Registration is now open for our winter youth programming. Children ages 5–12 are invited to join our Shabbos morning junior congregation program. Contact the office for details.", is_official: true, author_name: "YILC Youth Committee" },
    ],
    events: [
      { title: "Community Melave Malka", description: "Join us for a special post-Shabbos gathering with music, food, and divrei Torah. A wonderful way to end Shabbos together as a community.", start_date: "2026-03-07", start_time: "8:30 PM", location: "YILC Social Hall, 8 Spruce St" },
      { title: "Purim Celebration & Megillah Reading", description: "Join YILC for our annual Purim celebration! Megillah reading, costumes, and a lively farbrengen for all ages. Mishloach manos coordination through the shul.", start_date: "2026-03-14", start_time: "7:00 PM", location: "YILC Main Sanctuary" },
    ],
    opportunities: [
      { title: "Food Pantry Volunteer Shift", description: "Help stock and distribute food at the Five Towns Food Pantry. Shifts available Sunday mornings. No experience necessary — just a willingness to help!", category: "Food Drive", location: "Cedarhurst Community Center", slots_needed: 4 },
      { title: "Shabbos Meal for New Family", description: "A new family has recently joined the community. We are coordinating Shabbos meals for their first few weeks. Please sign up if you can host or drop off a meal.", category: "Shabbos Help", slots_needed: 3 },
      { title: "Bikur Cholim Visit Coordination", description: "A member of our community is recovering from surgery. We are organizing friendly visits and meal drop-offs. Contact the shul office to coordinate.", category: "Bikur Cholim", location: "Lawrence, NY", slots_needed: 5 },
    ]
  },
  "Congregation Beth Sholom": {
    posts: [
      { type: "general", title: "Welcome to Beth Sholom's Hub", body: "Founded in 1928, Congregation Beth Sholom has been a cornerstone of Jewish life in the Five Towns for nearly a century. This page is your connection to our vibrant community.", author_name: "Beth Sholom Community" },
      { type: "general", title: "Daf Yomi — Join the Journey", body: "Our Daf Yomi shiur meets every morning after Shacharis. We are currently in the middle of Masechta Bava Basra. All skill levels welcome — the learning is accessible and engaging.", author_name: "Beth Sholom Beis Medrash" },
      { type: "general", title: "Shabbos Zmiros Night", body: "Last Shabbos afternoon's zmiros gathering was a beautiful success. Thank you to everyone who participated. We look forward to making this a regular feature of our Shabbos!", author_name: "Shul Programming Committee" },
      { type: "announcement", title: "Annual Dinner Honorees Announced", body: "We are proud to announce this year's honorees for our annual dinner. The event will be held in late spring. Watch this space for ticket information and sponsorship opportunities.", is_official: true, author_name: "Beth Sholom Office" },
      { type: "announcement", title: "Kiddush Fund — Sponsor a Shabbos", body: "Interested in sponsoring a Shabbos kiddush in honor of a simcha or in memory of a loved one? Contact the office to reserve your date. Sponsorships help support our community programming.", is_official: true, author_name: "Beth Sholom Office" },
    ],
    events: [
      { title: "Torah Scholar Weekend", description: "We welcome a distinguished guest speaker for a weekend of learning. Friday night drasha, Shabbos morning shiur, and a special Shabbos afternoon address.", start_date: "2026-03-20", start_time: "7:30 PM", location: "Beth Sholom Main Sanctuary" },
      { title: "Women's Seder", description: "Our annual women's pre-Pesach seder and educational evening. An inspiring program preparing our community for the Yom Tov. Light refreshments served.", start_date: "2026-04-01", start_time: "7:30 PM", location: "Beth Sholom Social Hall" },
    ],
    opportunities: [
      { title: "Hatzolah Support Drive", description: "Help us collect supplies for our local Hatzolah chapter. Items needed include first aid supplies, batteries, and shelf-stable food items. Drop-off at the shul office.", category: "Chesed", location: "390 Broadway, Lawrence", slots_needed: 10 },
      { title: "Senior Companion Program", description: "Spend an hour a week visiting a senior member of our community who would benefit from social connection. A small time commitment with a big impact.", category: "Bikur Cholim", slots_needed: 6 },
    ]
  },
  "Congregation Sons of Israel": {
    posts: [
      { type: "general", title: "Welcome to CSOI's Community Page", body: "Congregation Sons of Israel has called 111 Irving Place home since 1928. This hub is where our community comes together online — for news, events, and connection.", author_name: "CSOI Community" },
      { type: "general", title: "Shabbat Morning Service — All Welcome", body: "Our Shabbat morning service begins at 9:00 AM and is followed by kiddush. We are a warm and welcoming Conservative congregation — newcomers and guests are always welcome.", author_name: "CSOI Clergy" },
      { type: "general", title: "Adult Education Series Continues", body: "Our popular Tuesday evening adult education series continues this month. Topics include Jewish history, contemporary halacha, and holiday preparation. All are invited.", author_name: "CSOI Adult Ed Committee" },
      { type: "announcement", title: "Building Fund Campaign Underway", body: "We have launched our building renewal campaign to modernize our sanctuary and social hall. Visit the office for more information or to make a donation in support of CSOI's future.", is_official: true, author_name: "CSOI Office" },
      { type: "announcement", title: "Youth Lounge Renovation Complete!", body: "We are thrilled to announce the completion of our newly renovated youth lounge. The space is now open for youth programming and teen events. Thank you to all who donated!", is_official: true, author_name: "CSOI Office" },
    ],
    events: [
      { title: "Shabbat Across America", description: "Join us for a special Shabbat Across America celebration — a beautiful and inspiring Shabbat evening service followed by a community dinner. Pre-registration required.", start_date: "2026-03-13", start_time: "6:30 PM", location: "CSOI Sanctuary & Social Hall" },
      { title: "Passover Prep Workshop", description: "A practical and educational workshop on preparing for Pesach. Topics include bedikat chametz, selling chametz, and creating a meaningful seder.", start_date: "2026-03-31", start_time: "7:00 PM", location: "CSOI Library" },
    ],
    opportunities: [
      { title: "Kosher Food Drive for Pesach", description: "Help us fill the Five Towns food pantry with kosher-for-Pesach items for families in need. Collection boxes are available in the shul lobby through the end of March.", category: "Food Drive", location: "CSOI Lobby, 111 Irving Place", slots_needed: 20 },
      { title: "Bar/Bat Mitzvah Tutoring", description: "Share your knowledge! We are looking for volunteers to help tutor students preparing for their bar or bat mitzvah. Commitment of 1 hour per week.", category: "Tutoring", slots_needed: 3 },
    ]
  },
  "Aish Kodesh": {
    posts: [
      { type: "general", title: "Welcome to Aish Kodesh's Hub", body: "Aish Kodesh is a home for every Jew seeking a deeper connection — to tefillah, to Torah, and to community. We're glad you're here. Explore our programs and come daven with us.", author_name: "Aish Kodesh" },
      { type: "general", title: "Shabbos Farbrengen This Week", body: "Join us Shabbos afternoon for our weekly farbrengen — words of Torah, singing, and warm community connection. Usually begins around 5:00pm. All are welcome!", author_name: "Aish Kodesh Programming" },
      { type: "general", title: "New Shiur: Introduction to Jewish Mysticism", body: "Starting next week — a new Monday evening shiur on the fundamentals of Jewish mysticism and Chassidus. Open to all backgrounds, no prior knowledge required.", author_name: "Rabbi's Office" },
      { type: "announcement", title: "High Holiday Registration Now Open", body: "Registration for High Holiday seats is now open for members and guests. Early registration is encouraged. Contact the office for membership and guest pricing.", is_official: true, author_name: "Aish Kodesh Office" },
      { type: "announcement", title: "Shabbos Morning Minyan — New Time", body: "Beginning this Shabbos, our main Shabbos morning minyan will begin at 9:00 AM instead of 8:45 AM. Musaf will begin approximately 90 minutes after Shacharis.", is_official: true, author_name: "Aish Kodesh Gabbai" },
    ],
    events: [
      { title: "Shabbaton for Young Families", description: "A special Shabbaton weekend designed for young families with children. Friday night dinner, Shabbos day programming for kids, and an inspiring adult program.", start_date: "2026-03-06", start_time: "6:00 PM", location: "Aish Kodesh, 894 Woodmere Place" },
      { title: "Community Purim Seudah", description: "Join our community-wide Purim seudah! Food, music, costumes, and an electrifying atmosphere of simcha. All ages welcome.", start_date: "2026-03-14", start_time: "1:00 PM", location: "Aish Kodesh Social Hall" },
    ],
    opportunities: [
      { title: "Kiruv Chavrusah Program", description: "Be paired with someone newer to Jewish learning for a weekly chavrusah session. Requires approximately 1 hour per week. Training and support provided.", category: "Chesed", slots_needed: 5 },
      { title: "Pre-Shabbos Errand Help", description: "Help elderly or disabled community members with pre-Shabbos errands — grocery pickup, pharmacy runs, and food delivery. Especially needed on Fridays.", category: "Errands", location: "Woodmere area", slots_needed: 4 },
      { title: "Post-Holiday Meal Coordination", description: "We coordinate meals for families after Yom Tov who may need support. Sign up to prepare or deliver a meal for a family in need in our community.", category: "Shabbos Help", slots_needed: 6 },
    ]
  },
  "Khal Bnei Torah": {
    posts: [
      { type: "general", title: "Welcome to Khal Bnei Torah", body: "Khal Bnei Torah is a Torah-centered kehilla in the heart of Woodmere. We are dedicated to serious learning, meaningful tefillah, and genuine ahavas Yisrael. Join us.", author_name: "Khal Bnei Torah" },
      { type: "general", title: "Shacharis Schedule This Week", body: "This week's Shacharis schedule: Sunday 7:00 and 8:45 AM, Monday–Friday 6:20 and 7:15 AM. Mincha/Maariv times follow standard zmanim — see the shul entrance for this week's schedule.", author_name: "Gabbai" },
      { type: "general", title: "Rav's Shabbos Drasha Summary", body: "This week's Rav's drasha explored the deeper meaning behind the mitzvah of tzniut and its connection to community cohesion. A beautifully crafted and thought-provoking shiur.", author_name: "Khal Bnei Torah Community" },
      { type: "announcement", title: "Annual Siyum Celebration", body: "We will be celebrating a communal siyum on Masechta Yevamos at the end of this month. All are invited to join this milestone of Torah learning. Refreshments will be served.", is_official: true, author_name: "Khal Bnei Torah Beis Medrash" },
      { type: "announcement", title: "New Weekday Morning Kollel", body: "We are launching a new weekday morning kollel program, open to all community members. Learn bekiyus-style one hour before Shacharis. For info, contact the gabbai.", is_official: true, author_name: "Khal Bnei Torah Rav" },
    ],
    events: [
      { title: "Mishmar — Friday Night Learning", description: "Join us Friday night after the seudah for our weekly Mishmar. Hot drinks, snacks, and lively Torah learning in a warm and joyful atmosphere.", start_date: "2026-02-27", start_time: "9:30 PM", location: "Khal Bnei Torah Beis Medrash" },
      { title: "Rosh Chodesh Shiur", description: "Special Rosh Chodesh shiur open to the entire community. The Rav will address a timely topic in halacha and hashkafa.", start_date: "2026-03-01", start_time: "8:15 PM", location: "843 Central Ave, Woodmere" },
    ],
    opportunities: [
      { title: "Gemach: Sefer Library", description: "We are building a community sefer gemach. Donate gently used sefarim or volunteer to help catalog and organize our growing collection.", category: "Chesed", location: "Khal Bnei Torah, 843 Central Ave", slots_needed: 3 },
      { title: "Welcoming New Members", description: "Help us welcome new families to the kehilla! We are looking for volunteers to host new members for a Shabbos meal in their first month.", category: "Shabbos Help", slots_needed: 5 },
    ]
  },
  "Beis Tefilah of Woodmere": {
    posts: [
      { type: "general", title: "Welcome to Beis Tefilah's Hub", body: "Beis Tefilah of Woodmere — the Julius Sand Synagogue — is one of Woodmere's most beloved Orthodox congregations. This is your online home to stay connected with our community.", author_name: "Beis Tefilah" },
      { type: "general", title: "Shabbos At-a-Glance", body: "This Shabbos: Mincha/Kabbalas Shabbos 5:15pm, Shacharis 8:45am, Daf Yomi 7:30am, Parsha shiur 5:00pm, Mincha Gedola 1:20pm. Full schedule posted at the shul entrance.", author_name: "Gabbai" },
      { type: "general", title: "Kiddush Club Returns", body: "By popular demand, the post-davening Kiddush Club is back! Join us after Shacharis for schmooze, l'chaim, and light refreshments. A great way to connect with fellow members.", author_name: "Beis Tefilah Social Committee" },
      { type: "announcement", title: "Shabbos Shiur Schedule — Spring 5786", body: "Our updated spring shiur schedule is now posted. Highlights include a new Sunday morning halacha series and a Navi series on Tuesday evenings. All programs are open to the community.", is_official: true, author_name: "Rabbi Polakoff" },
      { type: "announcement", title: "Simchos Committee — New Members Welcome", body: "Our simchos committee helps coordinate celebrations and support for members during lifecycle events. We are looking for new volunteers. Contact the office to join.", is_official: true, author_name: "Beis Tefilah Office" },
    ],
    events: [
      { title: "Community Seder — Second Night", description: "Join us for a community second-night seder at the shul! All are welcome, especially those who would otherwise be alone for the seder. RSVP to the office.", start_date: "2026-04-13", start_time: "7:30 PM", location: "Beis Tefilah Social Hall" },
      { title: "Pre-Shavuos Learning Night", description: "An all-night (or partial-night!) learning program for Shavuos. Various shiurim and chavrusos available. Coffee and food provided to keep everyone going!", start_date: "2026-06-11", start_time: "10:00 PM", location: "Beis Tefilah Beis Medrash" },
    ],
    opportunities: [
      { title: "Cholim Visits — Hospital Program", description: "Volunteer to visit Jewish patients at South Nassau Communities Hospital. Training provided. A deeply meaningful chesed opportunity.", category: "Bikur Cholim", location: "South Nassau Communities Hospital", slots_needed: 4 },
      { title: "Purim Mishloach Manos Delivery", description: "Help deliver mishloach manos packages to elderly and homebound members of our community. Requires 2–3 hours on Purim day.", category: "Chesed", location: "Woodmere area", slots_needed: 8 },
      { title: "Shabbos Meals for Families in Need", description: "Coordinate or prepare a Shabbos meal for a family in our community facing a difficult time. Meals can be dropped off Friday afternoon.", category: "Shabbos Help", slots_needed: 4 },
    ]
  },
  "Chabad of Woodmere": {
    posts: [
      { type: "general", title: "Welcome to Chabad of Woodmere!", body: "Chabad of the Five Towns is a center of warmth, learning, and Jewish pride. Whether you're a longtime Chabad follower or visiting for the first time, you belong here. Shalom!", author_name: "Chabad of the Five Towns" },
      { type: "general", title: "Shabbat Services — All Welcome", body: "Shabbat morning services begin at 10:00 AM and are followed by a full Shabbat kiddush lunch. All are welcome regardless of background or affiliation. Come as you are!", author_name: "Rabbi Burston" },
      { type: "general", title: "Gan Chamesh Early Childhood Program", body: "Our award-winning early childhood program, Gan Chamesh, provides a loving Jewish environment for children ages 6 weeks through pre-K. Enrollment is open year-round.", author_name: "Gan Chamesh Staff" },
      { type: "announcement", title: "Purim at Chabad — Save the Date!", body: "Our Purim celebration is one of the most joyful events of the year! Megillah readings, children's carnival, costume contest, and a festive seudah. All are invited!", is_official: true, author_name: "Chabad Five Towns" },
      { type: "announcement", title: "Weekly Women's Circle", body: "The weekly women's circle meets every Tuesday at 8:00 PM for a class, conversation, and connection. Open to all women. This week's topic: The Power of Jewish Women.", is_official: true, author_name: "Chabad Women's Circle" },
    ],
    events: [
      { title: "Purim Mega Event", description: "Chabad's legendary Purim celebration! Megillah reading at night and day, children's carnival, food, music, and pure simcha. Do not miss this!", start_date: "2026-03-14", start_time: "6:30 PM", location: "Chabad Five Towns, 74 Maple Ave, Cedarhurst" },
      { title: "Passover Seder for All", description: "Attending a Seder for the first time, or looking for an exciting and interactive experience? Join Rabbi Burston for a warm, welcoming, and educational Passover Seder.", start_date: "2026-04-12", start_time: "7:00 PM", location: "Chabad Five Towns" },
    ],
    opportunities: [
      { title: "Tefillin Drive — Help Jewish Men Connect", description: "Join our team helping Jewish men in the Five Towns put on tefillin for the first time or rekindling the mitzvah. A powerful and meaningful chesed.", category: "Chesed", location: "Five Towns community", slots_needed: 5 },
      { title: "Holiday Package Assembly", description: "Help assemble and deliver holiday packages for families in need before Pesach. A fun and high-impact few hours of volunteering.", category: "Food Drive", location: "Chabad Center, 748 Central Ave, Woodmere", slots_needed: 15 },
    ]
  },
  "Ohr Torah of Woodmere": {
    posts: [
      { type: "general", title: "Welcome to Ohr Torah — The Mishpacha Shul", body: "Congregation Ohr Torah has been North Woodmere's family shul since 1963. This page is your connection to our warm community. We can't wait to welcome you to our home.", author_name: "Ohr Torah Community" },
      { type: "general", title: "Shabbos Morning Is Our Favorite Time", body: "Something special happens at Ohr Torah every Shabbos morning. The davening is warm, the singing is heartfelt, and the kiddush afterward is always lively. Come experience it!", author_name: "Ohr Torah Community" },
      { type: "general", title: "Junior Congregation Program Thriving", body: "Our Junior Congregation program, for children ages 5–12, is running beautifully this year. Kids are learning nusach, parasha, and tefillah in a fun and engaging format.", author_name: "Youth Director" },
      { type: "announcement", title: "New Rav's Shiur — Thursday Evenings", body: "Beginning this Thursday, our Rav will be giving a new weekly shiur on Parshas HaShavua with a focus on contemporary application. 8:15 PM in the Beis Medrash. All welcome.", is_official: true, author_name: "Ohr Torah Office" },
      { type: "announcement", title: "Membership Drive 5786", body: "We are actively welcoming new member families for this year. Membership includes High Holiday seats, simcha hall access, and full programming. Contact the office for rates.", is_official: true, author_name: "Ohr Torah Board" },
    ],
    events: [
      { title: "Family Shabbaton", description: "Our annual family Shabbaton brings together all generations for a weekend of learning, activities, and bonding. A weekend the whole family will remember.", start_date: "2026-03-27", start_time: "5:30 PM", location: "Ohr Torah, 410 Hungry Harbor Rd" },
      { title: "Annual Golf Outing & Dinner", description: "Support Ohr Torah at our annual golf outing and dinner. A wonderful day with fellow community members, followed by a festive dinner and program.", start_date: "2026-05-17", start_time: "12:00 PM", location: "North Woodmere Golf Course" },
    ],
    opportunities: [
      { title: "Gabbai Helper — Shabbos Morning", description: "Assist our gabbai on Shabbos morning with aliyos, coordination, and keeping services running smoothly. A meaningful role for a dedicated community member.", category: "Chesed", location: "Ohr Torah, 410 Hungry Harbor Rd", slots_needed: 2 },
      { title: "Chesed Committee — New Members", description: "Our chesed committee coordinates meals, visits, and practical support for community members in need. We welcome new members who want to make a tangible difference.", category: "Chesed", slots_needed: 6 },
    ]
  },
  "Shaaray Tefila of Lawrence": {
    posts: [
      { type: "general", title: "Welcome to Shaaray Tefila", body: "Congregation Shaaray Tefila has been a pillar of Orthodox Jewish life in Lawrence for decades. We are known for our exceptional tefillah schedule and serious commitment to Torah. Welcome!", author_name: "Shaaray Tefila Community" },
      { type: "general", title: "Early Minyan — Worth Waking Up For", body: "Our early Neitz minyan is one of the features that sets Shaaray Tefila apart. Daven with precision and kavanah, and still have your whole morning ahead of you. Try it!", author_name: "Gabbai" },
      { type: "general", title: "Beis Medrash — Open All Day", body: "Our Beis Medrash Zichron Amram is open throughout the day for learning. Whether you have 20 minutes or two hours, come sit and learn. Sefarim are available for all topics.", author_name: "Beis Medrash Committee" },
      { type: "announcement", title: "Shacharis Times — Updated for Spring", body: "With the changing zmanim, Shacharis times have been updated. Please check the shul entrance or website for this week's full schedule, including Neitz times.", is_official: true, author_name: "Shaaray Tefila Office" },
      { type: "announcement", title: "Pre-Pesach Sale and Chametz Inquiry", body: "The shul will be facilitating mechiyas chametz (sale of chametz) before Pesach. Forms are available at the office. Deadline to submit is the morning before bedikas chametz.", is_official: true, author_name: "Shaaray Tefila Office" },
    ],
    events: [
      { title: "Special Shabbos: Scholar in Residence", description: "We welcome a distinguished talmid chacham for a scholar-in-residence weekend. Friday night address and Shabbos morning shiur on a topic of contemporary halachic importance.", start_date: "2026-03-20", start_time: "8:00 PM", location: "Shaaray Tefila, 25 Central Ave, Lawrence" },
      { title: "Maot Chitim Campaign Launch", description: "We are launching our annual Maot Chitim campaign to help community members cover the costs of Pesach. Donating is easy and makes a huge difference to local families.", start_date: "2026-03-15", start_time: "9:00 AM", location: "Shaaray Tefila Office" },
    ],
    opportunities: [
      { title: "Shabbos Hospitality Program", description: "Welcome guests and newcomers to Shaaray Tefila by hosting them for a Shabbos meal. A beautiful mitzvah of hachnasat orchim that helps visitors feel at home in Lawrence.", category: "Shabbos Help", slots_needed: 4 },
      { title: "Learning Partner — Chavrusa Program", description: "Be paired with a community member for a weekly Torah learning session. The Beis Medrash can help match partners based on topic and schedule.", category: "Tutoring", location: "Shaaray Tefila Beis Medrash", slots_needed: 6 },
      { title: "Chessed Fund Coordination", description: "Help coordinate our community chessed fund, which provides discreet financial assistance to community members in need. Administrative skills helpful.", category: "Chesed", slots_needed: 2 },
    ]
  },
  "Congregation Bais Tefilah": {
    posts: [
      { type: "general", title: "Welcome to Congregation Bais Tefilah", body: "Congregation Bais Tefilah has been a beloved part of the Five Towns community for generations. Our shul is a place of tefillah, learning, and genuine community connection. Welcome!", author_name: "Congregation Bais Tefilah" },
      { type: "general", title: "Shabbos at Bais Tefilah", body: "Our Shabbos morning davening is warm and participatory, with beautiful communal singing. Kiddush follows and is a highlight of the week for our members and guests alike. Join us!", author_name: "Bais Tefilah Community" },
      { type: "general", title: "Chesed Committee Highlights", body: "Our chesed committee has been busy this month — coordinating meals for families, organizing hospital visits, and supporting members through difficult times. Thank you to all our volunteers!", author_name: "Bais Tefilah Chesed Committee" },
      { type: "announcement", title: "Upcoming Yom Tov Shiur Series", body: "In preparation for Purim and Pesach, we are offering a special weekly shiur series on the halachos and themes of the upcoming Yamim Tovim. All levels welcome.", is_official: true, author_name: "Rabbi's Office" },
      { type: "announcement", title: "Kiddush Sponsorship Available", body: "Sponsorships for upcoming Shabbos kiddushim are available. Honor a simcha, remember a loved one, or simply support the community. Contact the office to reserve your date.", is_official: true, author_name: "Bais Tefilah Office" },
    ],
    events: [
      { title: "Community Purim Megillah Reading", description: "Join us for a spirited and joyful Megillah reading for the whole family. Groggers welcome! Followed by a festive Purim celebration with refreshments.", start_date: "2026-03-13", start_time: "8:00 PM", location: "Bais Tefilah Sanctuary" },
      { title: "Shabbos Hagadol Drasha", description: "Our Rav will deliver the annual Shabbos Hagadol drasha — a classic pre-Pesach address on the themes of Geulah and Yetzias Mitzrayim. Not to be missed.", start_date: "2026-04-04", start_time: "5:00 PM", location: "Bais Tefilah Main Sanctuary" },
    ],
    opportunities: [
      { title: "Shabbos Meal Coordination", description: "Help coordinate Shabbos meals for new members, guests, and community members who could use the company and support. A fundamental mitzvah of hachnasat orchim.", category: "Shabbos Help", slots_needed: 5 },
      { title: "Pre-Pesach Food Distribution", description: "Help sort, pack, and distribute kosher-for-Pesach food packages to community members in need. Volunteer for a 3-hour shift before Yom Tov.", category: "Food Drive", location: "Bais Tefilah Social Hall", slots_needed: 12 },
      { title: "Teen Mentorship Program", description: "Mentor a teenager in our community who would benefit from a positive adult relationship and Torah guidance. Requires a 1-hour weekly commitment.", category: "Tutoring", slots_needed: 4 },
    ]
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const allCommunities = await base44.asServiceRole.entities.Community.list();
    const communityMap = {};
    for (const c of allCommunities) {
      communityMap[c.name] = c.id;
    }

    const results = { posts: 0, events: 0, opportunities: 0, skipped: [] };

    for (const [shulName, content] of Object.entries(SHUL_CONTENT)) {
      const communityId = communityMap[shulName];
      if (!communityId) {
        results.skipped.push(shulName);
        continue;
      }

      // Check if already seeded (avoid duplicates)
      const existingPosts = await base44.asServiceRole.entities.CommunityPost.filter({ community_id: communityId, is_seeded: true });
      if (existingPosts.length > 0) {
        // Already seeded — skip
        continue;
      }

      // Seed posts
      for (const post of content.posts) {
        await base44.asServiceRole.entities.CommunityPost.create({
          community_id: communityId,
          author_user_id: 'system',
          is_seeded: true,
          is_official: post.is_official || false,
          is_pinned: false,
          type: post.type,
          title: post.title || '',
          body: post.body,
          author_name: post.author_name || shulName,
        });
        results.posts++;
      }

      // Seed events
      for (const ev of content.events) {
        await base44.asServiceRole.entities.CommunityEvent.create({
          community_id: communityId,
          title: ev.title,
          description: ev.description || '',
          start_date: ev.start_date || '',
          start_time: ev.start_time || '',
          location: ev.location || '',
          is_seeded: true,
          is_official: false,
        });
        results.events++;
      }

      // Seed mitzvah opportunities
      for (const op of content.opportunities) {
        await base44.asServiceRole.entities.MitzvahOpportunity.create({
          community_id: communityId,
          title: op.title,
          description: op.description || '',
          category: op.category || 'Chesed',
          location: op.location || '',
          slots_needed: op.slots_needed || 1,
          slots_filled: 0,
          is_active: true,
          is_seeded: true,
        });
        results.opportunities++;
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});