import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all seeded posts
    const allPosts = await base44.asServiceRole.entities.UnifiedPost.list('-created_date', 1000);
    const seededPosts = allPosts.filter(p => p.is_seeded);

    // Delete all seeded posts
    let deleted = 0;
    for (const post of seededPosts) {
      await base44.asServiceRole.entities.UnifiedPost.delete(post.id);
      deleted++;
    }

    return Response.json({
      ok: true,
      message: `Deleted ${deleted} seeded posts`,
      deleted
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});