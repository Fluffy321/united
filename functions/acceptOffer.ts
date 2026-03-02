import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { requestId, helperId } = await req.json();

  // Only the requester can accept an offer
  const request = await base44.entities.MitzvahRequest.get(requestId);
  if (request.created_by_user_id !== user.id) {
    return Response.json({ error: 'Only the requester can accept an offer' }, { status: 403 });
  }

  // Update the request status and set the accepted helper
  const updated = await base44.entities.MitzvahRequest.update(requestId, {
    status: 'in_progress',
    claimed_by_user_id: helperId,
  });

  // Mark the accepted offer as active, cancel all others
  const offers = await base44.asServiceRole.entities.HelpOffer.filter({ request_id: requestId });
  await Promise.allSettled(
    offers.map(offer =>
      base44.asServiceRole.entities.HelpOffer.update(offer.id, {
        status: offer.helper_user_id === helperId ? 'active' : 'cancelled',
      })
    )
  );

  // Notify the accepted helper
  await base44.asServiceRole.entities.Notification.create({
    user_id: helperId,
    type: 'offer_accepted',
    message: `Your offer to help with "${request.title}" was accepted!`,
    link: `/MitzvahCircle?request=${requestId}`,
    read: false,
  });

  return Response.json({ request: updated });
});