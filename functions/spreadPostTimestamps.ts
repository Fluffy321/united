import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const posts = await base44.asServiceRole.entities.UnifiedPost.filter({ is_seeded: true });

  // Spread timestamps: most recent = 2 min ago, oldest = 4 days ago
  const now = Date.now();
  const fourDaysMs = 4 * 24 * 60 * 60 * 1000;

  let updated = 0;
  for (let i = 0; i < posts.length; i++) {
    // Distribute evenly across last 4 days, with some jitter
    const fraction = i / Math.max(posts.length - 1, 1);
    const jitter = (Math.random() - 0.5) * 30 * 60 * 1000; // ±30 min jitter
    const ts = new Date(now - fraction * fourDaysMs + jitter).toISOString();
    await base44.asServiceRole.entities.UnifiedPost.update(posts[i].id, { created_date: ts });
    updated++;
  }

  return Response.json({ updated, total: posts.length });
});