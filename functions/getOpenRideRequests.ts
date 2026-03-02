import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const requests = await base44.entities.MitzvahRequest.filter(
    { category: 'Ride', status: 'open' },
    '-urgency',
    100
  );

  return Response.json({ requests });
});