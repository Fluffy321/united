import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Auto-bump help requests that have had no response after 2 hours.
// "Bump" = send a broadcast email to all users to surface the request again.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (no user) or admin
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch (_) { /* scheduled */ }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const oneDayAgo   = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Find open requests posted >2h ago, not yet bumped (or bumped >24h ago), with 0 offers
    const openRequests = await base44.asServiceRole.entities.MitzvahRequest.filter({ status: 'open' });

    const toBump = openRequests.filter(r => {
      const isOldEnough = r.created_date <= twoHoursAgo;
      const notBumpedRecently = !r.bumped_at || r.bumped_at <= oneDayAgo;
      const noOffers = !r.offers_count || r.offers_count === 0;
      const notTooManyBumps = (r.bump_count || 0) < 3; // max 3 bumps per request
      return isOldEnough && notBumpedRecently && noOffers && notTooManyBumps;
    });

    if (toBump.length === 0) {
      return Response.json({ success: true, bumped: 0 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const usersWithEmail = allUsers.filter(u => u.email);

    let totalBumped = 0;

    for (const request of toBump) {
      const CATEGORY_EMOJI = {
        'Errand': '🚗', 'Lost & Found': '🔍', 'Quick Favor': '🤝',
        'Tutoring': '📚', 'Shabbat Help': '✨', 'Other': '💡'
      };
      const emoji = CATEGORY_EMOJI[request.category] || '🙏';
      const poster = request.is_anonymous ? 'Someone in your community' : request.created_by_name;
      const hoursAgo = Math.round((Date.now() - new Date(request.created_date).getTime()) / 3600000);

      const emailBody = `<!DOCTYPE html>
<html>
<body style="font-family:Inter,sans-serif;background:#F7F8FA;margin:0;padding:20px;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:18px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.08);">
    
    <div style="background:linear-gradient(135deg,#7c1d1d,#dc2626);padding:24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">${emoji}</div>
      <h1 style="color:white;margin:0;font-size:20px;font-weight:800;">Still Unanswered</h1>
      <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">This person needs help — ${hoursAgo}h and no response yet</p>
    </div>

    <div style="padding:24px;">
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#9A3412;">${request.category}</p>
        <p style="margin:0 0 8px;font-size:17px;font-weight:800;color:#0F1C2E;">${request.title}</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.5;">${request.description}</p>
        <p style="margin:10px 0 0;font-size:12px;color:#9CA3AF;">Posted by ${poster} · ${request.locationLabel || 'Five Towns'}</p>
      </div>

      <div style="text-align:center;">
        <a href="https://app.base44.com"
           style="display:inline-block;background:#dc2626;color:white;text-decoration:none;font-weight:700;font-size:14px;padding:13px 30px;border-radius:50px;">
          I Can Help →
        </a>
      </div>
      <p style="text-align:center;font-size:12px;color:#9CA3AF;margin:14px 0 0;">
        Even a 5-minute act of kindness can change someone's day.
      </p>
    </div>
  </div>
</body>
</html>`;

      // Mark as bumped
      await base44.asServiceRole.entities.MitzvahRequest.update(request.id, {
        bumped_at: new Date().toISOString(),
        bump_count: (request.bump_count || 0) + 1,
      });

      // Email everyone
      for (const user of usersWithEmail) {
        // Don't email the requester
        if (user.id === request.created_by_user_id) continue;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          from_name: 'Five Towns Community',
          subject: `${emoji} Still waiting for help: "${request.title}"`,
          body: emailBody,
        });
      }

      totalBumped++;
    }

    return Response.json({ success: true, bumped: totalBumped, requests_bumped: toBump.map(r => r.id) });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});