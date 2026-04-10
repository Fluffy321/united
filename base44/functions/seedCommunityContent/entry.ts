import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Weekly seed so the shown subset rotates every 7 days
function weekNumber() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const db = base44.asServiceRole;

    const communityDefs = [
      {
        name: 'Young Israel Woodmere',
        type: 'Shul',
        description: 'The heart of the Woodmere community — minyanim, shiurim, and meaningful connections.',
        description_short: "Woodmere's flagship shul community.",
        neighborhood: 'Woodmere',
        follower_count: 430,
        is_verified: true,
      },
      {
        name: 'HAFTR Day School',
        type: 'School',
        description: 'Hebrew Academy of the Five Towns & Rockaway — a K-12 community of students, parents, and alumni.',
        description_short: 'Five Towns leading Jewish day school.',
        neighborhood: 'Lawrence',
        follower_count: 320,
        is_verified: true,
      },
      {
        name: 'Five Towns Chessed Network',
        type: 'Other',
        description: 'Connecting neighbors who want to help with neighbors who need help. Every act of kindness counts.',
        description_short: 'Community chesed and volunteering hub.',
        neighborhood: 'Five Towns',
        follower_count: 190,
      },
    ];

    const names = [
      'Moshe Friedman', 'Rivka Cohen', 'Yaakov Stein', 'Chana Levi', 'Dovid Katz',
      'Sarah Goldberg', 'Avi Weiss', 'Miriam Shapiro', 'Binyamin Rosen', 'Leah Horowitz',
      'Nechama Blum', 'Yisrael Gross', 'Batya Segal', 'Akiva Mandel', 'Tova Berger',
      'Shmuel Adler', 'Faigy Klein', 'Ezra Rubin', 'Devorah Schwartz', 'Pinchus Lipman',
    ];
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randName = () => pick(names);
    const uid = () => 'seed_' + Math.random().toString(36).substr(2, 8);
    const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();
    const results = { communities: [], posts: 0, prompts: 0, events: 0, comments: 0 };

    // ── FULL post pool per community (20 posts each = 60 total) ──────────────
    const postPool = {
      'Young Israel Woodmere': [
        // Shabbat & Minyan
        { body: 'Kabbalas Shabbos this week is at 7:15. Kiddush sponsored by the Greenberg family in honor of their son\'s Bar Mitzvah — all are welcome!' },
        { body: 'Anyone know if there\'s a vasikin minyan this Sunday? Traveling early and would love to daven before hitting the road.' },
        { body: 'Reminder that Shabbos afternoon mincha is at 4:30 this week due to daylight saving time. Please spread the word.' },
        { body: 'There\'s something magical about walking to shul on a quiet Shabbos morning in Woodmere. Grateful to be part of this community 🙏' },
        { body: 'Quick shoutout to the gabbai team for their incredible work keeping minyanim running every single day. Unsung heroes.' },

        // Torah & Learning
        { title: 'New Daf Yomi Shiur Starting', body: 'Starting a beginner-friendly Daf Yomi shiur Sunday mornings at 8am. Coffee and danishes provided. No experience required — just enthusiasm.' },
        { body: 'Who else was at the Thursday night parsha shiur? Rabbi\'s vort on the connection between this week\'s parsha and current events was incredible. Standing room only.' },
        { body: 'Looking for a chavrusa for Mishna Berura in the evenings — even twice a week would be great. Anyone interested in learning together in Woodmere?' },
        { body: 'Beautiful takeaway from the rav this Shabbos: "A single moment of genuine tefillah changes a person forever." Still thinking about it.' },
        { body: 'Is anyone doing the OU\'s Nach Yomi program? Would love to find a Woodmere learning buddy to go through it together.' },

        // Community & Simcha
        { title: 'Mazel Tov to the Rubin Family!', body: 'Please join us in congratulating the Rubin family on the birth of a baby boy! 🎀 May they have much nachas. Shabbos kiddush this week is in their honor.' },
        { body: 'Mazel tov to longtime member Reb Shlomo Katz on his son\'s engagement! A special kiddush will be held after davening this Shabbos. All are welcome.' },
        { title: 'Tehillim Request', body: 'Please say Tehillim for Chana bas Rivka who is recovering from surgery. May she have a full and speedy refuah shleima b\'karov.' },
        { body: 'After 12 years as our youth director, Rabbi Berger is moving on. His impact on hundreds of kids is immeasurable. Wishing him and his family all the best. 💙' },

        // Help & Practical
        { body: 'Does anyone have a recommendation for a mohel in the area? A dear friend just had a baby boy and is looking for someone local. Thank you!' },
        { body: 'Quick favor: anyone driving past the JCC on Sunday morning who could drop off a few boxes? Moving some Bikur Cholim supplies. 20 minutes max.' },
        { body: 'Looking to borrow a folding table and 6 chairs for a kiddush I\'m making next Shabbos. Can anyone in the Woodmere area help? Will return Sunday.' },

        // Events & Announcements
        { title: 'Youth Group Purim Carnival', body: 'Save the date! Annual Purim carnival for kids ages 4-12 on Purim afternoon. Prizes, games, food, and fun. Volunteers needed — contact the youth director to sign up.' },
        { title: 'Women\'s Shabbaton — Early Bird Pricing', body: 'Our annual women\'s Shabbaton is filling up fast! A beautiful and meaningful weekend away. Early bird pricing ends this Friday. Sign up at the shul office.' },
        { title: 'Speed Friending Event', body: 'New to Woodmere or just want to meet more neighbors? Join our "speed friending" evening — 5 minutes with 12 different community members. Fun, easy, and maybe a lifelong friendship!' },
      ],

      'HAFTR Day School': [
        // School Updates
        { title: 'Spring P/T Conferences — Sign Up Now', body: 'Scheduling is open for spring parent-teacher conferences. Please sign up through the parent portal by Friday. Slots fill quickly — don\'t wait!' },
        { body: 'Half day reminder: Monday dismissal is at 12:30pm due to faculty professional development. After-care available until 5pm as usual.' },
        { title: 'Camp Registration Opens Tomorrow', body: 'Registration for the HAFTR summer day camp opens tomorrow at 9am. Spots fill within hours — log in to the parent portal tonight to make sure your account is ready.' },
        { body: 'Friendly reminder that the school book fair starts this Monday. A great opportunity to pick up something new for your reader and support the school library at the same time!' },
        { body: 'The middle school\'s Gemara siyum was absolutely beautiful today. Watching the boys make the bracha brought tears to so many eyes. Our teachers are doing incredible work.' },

        // Parent Community
        { body: 'Anyone carpooling from the Woodmere/Hewlett area to school in the mornings? Happy to rotate driving — looking for 2-3 families to coordinate with.' },
        { body: 'Looking for a math tutor for my 7th grader — specifically algebra. She\'s great but could use extra support before finals. Anyone have a recommendation?' },
        { body: 'My son keeps raving about his Chumash teacher this year. It\'s so special when kids are genuinely excited about Judaics. The faculty here is something else.' },
        { body: 'Is there a HAFTR parents WhatsApp group for the 5th grade? Would love to connect with other parents in my daughter\'s class.' },
        { body: 'After-school activity ideas for my 4th grader — she loves art and music. Are there any good programs in the Five Towns that other parents love? Not looking to overschedule but one solid option.' },

        // Simcha & Milestones
        { title: 'Science Fair Winners 🎉', body: 'Mazal tov to all our science fair participants! First place went to 8th grader Ellie Stern for her water filtration project. Every student who entered should feel proud.' },
        { body: 'Mazel tov to the Cohen family — their daughter just got into her top choice high school! The relief on that mom\'s face this morning said everything. 🎊' },
        { body: 'My daughter finished her first full chapter book in Hebrew this week. Can\'t describe the pride. The day school system here is doing something very right. 📚' },
        { body: 'Shoutout to the 2nd grade teachers on the Chumash play — it was incredible! The kids worked so hard and it showed. Tears of joy all around.' },

        // Practical Help
        { body: 'Is the school bus on Central Ave running late this week? My son missed it twice and I\'m not sure if the schedule changed or if there\'s a route issue.' },
        { body: 'Looking for a reliable babysitter for occasional evenings — we\'re HAFTR parents and prefer someone connected to the community. Kids are 7 and 10. References welcome.' },
        { body: 'Any recommendations for a Bat Mitzvah tutor? My daughter is 14 months out and we\'d love to start preparation now. Preferably female, available afternoons.' },

        // Community Feel
        { body: 'Seven years at this school and I am still moved by the sense of community here. This morning\'s assembly about chesed was just one example of why we made the right choice.' },
        { title: 'High School Musical Auditions', body: 'Auditions for this year\'s spring musical are next Tuesday after school. Open to all high school students — don\'t be shy! Come show what you\'ve got.' },
        { body: 'The HAFTR alumni page online has been so fun to revisit — seeing where everyone ended up. Class of 2010 reunion anyone? 😄' },
      ],

      'Five Towns Chessed Network': [
        // Help Requests & Logistics
        { title: 'Meal Train — Stern Family', body: 'Mazel tov to the Stern family on their new baby! Meal train is now open. Any dish welcome — even simple. Click the link to sign up for a date.' },
        { body: 'Does anyone have a folding table and 6 chairs they can lend for our soup kitchen event this Thursday? Just need them for 24 hours. Happy to pick up and return.' },
        { body: 'Looking for someone who can help an elderly woman in Cedarhurst with grocery shopping once a week. Just a few hours, makes a world of difference. Please reach out.' },
        { body: 'A family that recently lost their home in a fire is rebuilding from scratch. Does anyone have gently used furniture — beds, couch, kitchen table? Anything helps.' },
        { title: 'Help Needed: Moving Crew', body: 'A widowed woman in Lawrence needs help moving to a smaller apartment this Sunday morning. Just 3-4 hours of your time — huge mitzvah. Message me if you can come.' },
        { body: 'Anyone available to drive an elderly man from Woodmere to his doctor appointment in Garden City this Tuesday around 10am? He has no family nearby.' },

        // Volunteering & Events
        { title: 'Urgent: Blood Drive This Sunday', body: 'We\'re hosting a blood drive this Sunday 10am–3pm at the JCC. We need 40 donors to hit our goal. Come and bring a friend — every donation saves up to 3 lives. Walk-ins welcome.' },
        { title: 'Volunteer Appreciation Dinner', body: 'Annual volunteer appreciation dinner is coming up next month! If you\'ve given even a single hour of your time this year, you deserve to be celebrated. RSVP to reserve your free spot.' },
        { title: 'Monthly Bikur Cholim Visit', body: 'Tomorrow\'s monthly hospital visit leaves from Central and Broadway at 10am. No experience needed — we just bring warmth. Come even for 30 minutes.' },
        { body: 'Our annual coat drive is in full swing. Drop off new or gently used coats at the Woodmere JCC through this Sunday. All sizes needed — especially children\'s!' },
        { body: 'Volunteer training session for our new meal delivery volunteers this Wednesday night. 45 minutes, covers everything you need to know. Please come if you\'ve signed up.' },

        // Community Impact & Recognition
        { body: 'Shoutout to everyone who came out for last week\'s coat drive — we collected over 200 coats! The Bikur Cholim society will distribute them this week. So proud of this community.' },
        { body: 'Thank you to everyone who arranged rides for the Rosenberg family during shiva last week. No announcement, no fanfare — people just showed up. That\'s what we\'re about.' },
        { body: 'We just passed 500 volunteer signups this year. 500 people who said yes. Five Towns, you should be so proud. Am Yisrael Chai 🙏' },
        { body: 'A woman reached out to thank our network today for the help she received during a hard month. She wrote: "I felt invisible until you knocked on my door." That\'s why we do this.' },

        // Prompts & Discussions
        { body: 'Question for the community: what\'s the chesed opportunity in the Five Towns that more people should know about? Drop it below and let\'s share resources.' },
        { body: 'What\'s the smallest act of kindness someone did for you that made the biggest impact? I\'ll start: a neighbor shoveled my driveway without being asked during the hardest week of my life.' },
        { body: 'If you could start one new chesed initiative in the Five Towns, what would it be? Love to hear ideas from this community.' },

        // Practical & Seasonal
        { body: 'Pre-Pesach reminder: our annual pre-Yom Tov food distribution is coming up. Volunteer drivers and sorters needed. Check the pinned post for dates and sign-up link.' },
        { title: 'Community Chesed Fair Coming', body: 'Our annual chesed fair is next month! Dozens of local organizations will be tabling. Come see how you can get involved and make a real difference. Bring the whole family.' },
        { body: 'Just a reminder that our free food pantry is open every Tuesday and Thursday 4-6pm. If you or someone you know needs support, please don\'t hesitate. We\'re here — no questions asked.' },
      ],
    };

    const commentsByType = {
      'Young Israel Woodmere': [
        'Thank you for sharing! Will be there 🙏',
        'Yasher koach to everyone involved.',
        'Is this open to non-members as well?',
        'Kol hakavod! This is what community is all about.',
        'Can someone send the Zoom link for the shiur?',
        'We\'ll be there — save us seats!',
        'Such a beautiful minhag. Love this shul.',
        'Does the kiddush require an RSVP?',
        'Really needed to hear this today. Thank you.',
        'Sharing with my family — they\'ll want to know.',
        'Baruch Hashem, this community is something else.',
        'Looking forward to it! Will bring a friend.',
      ],
      'HAFTR Day School': [
        'Thank you for the heads up! Signing up now.',
        'My kids love it — highly recommend.',
        'Can someone share the carpool WhatsApp group?',
        'This is why we love this school. So organized.',
        'Mazal tov to the students! So proud! 🎉',
        'Does anyone know if there\'s a waitlist?',
        'Would love to connect with other parents in that grade.',
        'Forwarding to my neighbor — her daughter is in the same class.',
        'The teachers here are truly exceptional.',
        'My son is already so excited. Thank you for organizing this!',
        'Great initiative — exactly what we needed.',
        'Signed up! Can\'t wait.',
      ],
      'Five Towns Chessed Network': [
        'Signed up! Happy to help 🤍',
        'This community is incredible. Truly.',
        'Can I drop off on Thursday evening?',
        'Count me in for Sunday.',
        'Such an important cause. Sharing with my family.',
        'Yasher koach to all the organizers!',
        'Does the meal need to be chalav Yisrael?',
        'Kol hakavod — Am Yisrael Chai!',
        'Just signed up. So glad this exists.',
        'We need more people like this in the world.',
        'Will bring a friend along. Thank you for everything you do.',
        'This touched my heart. Sharing now.',
      ],
    };

    for (const def of communityDefs) {
      const community = await db.entities.Community.create({
        ...def,
        created_by_user_id: uid(),
        is_seeded: true,
      });
      results.communities.push(community.name);

      const allPosts = postPool[def.name] || [];
      const comments = commentsByType[def.name] || [];

      // Use week number to pick a rotating subset of 12 posts to "surface"
      // but seed all 20 so the pool exists in the DB
      const week = weekNumber();

      for (let i = 0; i < allPosts.length; i++) {
        const p = allPosts[i];
        const authorName = randName();
        // Stagger timestamps: newer posts surfaced by weekly rotation get more recent dates
        const isThisWeek = (i + week) % 3 !== 0; // ~2/3 get recent timestamps, rotates weekly
        const daysOffset = isThisWeek ? (i * 0.4 + Math.random() * 0.5) : (i * 0.6 + 4 + Math.random());
        const post = await db.entities.CommunityPost.create({
          community_id: community.id,
          author_name: authorName,
          author_user_id: uid(),
          title: p.title || null,
          body: p.body,
          likes_count: Math.floor(Math.random() * 28) + 2,
          comments_count: 0,
          created_date: daysAgo(daysOffset),
          is_seeded: true,
        });
        results.posts++;

        // 2–5 comments per post
        const numComments = 2 + Math.floor(Math.random() * 4);
        for (let c = 0; c < numComments; c++) {
          await db.entities.Comment.create({
            post_id: post.id,
            author_id: uid(),
            author_name: randName(),
            body: comments[(i * 5 + c) % comments.length],
            created_date: daysAgo(daysOffset - Math.random() * 0.4),
          });
          results.comments++;
        }
      }

      // ── Prompts (3 per community) ────────────────────────────────────────
      const promptPool = {
        'Young Israel Woodmere': [
          'What\'s your favorite part of Shabbos in the Five Towns?',
          'Which shiur or learning program has impacted you most this year?',
          'What\'s one thing you wish more people knew about our shul?',
          'What\'s your earliest Shabbos memory in this community?',
          'What\'s a mitzvah you\'ve taken on recently that changed your week?',
        ],
        'HAFTR Day School': [
          'What advice would you give to an incoming 9th grader?',
          'What\'s the most memorable school event or trip you\'ve been part of?',
          'What do you think makes the HAFTR community special?',
          'What\'s something a teacher said that you still think about today?',
          'What\'s one tradition you hope the school keeps for the next generation?',
        ],
        'Five Towns Chessed Network': [
          'What\'s the smallest act of chesed that made the biggest difference to you?',
          'How has volunteering in this community changed your perspective?',
          'What\'s one chesed initiative you\'d love to see launched in the Five Towns?',
          'Tell us about a moment when a stranger\'s kindness surprised you.',
          'What does "tikun olam" look like in your daily life?',
        ],
      };

      const prompts = promptPool[def.name] || [];
      // Rotate which 3 prompts are "active" this week
      const startIdx = week % (prompts.length - 2);
      const activePrompts = prompts.slice(startIdx, startIdx + 3);

      for (let i = 0; i < activePrompts.length; i++) {
        await db.entities.CommunityPrompt.create({
          community_id: community.id,
          prompt_text: activePrompts[i],
          created_by_user_id: uid(),
          created_by_name: randName(),
          created_date: daysAgo(i + 1),
          is_seeded: true,
        });
        results.prompts++;
      }

      // ── Events (2 per community) ─────────────────────────────────────────
      const eventPool = {
        'Young Israel Woodmere': [
          {
            title: 'Shabbaton for Young Couples',
            description: 'A special Shabbaton for couples in their 20s and 30s. Friday night dinner, Saturday morning kiddush, and afternoon programming. Limited spots — RSVP required.',
            start_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            location_text: 'Young Israel of Woodmere',
          },
          {
            title: 'Thursday Night Parsha Shiur',
            description: 'Weekly parsha shiur with the rav. This week\'s topic is especially timely. Open to all. Refreshments served. 8:00 PM.',
            start_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
            location_text: 'Young Israel of Woodmere Beis Medrash',
          },
        ],
        'HAFTR Day School': [
          {
            title: 'Spring Parent-Teacher Conferences',
            description: 'Sign up for your spring conference through the parent portal. Slots fill quickly — schedule early.',
            start_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
            location_text: 'HAFTR Campus, Lawrence',
          },
          {
            title: 'Annual Alumni Shabbos',
            description: 'All HAFTR alumni invited back for a special Shabbos weekend. Reconnect with old friends and meet current students and faculty.',
            start_date: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
            location_text: 'HAFTR Campus, Lawrence',
          },
        ],
        'Five Towns Chessed Network': [
          {
            title: 'Community Chesed Fair',
            description: 'Dozens of local organizations tabling to share volunteer opportunities. Come see how you can make a real difference. Bring the whole family.',
            start_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
            location_text: 'Adelsberg JCC, Woodmere',
          },
          {
            title: 'Blood Drive — This Sunday',
            description: 'We need 40 donors to reach our goal. Walk-ins welcome 10am–3pm. Every donation saves up to 3 lives.',
            start_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            location_text: 'Five Towns JCC',
          },
        ],
      };

      const events = eventPool[def.name] || [];
      for (const eventDef of events) {
        await db.entities.CommunityEvent.create({
          community_id: community.id,
          ...eventDef,
          created_by_user_id: uid(),
          is_seeded: true,
        });
        results.events++;
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('seedCommunityContent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});