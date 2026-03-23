import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has demo posts
    const existingPosts = await base44.entities.UnifiedPost.filter({ user_id: user.id });
    if (existingPosts.length > 0) {
      return Response.json({ message: 'User already has posts', count: existingPosts.length });
    }

    // Create 3 demo posts
    const demoPosts = [
      {
        user_id: user.id,
        user_name: user.display_name || user.full_name,
        user_age_range: user.age_range || '18+',
        avatar_url: user.avatar_url,
        avatar_type: user.avatar_url ? 'photo' : 'initials',
        type: 'feed',
        board: 'feed',
        body: 'Looking for a chavrusah partner for Thursday evenings in Woodmere area',
        city: user.cityPreset || user.city || 'Five Towns',
        category: 'learning',
        interests: ['Torah & Learning'],
        is_seeded: true
      },
      {
        user_id: user.id,
        user_name: user.display_name || user.full_name,
        user_age_range: user.age_range || '18+',
        avatar_url: user.avatar_url,
        avatar_type: user.avatar_url ? 'photo' : 'initials',
        type: 'feed',
        board: 'feed',
        body: 'Anyone know a good electrician in the Five Towns?',
        city: user.cityPreset || user.city || 'Five Towns',
        category: 'recommendation',
        is_seeded: true
      },
      {
        user_id: user.id,
        user_name: user.display_name || user.full_name,
        user_age_range: user.age_range || '18+',
        avatar_url: user.avatar_url,
        avatar_type: user.avatar_url ? 'photo' : 'initials',
        type: 'feed',
        board: 'feed',
        body: 'Shabbat shalom everyone! Beautiful weather for a walk to shul',
        city: user.cityPreset || user.city || 'Five Towns',
        is_seeded: true
      }
    ];

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Manually set created_date on each post (note: some systems may override this)
    demoPosts[0].created_date = threeDaysAgo.toISOString();
    demoPosts[1].created_date = oneWeekAgo.toISOString();
    demoPosts[2].created_date = twoWeeksAgo.toISOString();

    const created = await base44.entities.UnifiedPost.bulkCreate(demoPosts);

    return Response.json({
      message: 'Demo posts created successfully',
      count: created.length,
      posts: created
    });
  } catch (error) {
    console.error('Error seeding posts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});