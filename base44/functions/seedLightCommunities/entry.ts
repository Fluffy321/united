import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DEMO_CATEGORIES = ["Programs", "Travel", "Hobbies", "Interests", "Chessed"];

const SAMPLE_POSTS = [
  ["Welcome to {name}! Excited to have you here.", "What should we plan next?", "Announcements and discussions this week"],
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const results = [];

    for (const category of DEMO_CATEGORIES) {
      // Check if already exists to avoid duplicates
      const existing = await base44.asServiceRole.entities.Community.filter({ name: `${category} Hub` });
      if (existing.length > 0) {
        results.push({ category, status: 'skipped', reason: 'already exists' });
        continue;
      }

      const community = await base44.asServiceRole.entities.Community.create({
        name: `${category} Hub`,
        type: 'Other',
        description_short: `A ${category.toLowerCase()} community for the Five Towns`,
        description_long: `Connect with others who share an interest in ${category.toLowerCase()}. Share ideas, plan events, and build community.`,
        follower_count: Math.floor(Math.random() * 200) + 20,
        is_seeded: true,
      });

      await base44.asServiceRole.entities.UserCommunity.create({
        user_id: user.id,
        community_id: community.id,
        role: 'Admin',
      });

      const postBodies = [
        `Welcome to ${category} Hub! Excited to have you here.`,
        `What should we plan next for ${category}?`,
        `Announcements and discussions this week`,
      ];
      const postTypes = ['announcement', 'general', 'general'];

      for (let i = 0; i < 3; i++) {
        await base44.asServiceRole.entities.CommunityPost.create({
          community_id: community.id,
          author_user_id: user.id,
          author_name: user.full_name,
          body: postBodies[i],
          type: postTypes[i],
          is_official: true,
        });
      }

      results.push({ category, status: 'created', communityId: community.id });
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    console.error('seedLightCommunities error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});