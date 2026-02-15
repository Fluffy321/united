import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { type, recipientId, helperName, requestTitle, locationLabel } = await req.json();

    // Get recipient email
    const [recipient] = await base44.asServiceRole.entities.User.filter({ id: recipientId });
    
    if (!recipient || !recipient.email) {
      return Response.json({ error: 'Recipient not found' }, { status: 404 });
    }

    let subject, body;

    if (type === 'help_accepted') {
      subject = 'Someone wants to help with your mitzvah!';
      body = `Great news! ${helperName} has offered to help with your request: "${requestTitle}"\n\nCheck your messages to coordinate the details.\n\n- United Community`;
    } else if (type === 'completion_reminder') {
      subject = 'Did your mitzvah get completed?';
      body = `Hi! Can you confirm if your mitzvah request "${requestTitle}" was completed?\n\nThis helps our community track impact and rewards helpers.\n\n- United Community`;
    } else if (type === 'requester_message') {
      subject = 'New message about your mitzvah offer';
      body = `You have a new message about the mitzvah: "${requestTitle}"\n\nCheck your messages to respond.\n\n- United Community`;
    } else if (type === 'nearby_request') {
      subject = `New mitzvah request near ${locationLabel || 'you'}`;
      body = `A new mitzvah request has been posted near ${locationLabel || 'your area'}: "${requestTitle}"\n\nCheck the Mitzvah Circle to see if you can help!\n\n- United Community`;
    } else if (type === 'mitzvah_completed') {
      subject = 'Mitzvah completed!';
      body = `Great news! Your mitzvah "${requestTitle}" has been marked as completed.\n\n${helperName} has earned 10 points for helping!\n\n- United Community`;
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient.email,
      from_name: 'United Community',
      subject,
      body
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});