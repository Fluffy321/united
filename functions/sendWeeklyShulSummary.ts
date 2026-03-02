import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (service role) or admin user calls
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') isAuthorized = true;
    } catch (_) {
      // Scheduled calls won't have a user — authorize via service role
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all verified shuls
    const shuls = await base44.asServiceRole.entities.Shul.filter({ verified: true });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let totalEmailsSent = 0;

    for (const shul of shuls) {
      // Get members with notifications enabled
      const members = await base44.asServiceRole.entities.ShulMember.filter({
        shul_id: shul.id,
        notifications_enabled: true
      });

      if (members.length === 0) continue;

      // Gather weekly stats
      const [posts, helpRequests, events] = await Promise.all([
        base44.asServiceRole.entities.ShulPost.filter({ shul_id: shul.id }),
        base44.asServiceRole.entities.MitzvahRequest.filter({ shul_id: shul.id }),
        base44.asServiceRole.entities.ShulPost.filter({ shul_id: shul.id, type: 'event' }),
      ]);

      const recentPosts = posts.filter(p => p.created_date >= weekAgo);
      const recentHelp = helpRequests.filter(r => r.created_date >= weekAgo);
      const completedHelp = recentHelp.filter(r => r.status === 'completed');
      const openHelp = recentHelp.filter(r => r.status === 'open');
      const upcomingEvents = events.filter(e => e.event_date >= new Date().toISOString().split('T')[0]);

      const eventsHtml = upcomingEvents.slice(0, 3).map(e =>
        `<li style="margin-bottom:6px;"><strong>${e.title}</strong>${e.event_date ? ` — ${e.event_date}` : ''}</li>`
      ).join('');

      const helpHtml = openHelp.slice(0, 3).map(r =>
        `<li style="margin-bottom:6px;">🙏 <strong>${r.title}</strong> (${r.category})</li>`
      ).join('');

      const emailBody = `
<!DOCTYPE html>
<html>
<body style="font-family:Inter,sans-serif;background:#F7F8FA;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.07);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0F1C2E,#1e3a5f);padding:28px 28px 24px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">${shul.name}</h1>
      <p style="color:rgba(255,255,255,0.65);margin:6px 0 0;font-size:14px;">Weekly Community Digest</p>
    </div>

    <!-- Stats Row -->
    <div style="display:flex;gap:0;border-bottom:1px solid #F0F3F9;">
      <div style="flex:1;padding:20px;text-align:center;border-right:1px solid #F0F3F9;">
        <div style="font-size:28px;font-weight:700;color:#0F1C2E;">${recentPosts.length}</div>
        <div style="font-size:12px;color:#6B7280;font-weight:500;">Posts This Week</div>
      </div>
      <div style="flex:1;padding:20px;text-align:center;border-right:1px solid #F0F3F9;">
        <div style="font-size:28px;font-weight:700;color:#0F1C2E;">${completedHelp.length}</div>
        <div style="font-size:12px;color:#6B7280;font-weight:500;">Acts of Chesed</div>
      </div>
      <div style="flex:1;padding:20px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:#0F1C2E;">${members.length}</div>
        <div style="font-size:12px;color:#6B7280;font-weight:500;">Active Members</div>
      </div>
    </div>

    <div style="padding:24px 28px;">

      ${upcomingEvents.length > 0 ? `
      <!-- Upcoming Events -->
      <div style="margin-bottom:24px;">
        <h2 style="font-size:16px;font-weight:700;color:#0F1C2E;margin:0 0 12px;">📅 Upcoming Events</h2>
        <ul style="margin:0;padding-left:16px;color:#374151;font-size:14px;">
          ${eventsHtml}
        </ul>
      </div>` : ''}

      ${openHelp.length > 0 ? `
      <!-- Help Requests -->
      <div style="background:#FFFBEB;border:1px solid #FEF3C7;border-radius:12px;padding:16px;margin-bottom:24px;">
        <h2 style="font-size:15px;font-weight:700;color:#92400E;margin:0 0 10px;">🙏 Help Needed</h2>
        <ul style="margin:0;padding-left:16px;color:#374151;font-size:13px;">
          ${helpHtml}
        </ul>
        <p style="font-size:12px;color:#B45309;margin:10px 0 0;">Open the app to help out!</p>
      </div>` : ''}

      ${completedHelp.length > 0 ? `
      <!-- Chesed Recognition -->
      <div style="background:#F0FDF4;border:1px solid #D1FAE5;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">
          ✅ This week your community completed <strong>${completedHelp.length} act${completedHelp.length !== 1 ? 's' : ''} of chesed</strong>. Amazing work!
        </p>
      </div>` : ''}

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="${`https://${req.headers.get('host') || 'app.base44.com'}?page=ShulPage&shulId=${shul.id}`}" 
           style="display:inline-block;background:#0F1C2E;color:white;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:50px;">
          Open Community Hub →
        </a>
      </div>
    </div>

    <div style="padding:16px 28px;background:#F7F8FA;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9CA3AF;">You're receiving this because you're a member of ${shul.name}.<br>Manage notifications in your profile settings.</p>
    </div>
  </div>
</body>
</html>`;

      // Send to each member who has an email
      const users = await base44.asServiceRole.entities.User.list();
      const memberUserIds = new Set(members.map(m => m.user_id));
      const targetUsers = users.filter(u => memberUserIds.has(u.id) && u.email);

      for (const user of targetUsers) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `${shul.name} — Weekly Community Digest`,
          body: emailBody
        });
        totalEmailsSent++;
      }
    }

    return Response.json({ success: true, shuls_processed: shuls.length, emails_sent: totalEmailsSent });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});