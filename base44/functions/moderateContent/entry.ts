import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Category → priority mapping
const PRIORITY_MAP = {
  harassment: 'high',
  self_harm: 'critical',
  sexual: 'critical',
  violence: 'high',
  spam: 'low',
  hate: 'high',
};

async function classifyWithOpenAI(text) {
  if (!OPENAI_API_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;
    return {
      flagged: result.flagged,
      categories: result.categories,
      scores: result.category_scores,
    };
  } catch (e) {
    console.error('OpenAI moderation error:', e.message);
    return null;
  }
}

// Heuristic fallback when no OpenAI key
function heuristicCheck(text) {
  const lower = text.toLowerCase();
  const patterns = {
    harassment: ['idiot', 'stupid', 'shut up', 'hate you', 'kill yourself'],
    self_harm: ['kill myself', 'end it all', 'want to die', 'suicide'],
    spam: ['buy now', 'click here', 'free money', 'earn $', 'limited offer'],
    doxxing: ['home address', 'phone number is', 'lives at', 'works at'],
    lashon_hara: [],  // too nuanced for regex; leave for human review
  };
  const flags = {};
  for (const [cat, words] of Object.entries(patterns)) {
    if (words.some(w => lower.includes(w))) flags[cat] = true;
  }
  return Object.keys(flags).length > 0 ? { flagged: true, categories: flags } : { flagged: false };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { text, content_id, content_type, author_id } = await req.json();

    if (!text || !content_id || !content_type) {
      return Response.json({ error: 'text, content_id, content_type required' }, { status: 400 });
    }

    // Run AI moderation
    let modResult = await classifyWithOpenAI(text);
    if (!modResult) modResult = heuristicCheck(text);

    if (!modResult.flagged) {
      return Response.json({ flagged: false });
    }

    // Determine priority from triggered categories
    const triggeredCategories = Object.entries(modResult.categories || {})
      .filter(([, v]) => v === true || v > 0.5)
      .map(([k]) => k);

    let priority = 'medium';
    for (const cat of triggeredCategories) {
      const p = PRIORITY_MAP[cat];
      if (p === 'critical') { priority = 'critical'; break; }
      if (p === 'high') priority = 'high';
    }

    // Create an auto-flag report
    await base44.asServiceRole.entities.Report.create({
      reporter_id: 'ai_filter',
      reported_content_id: content_id,
      content_type,
      reason: triggeredCategories[0] || 'inappropriate',
      details: `AI auto-flagged. Categories: ${triggeredCategories.join(', ')}. Scores: ${JSON.stringify(modResult.scores || {})}`,
      priority,
      ai_flagged: true,
      resolved: false,
    });

    console.log(`AI flagged ${content_type} ${content_id} — priority: ${priority}, cats: ${triggeredCategories}`);
    return Response.json({ flagged: true, priority, categories: triggeredCategories });

  } catch (err) {
    console.error('moderateContent error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});