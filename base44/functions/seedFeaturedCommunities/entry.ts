import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch top communities by follower count
    const communities = await base44.entities.Community.list('-follower_count', 100);
    if (communities.length < 3) {
      return Response.json({ error: 'Not enough communities to seed', count: communities.length }, { status: 400 });
    }

    // Mark top 1 as main featured, next 2 as secondary
    const updates = [];

    // Main featured (hero)
    updates.push(
      base44.entities.Community.update(communities[0].id, {
        isFeatured: true,
        isMainFeatured: true,
        featuredRank: 1,
      })
    );

    // Secondary featured (1-2)
    for (let i = 1; i < 3; i++) {
      updates.push(
        base44.entities.Community.update(communities[i].id, {
          isFeatured: true,
          isMainFeatured: false,
          featuredRank: i + 1,
        })
      );
    }

    await Promise.all(updates);

    return Response.json({
      success: true,
      featured: [
        { id: communities[0].id, name: communities[0].name, type: 'hero' },
        { id: communities[1].id, name: communities[1].name, type: 'secondary' },
        { id: communities[2].id, name: communities[2].name, type: 'secondary' },
      ],
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});