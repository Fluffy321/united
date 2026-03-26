import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { groupId, groupName, memberUserIds, subject, htmlContent } = body;

    if (!groupId || !memberUserIds || !subject || !htmlContent) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch member emails from User entity
    const allUsers = await base44.entities.User.list();
    const memberEmails = allUsers
      .filter(u => memberUserIds.includes(u.id))
      .map(u => u.email)
      .filter(Boolean);

    if (memberEmails.length === 0) {
      return Response.json({ error: 'No valid member emails found' }, { status: 400 });
    }

    // Send newsletter to each member
    const results = [];
    for (const email of memberEmails) {
      try {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: subject,
          body: htmlContent,
          from_name: `${groupName} Admin`,
        });
        results.push({ email, status: 'sent' });
      } catch (error) {
        console.error(`Failed to send to ${email}:`, error);
        results.push({ email, status: 'failed', error: error.message });
      }
    }

    const sentCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    // Log newsletter
    await base44.entities.NewsletterLog.create({
      group_id: groupId,
      sent_by_user_id: user.id,
      sent_by_name: user.full_name,
      subject: subject,
      recipients_count: memberEmails.length,
      sent_count: sentCount,
      failed_count: failedCount,
      sent_date: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      sent_count: sentCount,
      failed_count: failedCount,
      results,
    });
  } catch (error) {
    console.error('Newsletter error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});