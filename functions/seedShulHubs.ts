// v3 — Standardized seed structure for all shuls
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Generic standardized content for every shul
function buildContent(shulName) {
  return {
    posts: [
      // 3 Feed Posts
      {
        type: "general",
        title: `Welcome to ${shulName}`,
        body: "Welcome to the official community page. This space is for updates, events, learning opportunities, and chesed initiatives. Join the community to stay informed and involved.",
        author_name: shulName,
        is_official: false,
        is_pinned: false,
      },
      {
        type: "general",
        title: "Weekly Learning Schedule",
        body: "This week's learning schedule is now available. Join us for weekday shiurim and Shabbos drashos. Full details are posted in the Events tab.",
        author_name: shulName,
        is_official: false,
        is_pinned: false,
      },
      {
        type: "general",
        title: "Community Spotlight",
        body: "Thank you to everyone who helped with this week's community efforts. If you'd like to volunteer or get involved in future projects, check the Mitzvah section.",
        author_name: shulName,
        is_official: false,
        is_pinned: false,
      },
      // 2 Announcements (pinned)
      {
        type: "announcement",
        title: "🕯 Shabbos Schedule Update",
        body: "Candle lighting, minyan times, and youth groups information are now updated. Please check the About section or Events tab for full details.",
        author_name: `${shulName} Office`,
        is_official: true,
        is_pinned: true,
      },
      {
        type: "announcement",
        title: "Youth Programming",
        body: "Youth groups and teen programming are active. Parents can find upcoming events and volunteer opportunities in the Events and Mitzvah sections.",
        author_name: `${shulName} Youth Committee`,
        is_official: true,
        is_pinned: false,
      },
    ],
    events: [
      {
        title: "Community Shiur",
        description: "Weekly Torah class open to all members.",
        start_date: "2026-03-06",
        start_time: "8:00 PM",
        location: "Main Shul Hall",
        is_official: true,
      },
      {
        title: "Pre-Holiday Community Gathering",
        description: "Join us for learning, refreshments, and community connection ahead of the upcoming Yom Tov.",
        start_date: "2026-04-05",
        start_time: "7:00 PM",
        location: "Social Hall",
        is_official: true,
      },
    ],
    opportunities: [
      {
        title: "Chesed Volunteer — Meal Deliveries",
        description: "Assist with meal deliveries for families in need this week. Flexible scheduling — approximately 2 hours per session. Contact the shul office to sign up.",
        category: "Chesed",
        location: shulName,
        slots_needed: 5,
      },
      {
        title: "Youth Mentor",
        description: "Volunteer 1 hour weekly helping younger students with learning or homework. A meaningful commitment that makes a real difference in a child's life.",
        category: "Other",
        location: shulName,
        slots_needed: 4,
      },
      {
        title: "Event Setup Crew",
        description: "Help set up chairs and materials before large community events. Usually 1–2 hours before the event. Open to all community members.",
        category: "Chesed",
        location: shulName,
        slots_needed: 6,
      },
    ],
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const allCommunities = await base44.asServiceRole.entities.Community.list();
    const results = { posts: 0, events: 0, opportunities: 0, skipped: [], seeded: [] };

    for (const community of allCommunities) {
      const communityId = community.id;
      const shulName = community.name;

      // Check if already seeded
      const existingPosts = await base44.asServiceRole.entities.CommunityPost.filter({ community_id: communityId, is_seeded: true });
      if (existingPosts.length > 0) {
        results.skipped.push(shulName);
        continue;
      }

      const content = buildContent(shulName);

      // Seed posts & announcements
      for (const post of content.posts) {
        await base44.asServiceRole.entities.CommunityPost.create({
          community_id: communityId,
          author_user_id: 'system',
          is_seeded: true,
          is_official: post.is_official,
          is_pinned: post.is_pinned,
          type: post.type,
          title: post.title,
          body: post.body,
          author_name: post.author_name,
        });
        results.posts++;
      }

      // Seed events
      for (const ev of content.events) {
        await base44.asServiceRole.entities.CommunityEvent.create({
          community_id: communityId,
          title: ev.title,
          description: ev.description,
          start_date: ev.start_date,
          start_time: ev.start_time,
          location: ev.location,
          is_seeded: true,
          is_official: ev.is_official,
        });
        results.events++;
      }

      // Seed mitzvah opportunities
      for (const op of content.opportunities) {
        await base44.asServiceRole.entities.MitzvahOpportunity.create({
          community_id: communityId,
          title: op.title,
          description: op.description,
          category: op.category,
          location: op.location,
          slots_needed: op.slots_needed,
          slots_filled: 0,
          is_active: true,
          is_seeded: true,
          is_official: true,
        });
        results.opportunities++;
      }

      results.seeded.push(shulName);
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});