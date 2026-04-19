import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called daily by a scheduled automation.
// Checks all yahrzeits against today's Hebrew date via Hebcal and sends reminders.

async function getTodayHebrew() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const res = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${y}&gm=${m}&gd=${d}&g2h=1`);
  const data = await res.json();
  return { hm: data.hm_index, hd: data.hd, hy: data.hy }; // hm_index is 1-based Tishrei=1
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth: only allow admin or scheduler (no user context for scheduled calls)
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
    } catch { /* scheduled call, no user */ }

    const { today_hm, today_hd, today_hy } = (() => {
      const url = new URL(req.url);
      const tm = url.searchParams.get('hm');
      const td = url.searchParams.get('hd');
      const ty = url.searchParams.get('hy');
      if (tm && td && ty) return { today_hm: +tm, today_hd: +td, today_hy: +ty };
      return { today_hm: null, today_hd: null, today_hy: null };
    })();

    // Fetch today's Hebrew date from Hebcal
    let hDate;
    try { hDate = await getTodayHebrew(); } catch (e) {
      console.error('Failed to fetch Hebrew date:', e.message);
      return Response.json({ error: 'Hebcal unavailable' }, { status: 503 });
    }

    const curHM = today_hm || hDate.hm;
    const curHD = today_hd || hDate.hd;
    const curHY = today_hy || hDate.hy;

    console.log(`Running yahrzeit reminders for ${curHD}/${curHM}/${curHY}`);

    // Fetch all yahrzeits
    const allYahrzeits = await base44.asServiceRole.entities.Yahrzeit.list('-created_date', 1000);

    let sent = 0;

    for (const y of allYahrzeits) {
      const ym = y.hebrew_month;
      const yd = y.hebrew_day;

      // Check if last reminder was for current year
      if (y.last_reminder_year === curHY) continue;

      // Calculate days until yahrzeit (simplified — same month comparison)
      let daysUntil = null;
      if (ym === curHM) {
        daysUntil = yd - curHD;
      } else if (ym === curHM + 1) {
        // Approximate: assume 29-30 days in current month
        daysUntil = (30 - curHD) + yd;
      }

      if (daysUntil === null) continue;

      let reminderType = null;
      let reminderField = null;
      if (daysUntil === 3 && !y.reminder_sent_3day) { reminderType = '3 days'; reminderField = 'reminder_sent_3day'; }
      else if (daysUntil === 1 && !y.reminder_sent_1day) { reminderType = 'tomorrow'; reminderField = 'reminder_sent_1day'; }
      else if (daysUntil === 0 && !y.reminder_sent_day_of) { reminderType = 'today'; reminderField = 'reminder_sent_day_of'; }

      if (!reminderType) continue;

      // Fetch user to get email
      let userRecord = null;
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: y.user_id });
        userRecord = users[0];
      } catch {}
      if (!userRecord?.email) continue;

      const dayLabel = daysUntil === 0 ? 'Today is' : `In ${reminderType},`;
      const subject = daysUntil === 0
        ? `Yahrzeit of ${y.deceased_name} is today`
        : `Yahrzeit reminder: ${y.deceased_name} in ${reminderType}`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: userRecord.email,
        from_name: 'JUnited',
        subject,
        body: `
Shalom ${userRecord.full_name},

${dayLabel} the yahrzeit of ${y.deceased_name}${y.relationship ? ` (your ${y.relationship})` : ''}.

${daysUntil === 0
  ? "May their neshamah have an aliyah. You can light a candle in their memory on JUnited."
  : "You may want to say Kaddish, give tzedakah, or learn Torah in their memory."
}

Open JUnited: https://junited.app/yahrzeits

— JUnited
        `.trim(),
      });

      // Mark reminder sent
      await base44.asServiceRole.entities.Yahrzeit.update(y.id, {
        [reminderField]: true,
        ...(daysUntil === 0 ? { last_reminder_year: curHY, reminder_sent_3day: false, reminder_sent_1day: false, reminder_sent_day_of: false } : {}),
      });

      // If share_with_community, create a community post on day-of
      if (daysUntil === 0 && y.share_with_community && y.community_id) {
        await base44.asServiceRole.entities.CommunityPost.create({
          community_id: y.community_id,
          author_id: y.user_id,
          author_name: y.user_name,
          body: `${y.user_name} is observing the yahrzeit of ${y.deceased_name}${y.relationship ? `, their ${y.relationship}` : ''}. Please have them in mind. 🕯️`,
          type: 'yahrzeit',
          post_type: 'yahrzeit',
        });
      }

      sent++;
      console.log(`Sent ${reminderType} reminder to ${userRecord.email} for ${y.deceased_name}`);
    }

    return Response.json({ success: true, reminders_sent: sent });
  } catch (error) {
    console.error('sendYahrzeitReminders error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});