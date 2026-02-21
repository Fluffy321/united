import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FIVE_TOWNS = ['Lawrence', 'Cedarhurst', 'Woodmere', 'Inwood', 'Hewlett'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const all = await base44.asServiceRole.entities.Community.list('-created_date', 5000);

    // Only delete seeded + unclaimed communities NOT in Five Towns
    const toDelete = all.filter(c => {
      if (!c.is_seeded) return false;
      if (c.is_claimed) return false;
      return !FIVE_TOWNS.includes(c.neighborhood);
    });

    console.log(`[prune] Found ${toDelete.length} non-Five Towns seeded communities to delete`);

    // Delete in parallel batches of 20
    const BATCH = 20;
    for (let i = 0; i < toDelete.length; i += BATCH) {
      await Promise.all(toDelete.slice(i, i + BATCH).map(c =>
        base44.asServiceRole.entities.Community.delete(c.id)
      ));
    }

    console.log(`[prune] Deleted ${toDelete.length} communities.`);

    return Response.json({ ok: true, deletedCount: toDelete.length });
  } catch (err) {
    console.error('[prune] ERROR:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});