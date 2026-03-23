import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_id } = await req.json();

    if (!user_id) {
      return Response.json({ error: 'user_id required' }, { status: 400 });
    }

    // Count completed help actions
    const actions = await base44.entities.MitzvahAction.filter({ user_id });
    const actionCount = actions.length;

    // Determine badge tier
    let badgeTier = 'none';
    if (actionCount >= 50) badgeTier = 'leader';
    else if (actionCount >= 25) badgeTier = 'volunteer';
    else if (actionCount >= 10) badgeTier = 'trusted';

    // Update user
    await base44.auth.updateMe({
      helper_actions_count: actionCount,
      helper_badge: badgeTier
    });

    return Response.json({ 
      success: true, 
      badge: badgeTier, 
      actionCount 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});