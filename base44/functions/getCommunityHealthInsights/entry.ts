import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { community_id } = await req.json();
    if (!community_id) return Response.json({ error: 'community_id required' }, { status: 400 });

    console.log(`[HealthInsights] Analyzing community ${community_id}`);

    const now = Date.now();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all data in parallel
    const [posts, members, events, opportunities, community] = await Promise.all([
      base44.asServiceRole.entities.CommunityPost.filter({ community_id }, '-created_date', 200),
      base44.asServiceRole.entities.UserCommunity.filter({ community_id }, '-created_date', 500),
      base44.asServiceRole.entities.CommunityEvent.filter({ community_id }, '-created_date', 50),
      base44.asServiceRole.entities.MitzvahOpportunity.filter({ community_id }, '-created_date', 50),
      base44.asServiceRole.entities.Community.filter({ id: community_id }),
    ]);

    const communityData = community[0] || {};

    // --- Compute raw metrics ---
    const postsThisWeek = posts.filter(p => p.created_date >= oneWeekAgo);
    const postsLastWeek = posts.filter(p => p.created_date >= twoWeeksAgo && p.created_date < oneWeekAgo);
    const postsThisMonth = posts.filter(p => p.created_date >= oneMonthAgo);

    const newMembersThisWeek = members.filter(m => m.created_date >= oneWeekAgo);
    const newMembersThisMonth = members.filter(m => m.created_date >= oneMonthAgo);

    // Author diversity (unique posters this month)
    const uniqueAuthorsMonth = new Set(postsThisMonth.map(p => p.author_id || p.created_by)).size;
    const activeRatio = members.length > 0 ? Math.round((uniqueAuthorsMonth / members.length) * 100) : 0;

    // Post frequency trend (week over week)
    const postTrend = postsLastWeek.length > 0
      ? Math.round(((postsThisWeek.length - postsLastWeek.length) / postsLastWeek.length) * 100)
      : postsThisWeek.length > 0 ? 100 : 0;

    // Topic extraction from recent post titles/bodies
    const recentPostSamples = postsThisMonth.slice(0, 30).map(p =>
      (p.title || p.body || '').slice(0, 150)
    ).filter(Boolean);

    // Upcoming events
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingEvents = events.filter(e => e.start_date >= todayStr);

    // Build metrics object for AI
    const metrics = {
      total_members: members.length,
      new_members_this_week: newMembersThisWeek.length,
      new_members_this_month: newMembersThisMonth.length,
      total_posts_all_time: posts.length,
      posts_this_week: postsThisWeek.length,
      posts_last_week: postsLastWeek.length,
      posts_this_month: postsThisMonth.length,
      post_trend_pct: postTrend,
      unique_active_authors_month: uniqueAuthorsMonth,
      active_member_ratio_pct: activeRatio,
      upcoming_events_count: upcomingEvents.length,
      total_mitzvah_opportunities: opportunities.length,
      active_mitzvah_opportunities: opportunities.filter(o => o.is_active !== false).length,
      community_type: communityData.type || 'Community',
      community_name: communityData.name || 'This community',
    };

    console.log('[HealthInsights] Metrics computed, calling AI...');

    // AI analysis
    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a community health analyst for a Jewish community platform called Five Towns Connect.

Analyze the following engagement metrics for the community "${metrics.community_name}" (${metrics.community_type}) and provide actionable insights.

METRICS:
- Total Members: ${metrics.total_members}
- New Members This Week: ${metrics.new_members_this_week}
- New Members This Month: ${metrics.new_members_this_month}
- Posts This Week: ${metrics.posts_this_week} (vs ${metrics.posts_last_week} last week, trend: ${metrics.post_trend_pct > 0 ? '+' : ''}${metrics.post_trend_pct}%)
- Posts This Month: ${metrics.posts_this_month}
- Unique Active Authors (30d): ${metrics.unique_active_authors_month} (${metrics.active_member_ratio_pct}% of members)
- Upcoming Events: ${metrics.upcoming_events_count}
- Active Mitzvah Opportunities: ${metrics.active_mitzvah_opportunities}

RECENT POST TOPICS (sample):
${recentPostSamples.join('\n') || 'No recent posts'}

Provide a comprehensive community health analysis with:

1. health_score: An integer 0-100 representing overall community health
2. health_label: A short label like "Thriving", "Growing", "Stable", "Needs Attention", "At Risk"
3. health_color: One of "green", "blue", "yellow", "orange", "red" matching the label
4. summary: 2-3 sentence executive summary of community health
5. strengths: Array of 2-3 specific strengths (be specific with numbers)
6. concerns: Array of 1-3 specific concerns or risks (be constructive)
7. trending_topics: Array of 3-5 inferred trending topics/themes from the post samples (short labels)
8. recommendations: Array of 3-4 concrete, actionable suggestions for the admin (specific to this community's data)
9. moderation_flags: Array of 0-2 items to watch for moderation (e.g. low diversity, spam risk) — can be empty array
10. engagement_breakdown: Object with keys "posting", "events", "mitzvah", each with a score 0-100 and a one-line note`,
      response_json_schema: {
        type: 'object',
        properties: {
          health_score: { type: 'number' },
          health_label: { type: 'string' },
          health_color: { type: 'string' },
          summary: { type: 'string' },
          strengths: { type: 'array', items: { type: 'string' } },
          concerns: { type: 'array', items: { type: 'string' } },
          trending_topics: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          moderation_flags: { type: 'array', items: { type: 'string' } },
          engagement_breakdown: {
            type: 'object',
            properties: {
              posting: { type: 'object', properties: { score: { type: 'number' }, note: { type: 'string' } } },
              events: { type: 'object', properties: { score: { type: 'number' }, note: { type: 'string' } } },
              mitzvah: { type: 'object', properties: { score: { type: 'number' }, note: { type: 'string' } } },
            },
          },
        },
      },
    });

    console.log('[HealthInsights] AI analysis complete');

    return Response.json({
      metrics,
      insights: aiResult,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[HealthInsights] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});