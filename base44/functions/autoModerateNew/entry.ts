import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

async function classifyWithOpenAI(text) {
  if (!OPENAI_API_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;
    return { flagged: result.flagged, categories: result.categories, scores: result.category_scores };
  } catch { return null; }
}

function heuristicCheck(text) {
  const lower = text.toLowerCase();
  const patterns = {
    harassment: ['idiot', 'stupid', 'shut up', 'hate you', 'kill yourself', 'loser'],
    self_harm: ['kill myself', 'end it all', 'want to die', 'suicidal'],
    spam: ['buy now', 'click here', 'free money', 'earn $', 'limited offer', 'make money fast'],
    doxxing: ['home address', 'phone number is', 'lives at'],
  };
  const flags = {};
  for (const [cat, words] of Object.entries(patterns)) {
    if (words.some(w => lower.includes(w))) flags[cat] = true;
  }
  return Object.keys(flags).length > 0 ? { flagged: true, categories: flags } : { flagged: false };
}

const PRIORITY_MAP = { harassment: 'high', self_harm: 'critical', sexual: 'critical', violence: 'high', spam: 'low', hate: 'high', doxxing: 'high' };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Called from entity automation: payload has event, data
    const { event, data } = payload;
    if (!data) return Response.json({ skipped: 'no data' });

    const entityType = event?.entity_name;
    let text = '';
    let contentId = data.id;
    let contentType = entityType === 'CommunityPost' ? 'community_post' :
                      entityType === 'Comment' ? 'comment' :
                      entityType === 'UnifiedPost' ? 'unified_post' :
                      entityType === 'Message' ? 'message' : 'post';

    if (entityType === 'CommunityPost') text = [data.title, data.body].filter(Boolean).join(' ');
    else if (entityType === 'Comment') text = data.body || '';
    else if (entityType === 'Message') text = data.content || '';
    else if (entityType === 'UnifiedPost') text = [data.title, data.body].filter(Boolean).join(' ');
    else text = data.content || data.body || data.description || '';

    if (!text || text.length < 5) return Response.json({ skipped: 'too short' });

    let modResult = await classifyWithOpenAI(text);
    if (!modResult) modResult = heuristicCheck(text);
    if (!modResult.flagged) return Response.json({ flagged: false });

    const triggeredCategories = Object.entries(modResult.categories || {})
      .filter(([, v]) => v === true || (typeof v === 'number' && v > 0.5))
      .map(([k]) => k);

    let priority = 'medium';
    for (const cat of triggeredCategories) {
      const p = PRIORITY_MAP[cat];
      if (p === 'critical') { priority = 'critical'; break; }
      if (p === 'high') priority = 'high';
    }

    await base44.asServiceRole.entities.Report.create({
      reporter_id: 'ai_filter',
      reported_content_id: contentId,
      content_type: contentType,
      reason: triggeredCategories[0] || 'inappropriate',
      details: `AI auto-flagged. Categories: ${triggeredCategories.join(', ')}`,
      priority,
      ai_flagged: true,
      target_user_id: data.author_id || data.sender_id || data.user_id || undefined,
      target_user_name: data.author_name || data.sender_name || undefined,
      content_preview: text.slice(0, 200),
      resolved: false,
    });

    console.log(`[autoModerate] flagged ${contentType} ${contentId} — ${priority}`);
    return Response.json({ flagged: true, priority });
  } catch (err) {
    console.error('autoModerateNew error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});