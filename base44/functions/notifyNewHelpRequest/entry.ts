import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Called immediately after a new help request is posted.
// Sends instant email to all community members.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { requestId } = await req.json();

    const [request] = await base44.asServiceRole.entities.MitzvahRequest.filter({ id: requestId });
    if (!request) return Response.json({ error: 'Request not found' }, { status: 404 });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const usersWithEmail = allUsers.filter(u => u.email && u.id !== request.created_by_user_id);

    const CATEGORY_EMOJI = {
      'Errand': '🚗', 'Lost & Found': '🔍', 'Quick Favor': '🤝',
      'Tutoring': '📚', 'Shabbat Help': '✨', 'Other': '💡'
    };
    const emoji = CATEGORY_EMOJI[request.category] || '🙏';
    const poster = request.is_anonymous ? 'A community member' : request.created_by_name;

    const emailBody = `<!DOCTYPE html>
<html>
<body style="font-family:Inter,sans-serif;background:#F7F8FA;margin:0;padding:20px;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:18px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.08);">
    
    <div style="background:linear-gradient(135deg,#0F1C2E,#1e3a5f);padding:24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">${emoji}</div>
      <h1 style="color:white;margin:0;font-size:20px;font-weight:800;">Someone Needs Help</h1>
      <p style="color:rgba(255,255,255,0.65);margin:6px 0 0;font-size:13px;">${request.locationLabel || 'Five Towns'} · Just now</p>
    </div>

    <div style="padding:24px;">
      <div style="background:#F8FAFF;border:1px solid #DBEAFE;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:0.5px;">${request.category}</p>
        <p style="margin:0 0 8px;font-size:18px;font-weight:800;color:#0F1C2E;">${request.title}</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.55;">${request.description}</p>
        <p style="margin:10px 0 0;font-size:12px;color:#9CA3AF;">Posted by ${poster}</p>
      </div>

      <div style="text-align:center;">
        <a href="https://app.base44.com"
           style="display:inline-block;background:#0F1C2E;color:white;text-decoration:none;font-weight:700;font-size:14px;padding:13px 30px;border-radius:50px;">
          I Can Help →
        </a>
      </div>
      <p style="text-align:center;font-size:12px;color:#9CA3AF;margin:14px 0 0;">
        Being first to respond = earning 10 Mitzvah Points ✨
      </p>
    </div>
  </div>
</body>
</html>`;

    let sent = 0;
    for (const user of usersWithEmail) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        from_name: 'Five Towns Community',
        subject: `${emoji} New help request: "${request.title}"`,
        body: emailBody,
      });
      sent++;
    }

    return Response.json({ success: true, emails_sent: sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});