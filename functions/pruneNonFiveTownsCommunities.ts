import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FIVE_TOWNS = new Set(['Lawrence', 'Cedarhurst', 'Woodmere', 'Inwood', 'Hewlett']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Fetch all communities
    const all = await base44.asServiceRole.entities.Community.list('-created_date', 3000);
    console.log(`[pruneFT] Total fetched: ${all.length}`);

    // Safe delete: seeded + unclaimed + neighborhood NOT in Five Towns
    const toDelete = all.filter(c =>
      c.is_seeded === true &&
      c.is_claimed === false &&
      !FIVE_TOWNS.has(c.neighborhood)
    );

    console.log(`[pruneFT] To delete: ${toDelete.length}`);

    const CHUNK = 20;
    for (let i = 0; i < toDelete.length; i += CHUNK) {
      await Promise.all(toDelete.slice(i, i + CHUNK).map(c =>
        base44.asServiceRole.entities.Community.delete(c.id)
      ));
    }

    console.log(`[pruneFT] Done. Deleted ${toDelete.length}`);
    return Response.json({ ok: true, deletedCount: toDelete.length });
  } catch (err) {
    console.error('[pruneFT] ERROR:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});