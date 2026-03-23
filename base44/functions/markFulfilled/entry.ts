import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { requestId } = await req.json();

  // Only the requester can mark as fulfilled
  const request = await base44.entities.MitzvahRequest.get(requestId);
  if (request.created_by_user_id !== user.id) {
    return Response.json({ error: 'Only the requester can mark this as fulfilled' }, { status: 403 });
  }

  const updated = await base44.entities.MitzvahRequest.update(requestId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });

  // Increment helps_this_week on the helper's VolunteerProfile
  if (request.claimed_by_user_id) {
    const profiles = await base44.asServiceRole.entities.VolunteerProfile.filter({ user_id: request.claimed_by_user_id });
    if (profiles.length > 0) {
      const profile = profiles[0];
      await base44.asServiceRole.entities.VolunteerProfile.update(profile.id, {
        helps_this_week: (profile.helps_this_week ?? 0) + 1,
      });
    }

    // Notify the helper
    await base44.asServiceRole.entities.Notification.create({
      user_id: request.claimed_by_user_id,
      type: 'request_fulfilled',
      message: `"${request.title}" has been marked as fulfilled. Thank you for your help!`,
      link: `/MitzvahCircle?request=${requestId}`,
      read: false,
    });
  }

  return Response.json({ request: updated });
});