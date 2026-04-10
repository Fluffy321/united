import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
        description_short: 'Woodmere\'s flagship shul community.',
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

    const postTemplates = {
      'Young Israel Woodmere': [
        { title: 'Shabbos Minyanim This Week', body: 'Kabbalas Shabbos is at 7:15 this week followed by a kiddush sponsored by the Greenberg family in honor of their son\'s Bar Mitzvah. All are welcome — there\'s always room for more!' },
        { body: 'Anyone know if there\'s a vasikin minyan this Sunday? Traveling early and would love to daven before hitting the road.' },
        { title: 'New Daf Yomi Shiur Starting', body: 'Starting a beginner-friendly Daf Yomi shiur Sunday mornings at 8am. Coffee and danishes provided. No prior learning required — just bring your enthusiasm and a chevrusa mindset.' },
        { body: 'Beautiful vort from the Rav last Shabbos on parshas hashavua — he connected it to something in the news that really hit home. Anyone else thinking about it?' },
        { title: 'Kiddush This Shabbos', body: 'This week\'s kiddush is sponsored in honor of Mazal Tov to the Rubin family on the birth of a baby boy! Cholent, herring, and the usual spread. Come hungry.' },
        { body: 'Does anyone have a recommendation for a mohel in the area? A close friend just had a baby boy and is looking for someone local. Tizku l\'mitzvos!' },
        { body: 'Reminder: The shul\'s annual dinner is coming up in 3 weeks. Early bird pricing ends this Sunday. Great cause, great food — come support the community.' },
        { title: 'Tehillim Request', body: 'Please say Tehillim for Chana bas Rivka who is recovering from surgery. May she have a refuah shleima b\'karov. Minyan for Tehillim Sunday at 8:30am.' },
        { body: 'Who else made it to Rabbi Stern\'s Thursday night shiur this week? That was one of the best sessions all year. Would love to discuss.' },
        { body: 'Quick favor — anyone driving from the Woodmere area toward JFK early tomorrow morning? Happy to split the Uber cost if someone\'s heading that way anyway.' },
      ],
      'HAFTR Day School': [
        { title: 'Spring Parent-Teacher Conferences', body: 'Scheduling is now open for spring P/T conferences. Please sign up through the parent portal by Friday. Slots fill up fast — don\'t wait until the last minute!' },
        { body: 'Anyone know if the school bus route on Central Ave is running late this week? My daughter missed it both Monday and Tuesday and I\'m not sure if it\'s a schedule change.' },
        { title: 'Science Fair Winners 🎉', body: 'Mazal tov to all our science fair participants! First place went to 8th grader Ellie Stern for her water filtration project. So proud of every single student who participated.' },
        { body: 'Is anyone carpooling from the Woodmere/Hewlett area toward school in the mornings? Happy to rotate driving if we can find 2-3 other families.' },
        { body: 'My son keeps talking about the Chumash play rehearsals — sounds like the 2nd grade teachers are putting together something really special this year. Anyone else hearing great things?' },
        { title: 'Camp Registration Opens Tomorrow', body: 'A reminder that registration for the HAFTR summer day camp opens tomorrow morning at 9am. Spots fill up within hours. Log in to the parent portal tonight to make sure your account is ready.' },
        { body: 'Looking for a math tutor for my 7th grader — specifically algebra. She\'s doing well but could use some extra support before finals. Any recommendations from other HAFTR parents?' },
        { body: 'Mazal tov to the Cohen family on their daughter\'s Bat Mitzvah this Shabbos! She gave a dvar Torah at school last week that had everyone in tears. Beautiful kid.' },
        { title: 'After-School Activity Ideas', body: 'Looking for enrichment ideas for my 4th grader after school. She loves art and music. Are there any good programs in the Five Towns area that other parents love? Not looking to overschedule but one solid activity would be great.' },
        { body: 'Half day reminder: Monday dismissal is at 12:30pm due to faculty professional development. After-care will be available until 5pm as usual.' },
      ],
      'Five Towns Chessed Network': [
        { title: 'Meal Train: Stern Family', body: 'Mazel tov to the Stern family on their new baby! Meal train is open — any dish is welcome, even simple. Click the link to sign up. Even one meal makes a huge difference to a new mom.' },
        { body: 'Does anyone have a spare folding table and 6 chairs they can lend for our soup kitchen event this Thursday? Just need them for 24 hours. Happy to pick up and return.' },
        { title: 'Urgent: Blood Drive This Sunday', body: 'We\'re hosting a blood drive this Sunday 10am–3pm at the JCC. We need 40 donors to meet our goal. Please come — and bring a friend. Every donation saves up to 3 lives. Walk-ins welcome.' },
        { body: 'Shoutout to everyone who came out for last week\'s coat drive — we collected over 200 coats! The Bikur Cholim society will distribute them this week. You should all feel incredibly proud.' },
        { body: 'Looking for someone who can help an elderly woman in Cedarhurst with grocery shopping once a week. Just a few hours, makes a huge difference. Let me know if you\'re interested.' },
        { title: 'Volunteer Appreciation Dinner', body: 'We\'re hosting our annual volunteer appreciation dinner next month. If you\'ve given even a single hour this year, you deserve to be celebrated. Dinner is free for volunteers — RSVP to reserve your spot.' },
        { body: 'Anyone have gently used furniture they\'re getting rid of? A local family that lost their home in a fire is furnishing from scratch. Beds, couch, table — anything helps.' },
        { body: 'Thank you to everyone who helped arrange rides for the Rosenberg family during shiva last week. This community truly knows how to show up. Am Yisrael Chai.' },
        { body: 'Reminder: tomorrow is our monthly Bikur Cholim hospital visit. Meeting at 10am at the corner of Central and Broadway. No experience needed — we just bring warmth and companionship.' },
        { title: 'Help Needed: Moving Crew', body: 'A widowed woman in Lawrence needs help moving to a smaller apartment this Sunday. Just a few strong hands for 3-4 hours in the morning. If you can help, message me here. Big mitzvah!' },
      ],
    };

    const commentsByTopic = {
      shul: [
        'Thank you for the update — will definitely be there!',
        'Yasher koach to everyone who organized this 🙏',
        'Is this open to non-members as well?',
        'Does the kiddush require RSVP?',
        'Kol hakavod! This is what community is all about.',
        'Can someone share the Zoom link for the shiur?',
        'We\'ll be there — saving us seats!',
        'Such a beautiful minhag. Love this shul.',
      ],
      school: [
        'Thank you for the heads up! Signing up now.',
        'My kids love the after-school program — highly recommend.',
        'Can someone share the carpool WhatsApp group?',
        'This is why we love this school — always so organized.',
        'Mazal tov to the students! So proud.',
        'Does anyone know if there\'s a waitlist?',
        'Great idea — would love to connect with other parents.',
        'Forwarding to my neighbor — her daughter is in the same grade.',
      ],
      chessed: [
        'Signed up! Happy to help 🤍',
        'This community is incredible. Truly.',
        'Can I drop off on Thursday evening?',
        'Count me in for Sunday.',
        'Such an important cause. Sharing with my family.',
        'Yasher koach to all the organizers!',
        'Does it need to be kosher? (asking about the meal train)',
        'Kol hakavod — am Yisrael chai!',
      ],
    };

    for (const def of communityDefs) {
      const community = await db.entities.Community.create({
        ...def,
        created_by_user_id: uid(),
        is_seeded: true,
      });
      results.communities.push(community.name);

      const topicKey = def.type === 'Shul' ? 'shul' : def.type === 'School' ? 'school' : 'chessed';
      const comments = commentsByTopic[topicKey];

      const posts = postTemplates[def.name] || [];
      for (let i = 0; i < posts.length; i++) {
        const p = posts[i];
        const authorName = randName();
        const post = await db.entities.CommunityPost.create({
          community_id: community.id,
          author_name: authorName,
          author_user_id: uid(),
          title: p.title || null,
          body: p.body,
          likes_count: Math.floor(Math.random() * 25) + 2,
          comments_count: 0,
          created_date: daysAgo(i * 0.7 + Math.random() * 0.5),
          is_seeded: true,
        });
        results.posts++;

        const numComments = 2 + Math.floor(Math.random() * 4);
        for (let c = 0; c < numComments; c++) {
          await db.entities.Comment.create({
            post_id: post.id,
            author_id: uid(),
            author_name: randName(),
            body: comments[(i * 4 + c) % comments.length],
            created_date: daysAgo(i * 0.7 + Math.random() * 0.4),
          });
          results.comments++;
        }
      }

      // Prompts
      const promptTemplates = {
        'Young Israel Woodmere': [
          'What\'s your favorite part of Shabbos in the Five Towns?',
          'Which shiur or learning program has impacted you most this year?',
          'What\'s one thing you wish more people knew about our shul?',
        ],
        'HAFTR Day School': [
          'What advice would you give to an incoming 9th grader?',
          'What\'s the most memorable school event or trip you\'ve been part of?',
          'What do you think makes the HAFTR community special?',
        ],
        'Five Towns Chessed Network': [
          'What\'s the smallest act of chesed that made the biggest difference to you?',
          'How has volunteering in this community changed your perspective?',
          'What\'s one way you think we can help more people in the Five Towns?',
        ],
      };

      const prompts = promptTemplates[def.name] || [];
      for (let i = 0; i < prompts.length; i++) {
        await db.entities.CommunityPrompt.create({
          community_id: community.id,
          prompt_text: prompts[i],
          created_by_user_id: uid(),
          created_by_name: randName(),
          created_date: daysAgo(i + 2),
          is_seeded: true,
        });
        results.prompts++;
      }

      // Events
      const eventTemplates = {
        'Young Israel Woodmere': {
          title: 'Shabbaton for Young Couples',
          description: 'A special Shabbaton for couples in their 20s and 30s. Friday night dinner, Saturday kiddush, and afternoon programming. Limited spots — RSVP required.',
          start_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          location_text: 'Young Israel of Woodmere',
        },
        'HAFTR Day School': {
          title: 'Annual Alumni Shabbos',
          description: 'All HAFTR alumni invited back for a special Shabbos weekend. Reconnect with old friends, meet current students and faculty.',
          start_date: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
          location_text: 'HAFTR Campus, Lawrence',
        },
        'Five Towns Chessed Network': {
          title: 'Community Chesed Fair',
          description: 'Dozens of local organizations tabling to share volunteer opportunities. Come see how you can get involved and make a real difference.',
          start_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          location_text: 'Adelsberg JCC, Woodmere',
        },
      };

      const eventDef = eventTemplates[def.name];
      if (eventDef) {
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