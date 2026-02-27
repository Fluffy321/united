import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { communityId } = await req.json();
    if (!communityId) return Response.json({ error: 'communityId required' }, { status: 400 });

    const [allLogs, memberships] = await Promise.all([
      base44.asServiceRole.entities.ChesedLog.filter({ community_id: communityId }),
      base44.asServiceRole.entities.UserCommunity.filter({ community_id: communityId }),
    ]);

    const totalHours = allLogs.reduce((sum, log) => sum + (log.hours || 0), 0);

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyHours = allLogs
      .filter(log => new Date(log.created_date).getTime() >= weekAgo)
      .reduce((sum, log) => sum + (log.hours || 0), 0);

    return Response.json({
      totalHours,
      weeklyHours,
      memberCount: memberships.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});