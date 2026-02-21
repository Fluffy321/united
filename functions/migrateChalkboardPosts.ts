import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BOARD_TYPE_MAP = {
  help_needed: { type: 'help', board: 'help' },
  events:      { type: 'event', board: 'events' },
  jobs:        { type: 'job', board: 'jobs' },
  roommates:   { type: 'housing', board: 'housing' },
  kosher_food: { type: 'food', board: 'food' },
  dating:      { type: 'dating', board: 'dating' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const chalkPosts = await base44.asServiceRole.entities.ChalkboardPost.list('-created_date', 500);
    const existing = await base44.asServiceRole.entities.UnifiedPost.list('-created_date', 500);
    
    // Build a set of already-migrated source IDs to avoid duplicates
    const migratedIds = new Set(existing.filter(p => p.migrated_from).map(p => p.migrated_from));

    let migrated = 0;
    let skipped = 0;

    for (const post of chalkPosts) {
      if (migratedIds.has(post.id)) { skipped++; continue; }

      const mapping = BOARD_TYPE_MAP[post.board_type] || { type: 'feed', board: 'feed' };

      await base44.asServiceRole.entities.UnifiedPost.create({
        user_id: post.author_id || 'migrated',
        user_name: post.author_name || 'Community Member',
        user_age_range: post.author_age_range,
        avatar_url: post.author_avatar_url,
        type: mapping.type,
        board: mapping.board,
        title: post.title,
        body: post.content,
        is_anonymous: post.is_anonymous || false,
        city: post.city || 'Five Towns',
        event_date: post.event_date,
        event_time: post.event_time,
        likes_count: 0,
        comments_count: post.comments_count || 0,
        is_seeded: false,
        migrated_from: post.id,
      });
      migrated++;
    }

    return Response.json({ ok: true, migrated, skipped, total: chalkPosts.length });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});