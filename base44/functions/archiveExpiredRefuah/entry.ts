import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Scheduled daily — auto-archives RefuahRequests past their expiry date.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const all = await base44.asServiceRole.entities.RefuahRequest.filter({ is_active: true }, '-created_date', 500);
    const now = new Date();
    let archived = 0;

    for (const r of all) {
      if (r.expires_at && new Date(r.expires_at) < now) {
        await base44.asServiceRole.entities.RefuahRequest.update(r.id, { is_active: false });
        archived++;
        console.log(`Archived RefuahRequest for ${r.patient_name} (expired ${r.expires_at})`);
      }
    }

    return Response.json({ success: true, archived });
  } catch (error) {
    console.error('archiveExpiredRefuah error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});