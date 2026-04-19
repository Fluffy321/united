import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { query, filters = {}, user_id } = await req.json();

    if (!query || query.trim().length < 2) {
      return Response.json({ results: { posts: [], communities: [], people: [], events: [] } });
    }

    const q = query.trim().toLowerCase();
    const { community_id, post_type, date_from, date_to } = filters;

    // Fetch user's communities for affinity boost
    let userCommunityIds = new Set();
    if (user_id) {
      try {
        const memberships = await base44.asServiceRole.entities.UserCommunity.filter({ user_id });
        userCommunityIds = new Set(memberships.map(m => m.community_id));
      } catch {}
    }

    // --- POSTS ---
    const postFilter = { board: post_type || undefined };
    if (community_id) postFilter.community_id = community_id;
    const rawPosts = await base44.asServiceRole.entities.UnifiedPost.list('-created_date', 500);

    const scoredPosts = rawPosts
      .filter(p => {
        const text = [p.body, p.title, p.author_name, p.location_text].filter(Boolean).join(' ').toLowerCase();
        if (!text.includes(q)) return false;
        if (post_type && p.type !== post_type) return false;
        if (community_id && p.community_id !== community_id) return false;
        if (date_from && new Date(p.created_date) < new Date(date_from)) return false;
        if (date_to && new Date(p.created_date) > new Date(date_to)) return false;
        return true;
      })
      .map(p => {
        let score = 0;
        const text = [p.body, p.title].filter(Boolean).join(' ').toLowerCase();
        // Relevance: exact phrase match boost
        if (text.includes(q)) score += 10;
        const wordMatches = q.split(' ').filter(w => w.length > 2 && text.includes(w)).length;
        score += wordMatches * 3;
        // Recency
        const ageHours = (Date.now() - new Date(p.created_date).getTime()) / 3600000;
        score += Math.max(0, 20 - ageHours / 12);
        // Community affinity
        if (p.community_id && userCommunityIds.has(p.community_id)) score += 15;
        // Engagement
        score += (p.likes_count || 0) * 0.5 + (p.comments_count || 0) * 1;
        return { ...p, _score: score };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 20);

    // --- COMMUNITIES ---
    const rawCommunities = await base44.asServiceRole.entities.Community.list('-follower_count', 300);
    const matchedCommunities = rawCommunities
      .filter(c => {
        const text = [c.name, c.description_short, c.neighborhood, c.location, c.type].filter(Boolean).join(' ').toLowerCase();
        return text.includes(q);
      })
      .map(c => ({
        ...c,
        _score: (userCommunityIds.has(c.id) ? 20 : 0) + (c.follower_count || 0) * 0.1
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 8);

    // --- EVENTS ---
    const rawEvents = await base44.asServiceRole.entities.CommunityEvent.list('-created_date', 300);
    const matchedEvents = rawEvents
      .filter(e => {
        const text = [e.title, e.description, e.location, e.category].filter(Boolean).join(' ').toLowerCase();
        if (!text.includes(q)) return false;
        if (community_id && e.community_id !== community_id) return false;
        if (date_from && e.start_date && e.start_date < date_from) return false;
        return true;
      })
      .map(e => ({
        ...e,
        _score: (userCommunityIds.has(e.community_id) ? 15 : 0) + (e.start_date && new Date(e.start_date) > new Date() ? 10 : 0)
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 8);

    // --- PEOPLE ---
    const rawUsers = await base44.asServiceRole.entities.User.list('-created_date', 200);
    const matchedPeople = rawUsers
      .filter(u => {
        const text = [u.full_name, u.bio, u.cityPreset].filter(Boolean).join(' ').toLowerCase();
        return text.includes(q);
      })
      .slice(0, 8);

    return Response.json({
      results: {
        posts: scoredPosts,
        communities: matchedCommunities,
        events: matchedEvents,
        people: matchedPeople,
      },
      total: scoredPosts.length + matchedCommunities.length + matchedEvents.length + matchedPeople.length,
    });
  } catch (error) {
    console.error('universalSearch error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});