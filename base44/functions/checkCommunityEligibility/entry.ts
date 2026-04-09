import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const MIN_FOLLOWERS = 50;
const MIN_WEEKLY_ACTIVITY = 3; // posts + comments combined

Deno.serve(async (req) => {
  try {
    const { community_id } = await req.json();
    if (!community_id) {
      return Response.json({ error: 'Missing community_id' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Fetch community
    const communities = await base44.entities.Community.filter({ id: community_id });
    if (!communities?.length) {
      return Response.json({ error: 'Community not found' }, { status: 404 });
    }

    const community = communities[0];

    // Check eligibility requirements
    const profileComplete = !!(community.name && community.description_long && community.logo_url);
    const hasEnoughFollowers = (community.follower_count || 0) >= MIN_FOLLOWERS;
    const weeklyActivity = (community.posts_this_week || 0) + (community.comments_this_week || 0);
    const activitySufficient = weeklyActivity >= MIN_WEEKLY_ACTIVITY;

    // Check spam flags (basic check — could integrate with moderation system)
    const spamFlagged = false; // TODO: integrate with Report entity

    const isEligible = profileComplete && hasEnoughFollowers && activitySufficient && !spamFlagged;

    // Log eligibility check
    await base44.asServiceRole.entities.FeaturedEligibilityLog.create({
      community_id,
      community_name: community.name,
      check_date: new Date().toISOString(),
      is_eligible: isEligible,
      reasons: {
        profile_complete: profileComplete,
        follower_count_min: hasEnoughFollowers,
        weekly_activity_sufficient: activitySufficient,
        spam_flagged: spamFlagged,
        weekly_posts: community.posts_this_week || 0,
        weekly_comments: community.comments_this_week || 0,
      },
    });

    // Update community eligibility flag
    await base44.asServiceRole.entities.Community.update(community_id, {
      is_eligible_for_featured: isEligible,
      eligibility_checked_at: new Date().toISOString(),
    });

    return Response.json({
      is_eligible: isEligible,
      reasons: {
        profile_complete: profileComplete,
        follower_count_min: hasEnoughFollowers,
        weekly_activity_sufficient: activitySufficient,
        spam_flagged: spamFlagged,
        weekly_posts: community.posts_this_week || 0,
        weekly_comments: community.comments_this_week || 0,
      },
    });
  } catch (error) {
    console.error('Eligibility check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});