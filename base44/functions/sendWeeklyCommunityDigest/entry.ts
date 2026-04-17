import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[WeeklyDigest] Starting weekly community digest job');

    // Get all users who have opted into the digest
    const allUsers = await base44.asServiceRole.entities.User.list();
    const digestUsers = allUsers.filter(u =>
      u.notification_preferences?.weekly_digest !== false && u.email
    );

    console.log(`[WeeklyDigest] Found ${digestUsers.length} users to send digest to`);

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    let totalSent = 0;
    let totalFailed = 0;

    for (const user of digestUsers) {
      try {
        // Get communities this user belongs to
        const memberships = await base44.asServiceRole.entities.UserCommunity.filter({ user_id: user.id });
        if (!memberships.length) continue;

        const communityIds = memberships.map(m => m.community_id);

        // Fetch data for all their communities in parallel
        const [allPosts, allEvents, allMembers, allCommunities] = await Promise.all([
          base44.asServiceRole.entities.CommunityPost.list('-created_date', 100),
          base44.asServiceRole.entities.CommunityEvent.list('start_date', 50),
          base44.asServiceRole.entities.UserCommunity.list('-created_date', 100),
          base44.asServiceRole.entities.Community.list('-follower_count', 200),
        ]);

        // Filter to user's communities
        const recentPosts = allPosts.filter(p =>
          communityIds.includes(p.community_id) && p.created_date >= oneWeekAgo
        );
        const upcomingEvents = allEvents.filter(e =>
          communityIds.includes(e.community_id) &&
          e.start_date >= now.toISOString().split('T')[0] &&
          e.start_date <= nextWeek.split('T')[0]
        );
        const newMembers = allMembers.filter(m =>
          communityIds.includes(m.community_id) && m.created_date >= oneWeekAgo
        );
        const userCommunities = allCommunities.filter(c => communityIds.includes(c.id));

        if (!recentPosts.length && !upcomingEvents.length && !newMembers.length) {
          console.log(`[WeeklyDigest] No activity for user ${user.email}, skipping`);
          continue;
        }

        // Build context for AI
        const postsContext = recentPosts.slice(0, 15).map(p =>
          `[${p.community_name || 'Community'}] ${p.title || p.body?.slice(0, 120) || 'Post'}`
        ).join('\n');

        const eventsContext = upcomingEvents.slice(0, 8).map(e =>
          `[${userCommunities.find(c => c.id === e.community_id)?.name || 'Community'}] "${e.title}" on ${e.start_date}${e.start_time ? ' at ' + e.start_time : ''}${e.location ? ' @ ' + e.location : ''}`
        ).join('\n');

        const newMemberCount = newMembers.length;
        const communityNames = userCommunities.map(c => c.name).join(', ');

        // Generate AI digest summary
        const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are writing a warm, friendly weekly community digest email for a Jewish community social network called "Five Towns Connect".

The recipient is: ${user.full_name || 'Community Member'}
Their communities: ${communityNames}

Recent discussions this week (${recentPosts.length} posts):
${postsContext || 'No new posts this week.'}

Upcoming events in the next 7 days (${upcomingEvents.length} events):
${eventsContext || 'No upcoming events.'}

New members this week: ${newMemberCount} new members joined across their communities.

Write a concise, engaging HTML email digest with:
1. A warm personalized greeting
2. A "This Week's Highlights" section with 2-3 bullet points summarizing the most interesting discussions (be specific, mention community names)
3. An "Upcoming Events" section listing events (if any)
4. A "Community Growth" note if there are new members
5. A warm closing

Keep it brief, warm, and community-focused. Use a friendly tone appropriate for a Jewish community. Format as clean HTML with inline styles using colors: primary blue #2563EB, text #0F172A, muted #64748B, background #F8FAFC. Make it mobile-friendly. Do NOT include <html>, <head>, or <body> tags - just the inner content.`,
          response_json_schema: {
            type: 'object',
            properties: {
              subject: { type: 'string' },
              html_body: { type: 'string' },
            },
          },
        });

        const subject = aiResult?.subject || `Your Weekly Community Digest 📬`;
        const htmlBody = aiResult?.html_body || '';

        if (!htmlBody) {
          console.log(`[WeeklyDigest] AI returned empty body for ${user.email}`);
          continue;
        }

        // Wrap in a clean email template
        const fullHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #2563EB, #4F46E5); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">🕍 Five Towns Connect</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Your Weekly Community Digest</p>
  </div>

  <!-- Body -->
  <div style="padding: 32px 24px; background: #ffffff;">
    ${htmlBody}
  </div>

  <!-- Footer -->
  <div style="padding: 20px 24px; background: #F8FAFC; border-top: 1px solid #E2E8F0; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #64748B; font-size: 12px; margin: 0;">
      You're receiving this because you're a member of Five Towns Connect communities.<br/>
      <a href="#" style="color: #2563EB;">Manage email preferences</a> · <a href="#" style="color: #2563EB;">View in app</a>
    </p>
  </div>
</div>`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject,
          body: fullHtml,
          from_name: 'Five Towns Connect',
        });

        totalSent++;
        console.log(`[WeeklyDigest] Sent digest to ${user.email}`);

        // Log it
        await base44.asServiceRole.entities.NewsletterLog.create({
          group_id: 'weekly-digest',
          sent_by_user_id: 'system',
          sent_by_name: 'Weekly Digest Bot',
          subject,
          recipients_count: 1,
          sent_count: 1,
          failed_count: 0,
          sent_date: new Date().toISOString(),
        });

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));

      } catch (userErr) {
        console.error(`[WeeklyDigest] Failed for user ${user.email}:`, userErr.message);
        totalFailed++;
      }
    }

    console.log(`[WeeklyDigest] Done. Sent: ${totalSent}, Failed: ${totalFailed}`);
    return Response.json({ success: true, sent: totalSent, failed: totalFailed });

  } catch (error) {
    console.error('[WeeklyDigest] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});