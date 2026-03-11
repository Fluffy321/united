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

  const updates = posts.map((post, i) => {
    const fraction = i / Math.max(posts.length - 1, 1);
    const jitter = (Math.random() - 0.5) * 30 * 60 * 1000;
    const ts = new Date(now - fraction * fourDaysMs + jitter).toISOString();
    return base44.asServiceRole.entities.UnifiedPost.update(post.id, { created_date: ts });
  });

  await Promise.all(updates);

  return Response.json({ updated: posts.length, total: posts.length });
});