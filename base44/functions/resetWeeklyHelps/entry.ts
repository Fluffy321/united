import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const profiles = await base44.asServiceRole.entities.VolunteerProfile.list();
  const today = new Date().toISOString().split('T')[0];

  await Promise.allSettled(
    profiles.map(p =>
      base44.asServiceRole.entities.VolunteerProfile.update(p.id, {
        helps_this_week: 0,
        week_reset_date: today,
      })
    )
  );

  return Response.json({ reset: profiles.length });
});