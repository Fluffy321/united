import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const db = base44.asServiceRole;

    // ── 3 communities ────────────────────────────────────────
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
      ['Moshe Friedman', 'Rivka Cohen', 'Yaakov Stein', 'Chana Levi', 'Dovid Katz',
       'Sarah Goldberg', 'Avi Weiss', 'Miriam Shapiro', 'Binyamin Rosen', 'Leah Horowitz'],
    ][0];
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randName = () => pick(names);
    const uid = () => 'seed_' + Math.random().toString(36).substr(2, 8);
    const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

    const results = { communities: [], posts: 0, prompts: 0, events: 0, comments: 0 };

    for (const def of communityDefs) {
      // Create community
      const community = await db.entities.Community.create({
        ...def,
        created_by_user_id: uid(),
        is_seeded: true,
      });
      results.communities.push(community.name);

      // ── Posts (4–5 per community) ─────────────────────────
      const postTemplates = {
        'Young Israel Woodmere': [
          { title: 'Shabbos Minyanim Update', body: 'Kabbalas Shabbos is at 7:15 this week. Followed by a special kiddush sponsored by the Greenberg family in honor of their son\'s Bar Mitzvah. All are welcome!' },
          { title: 'New Daf Yomi Shiur', body: 'Starting a beginner-friendly Daf Yomi shiur Sunday mornings at 8am. Coffee and danishes provided. No prior learning required — just bring your enthusiasm!' },
          { title: 'Community Tehillim Request', body: 'Please say Tehillim for Chana bas Rivka who is recovering from surgery. May she have a refuah shleima b\'karov.' },
          { title: 'Youth Group Purim Carnival', body: 'Save the date! Annual Purim carnival for kids ages 4-12 on Purim afternoon. Prizes, games, food, and fun. Volunteers needed — contact the youth director.' },
          { body: 'Anyone know if there\'s a vasikin minyan this Sunday? Traveling and would love to daven early.' },
        ],
        'HAFTR Day School': [
          { title: 'Spring Parent-Teacher Conferences', body: 'Scheduling is now open for spring P/T conferences. Please sign up through the parent portal by Friday. Slots fill up fast!' },
          { title: 'Science Fair Winners', body: 'Mazal tov to all our science fair participants! First place went to 8th grader Ellie Stern for her project on water filtration. So proud of all our students!' },
          { title: 'High School Musical Auditions', body: 'Auditions for this year\'s spring musical are next Tuesday after school. Open to all high school students. Come show off your talent!' },
          { body: 'Quick reminder that Monday is a half day due to faculty professional development. Dismissal at 12:30pm. After-care will be available.' },
          { body: 'Is anyone carpooling from the Woodmere area to the 8am minyan before school? Would love to coordinate with other parents.' },
        ],
        'Five Towns Chessed Network': [
          { title: 'Meal Train for New Mom', body: 'Mazel tov to the Stern family on their new baby! Meal train is open — click the link to sign up for a date that works for you. Even a simple dish makes a huge difference.' },
          { title: 'Volunteer Appreciation Dinner', body: 'We\'re hosting our annual volunteer appreciation dinner next month. If you\'ve given even a single hour this year, you deserve to be celebrated. RSVP to reserve your spot.' },
          { title: 'Urgent: Blood Drive This Sunday', body: 'We\'re hosting a blood drive this Sunday 10am–3pm at the JCC. We need 40 donors to meet our goal. Please come and bring a friend. Every donation saves up to 3 lives.' },
          { body: 'Does anyone have a spare folding table and chairs they can lend for a soup kitchen event next week? Just need them for 2 days.' },
          { body: 'Shoutout to everyone who helped with last week\'s coat drive — we collected over 200 coats! The Bikur Cholim society will distribute them this week. You should all be so proud.' },
        ],
      };

      const posts = postTemplates[def.name] || [];
      for (let i = 0; i < posts.length; i++) {
        const p = posts[i];
        const authorId = uid();
        const authorName = randName();
        const post = await db.entities.CommunityPost.create({
          community_id: community.id,
          author_name: authorName,
          author_user_id: authorId,
          title: p.title || null,
          body: p.body,
          likes_count: Math.floor(Math.random() * 20) + 3,
          comments_count: 0,
          created_date: daysAgo(i + 1),
          is_seeded: true,
        });
        results.posts++;

        // 3–5 comments per post
        const commentTexts = [
          'Thank you for sharing this!',
          'Really appreciate the update. Will be there!',
          'Can someone send me the Zoom link?',
          'Yasher koach to everyone involved 🙏',
          'We need more initiatives like this.',
          'Such a beautiful thing for our community.',
          'Is this open to non-members as well?',
          'Forwarding to my family — they\'ll want to know.',
          'Does anyone know if parking will be available?',
          'Amazing work. Kol hakavod!',
        ];
        const numComments = 3 + Math.floor(Math.random() * 3);
        for (let c = 0; c < numComments; c++) {
          await db.entities.Comment.create({
            post_id: post.id,
            author_id: uid(),
            author_name: randName(),
            body: commentTexts[(i * 3 + c) % commentTexts.length],
            created_date: daysAgo(i + Math.random()),
          });
          results.comments++;
        }
      }

      // ── Prompt posts (2 per community) ───────────────────
      const promptTemplates = {
        'Young Israel Woodmere': [
          'What\'s your favorite part of Shabbos in the Five Towns?',
          'What shiur or learning program has impacted you most this year?',
        ],
        'HAFTR Day School': [
          'What advice would you give to an incoming 9th grader at HAFTR?',
          'What\'s the most memorable school event or trip you\'ve been part of?',
        ],
        'Five Towns Chessed Network': [
          'What\'s the smallest act of chesed that made the biggest difference to you?',
          'How has volunteering in this community changed your perspective?',
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

      // ── 1 event per community ─────────────────────────────
      const eventTemplates = {
        'Young Israel Woodmere': {
          title: 'Shabbaton for Young Couples',
          description: 'A special Shabbaton for couples in their 20s and 30s. Friday night dinner, Saturday morning kiddush, and afternoon programming. Limited spots — RSVP required.',
          start_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          location_text: 'Young Israel of Woodmere',
        },
        'HAFTR Day School': {
          title: 'Annual Alumni Shabbos',
          description: 'All HAFTR alumni are invited back for a special Shabbos weekend. Reconnect with old friends and meet current students and faculty.',
          start_date: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
          location_text: 'HAFTR Campus, Lawrence',
        },
        'Five Towns Chessed Network': {
          title: 'Community Chesed Fair',
          description: 'Dozens of local organizations will be tabling to share volunteer opportunities. Come see how you can get involved and make a real difference.',
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