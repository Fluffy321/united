import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all in-progress requests older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const requests = await base44.asServiceRole.entities.MitzvahRequest.filter({ 
      status: 'InProgress'
    });

    const oldRequests = requests.filter(r => r.updated_date < oneDayAgo);

    for (const request of oldRequests) {
      // Check if helper marked as complete
      const [offer] = await base44.asServiceRole.entities.HelpOffer.filter({ 
        request_id: request.id 
      });

      if (offer && offer.completed_by_helper) {
        // Send reminder to requester
        await base44.asServiceRole.functions.invoke('sendMitzvahNotification', {
          type: 'completion_reminder',
          recipientId: request.created_by_user_id,
          requestTitle: request.title
        });
      }
    }

    return Response.json({ 
      success: true, 
      reminders_sent: oldRequests.length 
    });
  } catch (error) {
    console.error('Reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});