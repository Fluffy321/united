import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const KEEP_NAMES = new Set([
  'Young Israel of Woodmere',
  'Congregation Beth Sholom',
  'Congregation Sons of Israel',
  'Khal Bnei Torah',
  'Beis Tefilah of Woodmere',
  'Chabad of Woodmere',
  'Ohr Torah of Woodmere',
  'Aish Kodesh',
  'Shaaray Tefila of Lawrence',
  'Congregation Bais Tefilah',
]);

const FIVE_TOWNS = new Set(['Lawrence', 'Cedarhurst', 'Woodmere', 'Inwood', 'Hewlett']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Fetch all communities
    const all = await base44.asServiceRole.entities.Community.list('-created_date', 5000);
    console.log(`[pruneToMainTen] Total communities: ${all.length}`);

    // Delete: seeded + unclaimed + NOT in keep list
    const toDelete = all.filter(c =>
      c.is_seeded === true &&
      c.is_claimed !== true &&
      !KEEP_NAMES.has(c.name)
    );

    console.log(`[pruneToMainTen] Deleting ${toDelete.length} communities…`);

    const BATCH = 20;
    for (let i = 0; i < toDelete.length; i += BATCH) {
      await Promise.all(
        toDelete.slice(i, i + BATCH).map(c =>
          base44.asServiceRole.entities.Community.delete(c.id)
        )
      );
    }

    // Ensure the 10 shuls exist — upsert any missing ones
    const remaining = await base44.asServiceRole.entities.Community.list('-created_date', 5000);
    const remainingNames = new Set(remaining.map(c => c.name));

    const MAIN_SHULS = [
      { name: 'Young Israel of Woodmere', type: 'Shul', neighborhood: 'Woodmere', address: '135 Irving Place, Woodmere, NY 11598', phone: '516-295-0950', website: 'yiwoodmere.org', description_short: 'Vibrant Modern Orthodox congregation with daily shiurim, extensive youth programming, and an active membership spanning all generations.' },
      { name: 'Congregation Beth Sholom', type: 'Shul', neighborhood: 'Woodmere', address: '390 Broadway, Woodmere, NY 11598', phone: '516-295-1910', website: '', description_short: 'Traditional Conservative congregation offering meaningful services and warm community programming for families in Woodmere.' },
      { name: 'Congregation Sons of Israel', type: 'Shul', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '516-374-1360', website: '', description_short: 'Welcoming Orthodox congregation in Woodmere with daily minyanim and a strong commitment to Torah learning and community.' },
      { name: 'Khal Bnei Torah', type: 'Shul', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '516-295-7710', website: '', description_short: 'Yeshivish congregation in Woodmere known for its intense beis medrash atmosphere and outstanding daily learning programs.' },
      { name: 'Beis Tefilah of Woodmere', type: 'Shul', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '516-295-4660', website: '', description_short: 'Warm and welcoming shul in Woodmere providing heartfelt davening and a close-knit Orthodox community experience.' },
      { name: 'Chabad of Woodmere', type: 'Shul', neighborhood: 'Woodmere', address: '700 Branch Blvd, Woodmere, NY 11598', phone: '516-295-2478', website: 'chabadwoodmere.com', description_short: 'Inclusive Chabad shul offering Shabbat and holiday services, Torah classes, and a warm welcome for all backgrounds.' },
      { name: 'Ohr Torah of Woodmere', type: 'Shul', neighborhood: 'Woodmere', address: 'Woodmere, NY 11598', phone: '516-374-5648', website: '', description_short: 'Modern Orthodox congregation in Woodmere dedicated to inspiring tefillah, accessible Torah learning, and strong community bonds.' },
      { name: 'Aish Kodesh', type: 'Shul', neighborhood: 'Woodmere', address: '35 W Broadway, Woodmere, NY 11598', phone: '516-295-4929', website: '', description_short: 'Spiritually inspired shul led by Rabbi Moshe Weinberger, blending Chassidic warmth with deep Torah scholarship.' },
      { name: 'Shaaray Tefila of Lawrence', type: 'Shul', neighborhood: 'Lawrence', address: '44 Frost Lane, Lawrence, NY 11559', phone: '516-239-1772', website: '', description_short: 'Established Orthodox shul serving Lawrence with heartfelt tefillah, robust Torah education, and a welcoming kehilla atmosphere.' },
      { name: 'Congregation Bais Tefilah', type: 'Shul', neighborhood: 'Lawrence', address: 'Lawrence, NY 11559', phone: '516-295-7550', website: '', description_short: 'Welcoming Lawrence shul with a heimish atmosphere, daily minyanim, and a strong commitment to chesed and community.' },
    ];

    let upserted = 0;
    for (const shul of MAIN_SHULS) {
      if (!remainingNames.has(shul.name)) {
        const domain = shul.website ? shul.website : null;
        const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : null;
        await base44.asServiceRole.entities.Community.create({
          ...shul,
          is_seeded: true,
          is_claimed: false,
          is_featured: true,
          follower_count: Math.floor(Math.random() * 600) + 100,
          ...(logoUrl ? { logo_url: logoUrl, logo_source: 'AUTO' } : { logo_source: 'NONE' }),
        });
        upserted++;
      }
    }

    const finalAll = await base44.asServiceRole.entities.Community.list('-created_date', 5000);
    console.log(`[pruneToMainTen] Done. deleted=${toDelete.length} upserted=${upserted} total=${finalAll.length}`);

    return Response.json({
      ok: true,
      deletedCount: toDelete.length,
      upserted,
      totalAfter: finalAll.length,
    });
  } catch (err) {
    console.error('[pruneToMainTen] ERROR:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});