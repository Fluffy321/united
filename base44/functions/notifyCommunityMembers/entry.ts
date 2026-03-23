import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { communityId, message } = await req.json();
    if (!communityId || !message) return Response.json({ error: 'communityId and message required' }, { status: 400 });

    const members = await base44.asServiceRole.entities.UserCommunity.filter({ community_id: communityId });

    await Promise.all(members.map(m =>
      base44.asServiceRole.entities.Notification.create({
        user_id: m.user_id,
        type: 'ANNOUNCEMENT',
        message,
        link: `/communities/${communityId}`,
        read: false,
      })
    ));

    return Response.json({ success: true, notified: members.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});