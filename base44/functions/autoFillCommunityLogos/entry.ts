import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get all communities that have a website but no logo yet
    const all = await base44.asServiceRole.entities.Community.list('-created_date', 2000);
    const needsLogo = all.filter(c => c.website && (!c.logo_url || c.logo_source === 'NONE'));

    let updated = 0;
    for (const community of needsLogo) {
      try {
        // Extract clean domain
        const domain = community.website
          .replace(/^https?:\/\//i, '')
          .replace(/^www\./i, '')
          .split('/')[0];

        if (!domain) continue;

        const logoUrl = `https://logo.clearbit.com/${domain}`;

        await base44.asServiceRole.entities.Community.update(community.id, {
          logo_url: logoUrl,
          logo_source: 'AUTO',
        });
        updated++;
      } catch {
        // skip individual failures silently
      }
    }

    return Response.json({ ok: true, updated, total_checked: needsLogo.length });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});