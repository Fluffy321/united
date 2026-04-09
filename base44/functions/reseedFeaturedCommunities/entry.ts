import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin check
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch top communities by follower count
    const communities = await base44.entities.Community.list('-follower_count', 100);
    
    if (communities.length === 0) {
      return Response.json({ error: 'No communities found' }, { status: 400 });
    }

    // Clear existing featured status
    for (const community of communities) {
      if (community.isMainFeatured || community.isFeatured) {
        await base44.entities.Community.update(community.id, {
          isMainFeatured: false,
          isFeatured: false,
          featuredRank: null,
        });
      }
    }

    // Find HAFTR and set as main featured
    const haftr = communities.find(c => c.name?.includes('HAFTR'));
    let mainFeaturedId = null;

    if (haftr) {
      await base44.entities.Community.update(haftr.id, {
        isMainFeatured: true,
        isFeatured: true,
        featuredRank: 0,
        featured_priority: 100,
      });
      mainFeaturedId = haftr.id;
    }

    // Set up to 3 secondary featured communities
    const secondaryPool = communities.filter(c => c.id !== mainFeaturedId).slice(0, 8);
    const shuffled = secondaryPool.sort(() => Math.random() - 0.5).slice(0, 3);

    for (let i = 0; i < shuffled.length; i++) {
      await base44.entities.Community.update(shuffled[i].id, {
        isFeatured: true,
        isMainFeatured: false,
        featuredRank: i + 1,
        featured_priority: 50 - i * 10,
      });
    }

    return Response.json({
      success: true,
      main_featured: haftr?.name || 'None',
      secondary_featured: shuffled.map(c => c.name),
      total_updated: shuffled.length + (haftr ? 1 : 0),
    });
  } catch (error) {
    console.error('Reseed failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});