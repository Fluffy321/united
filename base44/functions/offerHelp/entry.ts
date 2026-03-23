import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { requestId } = await req.json();

  // Check for duplicate offer
  const existing = await base44.entities.HelpOffer.filter({ request_id: requestId, helper_user_id: user.id });
  if (existing.length > 0) {
    return Response.json({ error: 'You already offered help for this request' }, { status: 409 });
  }

  const offer = await base44.entities.HelpOffer.create({
    request_id: requestId,
    helper_user_id: user.id,
    helper_name: user.full_name,
    status: 'active',
  });

  // Increment offers_count on the request
  const request = await base44.entities.MitzvahRequest.get(requestId);
  await base44.entities.MitzvahRequest.update(requestId, {
    offers_count: (request.offers_count ?? 0) + 1,
  });

  // Notify the requester
  await base44.asServiceRole.entities.Notification.create({
    user_id: request.created_by_user_id,
    type: 'help_offer',
    message: `${user.full_name} offered to help with "${request.title}"`,
    link: `/MitzvahCircle?request=${requestId}`,
    read: false,
  });

  return Response.json({ offer });
});