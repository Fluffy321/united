import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all communities
    const communities = await base44.entities.Community.list('-follower_count', 100);
    if (communities.length < 3) {
      return Response.json({ error: 'Not enough communities', count: communities.length }, { status: 400 });
    }

    // Find HAFTR (case-insensitive)
    const haftr = communities.find(c => c.name?.toLowerCase().includes('haftr'));
    if (!haftr) {
      return Response.json({ error: 'HAFTR not found' }, { status: 400 });
    }

    // Get other communities (exclude HAFTR)
    const others = communities.filter(c => c.id !== haftr.id);
    
    // Pick random secondary featured (shuffle and take 2-4)
    const numSecondary = Math.min(4, others.length);
    const shuffled = others.sort(() => Math.random() - 0.5);
    const secondary = shuffled.slice(0, numSecondary);

    const updates = [];

    // Set HAFTR as hero featured
    updates.push(
      base44.entities.Community.update(haftr.id, {
        isFeatured: true,
        isMainFeatured: true,
        featuredRank: 1,
      })
    );

    // Set random communities as secondary featured
    secondary.forEach((c, idx) => {
      updates.push(
        base44.entities.Community.update(c.id, {
          isFeatured: true,
          isMainFeatured: false,
          featuredRank: idx + 2,
        })
      );
    });

    await Promise.all(updates);

    return Response.json({
      success: true,
      featured: [
        { id: haftr.id, name: haftr.name, type: 'hero' },
        ...secondary.map((c, i) => ({ id: c.id, name: c.name, type: 'secondary' })),
      ],
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});