import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled or admin calls
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch (_) {
      // scheduled call — OK
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekAgoDate = weekAgo.split('T')[0];

    // Gather community-wide stats in parallel
    const [chesedLogs, mitzvahRequests, mealTrains, signups, allUsers] = await Promise.all([
      base44.asServiceRole.entities.ChesedLog.list('-created_date', 500),
      base44.asServiceRole.entities.MitzvahRequest.list('-created_date', 500),
      base44.asServiceRole.entities.MealTrainRequest.list('-created_date', 200),
      base44.asServiceRole.entities.MitzvahSignup.list('-created_date', 500),
      base44.asServiceRole.entities.User.list(),
    ]);

    // Filter to this week
    const weekLogs = chesedLogs.filter(l => l.created_date >= weekAgo);
    const weekRequests = mitzvahRequests.filter(r => r.created_date >= weekAgo);
    const weekMealTrains = mealTrains.filter(m => m.created_date >= weekAgo);
    const completedRequests = weekRequests.filter(r => r.status === 'completed');
    const weekSignups = signups.filter(s => s.created_date >= weekAgo);

    const totalHours = weekLogs.reduce((sum, l) => sum + (l.hours || 0), 0);
    const familiesHelped = completedRequests.length + weekMealTrains.length;
    const volunteerHours = Math.round(totalHours + weekSignups.length * 1.5); // estimate 1.5h per signup
    const mealTrainsCount = weekMealTrains.length;
    const volunteersActive = new Set([
      ...weekLogs.map(l => l.user_id),
      ...weekSignups.map(s => s.user_id),
    ]).size;

    // Persist the weekly stats for in-app display
    await base44.asServiceRole.entities.WeeklyStats.create({
      week_start: weekAgoDate,
      families_helped: familiesHelped,
      volunteer_hours: volunteerHours,
      meal_trains: mealTrainsCount,
      active_volunteers: volunteersActive,
      completed_requests: completedRequests.length,
    });

    // Build email
    const highlights = [
      familiesHelped > 0   && `🤝 Helped <strong>${familiesHelped} famil${familiesHelped === 1 ? 'y' : 'ies'}</strong>`,
      volunteerHours > 0   && `⏱️ Logged <strong>${volunteerHours} volunteer hour${volunteerHours !== 1 ? 's' : ''}</strong>`,
      mealTrainsCount > 0  && `🍲 Organized <strong>${mealTrainsCount} meal train${mealTrainsCount !== 1 ? 's' : ''}</strong>`,
      volunteersActive > 0 && `✨ <strong>${volunteersActive} community member${volunteersActive !== 1 ? 's' : ''}</strong> took action`,
    ].filter(Boolean);

    const highlightsHtml = highlights.map(h =>
      `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#F0FDF4;border-radius:10px;font-size:15px;color:#166534;">${h}</div>`
    ).join('');

    const emailBody = `<!DOCTYPE html>
<html>
<body style="font-family:Inter,sans-serif;background:#F7F8FA;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.09);">

    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#0F1C2E 0%,#1e3a5f 100%);padding:36px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:10px;">🏆</div>
      <h1 style="color:white;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">This Week Our Community</h1>
      <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:14px;">Made a real difference. Here's what you accomplished together.</p>
    </div>

    <!-- Highlights -->
    <div style="padding:28px 28px 8px;">
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${highlightsHtml}
      </div>
    </div>

    <!-- Pride quote -->
    <div style="padding:20px 28px;">
      <div style="background:linear-gradient(135deg,#fef3c7,#fffbeb);border:1px solid #fde68a;border-radius:14px;padding:18px 20px;text-align:center;">
        <p style="margin:0;font-size:15px;font-weight:700;color:#92400e;">"Every act of kindness creates a ripple."</p>
        <p style="margin:8px 0 0;font-size:13px;color:#b45309;">Thank you for being part of this community. 💛</p>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;padding:8px 28px 28px;">
      <a href="https://app.base44.com"
         style="display:inline-block;background:#2563EB;color:white;text-decoration:none;font-weight:700;font-size:14px;padding:13px 32px;border-radius:50px;">
        See This Week's Activity →
      </a>
    </div>

    <div style="padding:16px 28px;background:#F7F8FA;text-align:center;border-top:1px solid #E8ECF4;">
      <p style="margin:0;font-size:11px;color:#9CA3AF;">Five Towns Community Weekly Digest · Every Sunday</p>
    </div>
  </div>
</body>
</html>`;

    // Send to all users
    let sent = 0;
    for (const user of allUsers) {
      if (!user.email) continue;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `🏆 This week our community helped ${familiesHelped} families`,
        body: emailBody,
      });
      sent++;
    }

    return Response.json({
      success: true,
      stats: { familiesHelped, volunteerHours, mealTrainsCount, volunteersActive },
      emails_sent: sent,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});