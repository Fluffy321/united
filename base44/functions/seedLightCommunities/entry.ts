import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const COMMUNITIES = [
  {
    name: "HAFTR Day School",
    type: "School",
    category: "Schools & Yeshivas",
    description_short: "A leading Jewish day school serving grades K–12 in Lawrence.",
    neighborhood: "Lawrence",
    follower_count: 310,
  },
  {
    name: "Yeshiva of Far Rockaway",
    type: "Yeshiva",
    category: "Schools & Yeshivas",
    description_short: "Post-high school yeshiva with a strong beis midrash program.",
    neighborhood: "Far Rockaway",
    follower_count: 190,
  },
  {
    name: "Five Towns Chessed Network",
    type: "Other",
    category: "Chessed & Volunteering",
    description_short: "Connecting volunteers with families in need across the Five Towns.",
    neighborhood: "Five Towns",
    follower_count: 175,
  },
  {
    name: "Hatzalah Five Towns",
    type: "Other",
    category: "Chessed & Volunteering",
    description_short: "Volunteer emergency medical service for the Five Towns community.",
    neighborhood: "Five Towns",
    follower_count: 290,
  },
  {
    name: "Five Towns Travel Club",
    type: "Other",
    category: "Travel",
    description_short: "Share kosher travel tips, trip reports, and travel deals.",
    neighborhood: "Five Towns",
    follower_count: 130,
  },
  {
    name: "Kosher Travel & Adventures",
    type: "Other",
    category: "Travel",
    description_short: "Plan your next kosher vacation with the community.",
    neighborhood: "Five Towns",
    follower_count: 95,
  },
  {
    name: "Five Towns Professionals Network",
    type: "Other",
    category: "Careers & Networking",
    description_short: "Connect with local professionals, share opportunities, and grow your career.",
    neighborhood: "Five Towns",
    follower_count: 210,
  },
  {
    name: "Daf Yomi Five Towns",
    type: "Other",
    category: "Learning & Torah",
    description_short: "Daily Daf Yomi shiurim and learning resources for the community.",
    neighborhood: "Five Towns",
    follower_count: 160,
  },
  {
    name: "Parsha Weekly",
    type: "Other",
    category: "Learning & Torah",
    description_short: "Weekly discussions on the parsha, divrei Torah, and Torah insights.",
    neighborhood: "Five Towns",
    follower_count: 145,
  },
  {
    name: "Five Towns Young Adults",
    type: "Other",
    category: "Social & Events",
    description_short: "Events, hangouts, and social activities for young adults in the Five Towns.",
    neighborhood: "Five Towns",
    follower_count: 250,
  },
  {
    name: "NCSY Five Towns",
    type: "Camp",
    category: "Programs & Youth",
    description_short: "Jewish youth programming and events for teens in the Five Towns.",
    neighborhood: "Five Towns",
    follower_count: 180,
  },
  {
    name: "Five Towns Pickup Basketball",
    type: "Other",
    category: "Sports & Fitness",
    description_short: "Organize weekly pickup games and tournaments in the area.",
    neighborhood: "Five Towns",
    follower_count: 120,
  },
  {
    name: "Kosher Foodies Five Towns",
    type: "Other",
    category: "Food & Lifestyle",
    description_short: "Reviews, recommendations, and discussions about kosher food and restaurants.",
    neighborhood: "Five Towns",
    follower_count: 220,
  },
  {
    name: "Young Israel Woodmere",
    type: "Shul",
    category: "Local Communities",
    description_short: "The heart of the Five Towns Orthodox community.",
    neighborhood: "Woodmere",
    follower_count: 420,
    is_verified: true,
  },
  {
    name: "Chabad of Woodmere",
    type: "Shul",
    category: "Local Communities",
    description_short: "Open to everyone. Shabbat, holidays, and learning programs.",
    neighborhood: "Woodmere",
    follower_count: 280,
  },
  {
    name: "Woodmere Minyan",
    type: "Shul",
    category: "Local Communities",
    description_short: "Multiple daily minyanim. All are welcome.",
    neighborhood: "Woodmere",
    follower_count: 140,
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

    for (const data of COMMUNITIES) {
      const existing = await base44.asServiceRole.entities.Community.filter({ name: data.name });
      if (existing.length > 0) {
        results.push({ name: data.name, status: 'skipped' });
        continue;
      }

      const community = await base44.asServiceRole.entities.Community.create({
        ...data,
        is_seeded: true,
      });

      const postBodies = [
        `Welcome to ${data.name}! Glad you're here.`,
        `What should we discuss or plan next?`,
        `Community updates and announcements this week.`,
      ];

      for (let i = 0; i < 3; i++) {
        await base44.asServiceRole.entities.CommunityPost.create({
          community_id: community.id,
          author_user_id: user.id,
          author_name: user.full_name,
          body: postBodies[i],
          type: i === 0 ? 'announcement' : 'general',
          is_official: true,
        });
      }

      results.push({ name: data.name, status: 'created', id: community.id });
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    console.error('seedLightCommunities error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});