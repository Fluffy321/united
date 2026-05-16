import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const COMMUNITY_ID = 'seed-daily-torah';
const COMMUNITY_NAME = 'Daily Torah';
const TZ = 'America/New_York';
const SEFARIA_BASE = 'https://www.sefaria.org/api/texts/';
const HEBCAL_SHABBAT = 'https://www.hebcal.com/shabbat?cfg=json&zip=11516&M=on';

const DAILY_SOURCES = [
  {
    slot: 'morning',
    hour: 7,
    ref: 'Pirkei Avot 1:2',
    title: 'Morning Torah: the three pillars',
    action: 'Choose one small act of Torah, avodah, or chesed that can shape the tone of your day.',
  },
  {
    slot: 'afternoon',
    hour: 13,
    ref: 'Proverbs 3:6',
    title: 'Midday Torah: bring Hashem into the route',
    action: 'Before the next decision, pause and name what a more honest, Jewish choice would look like.',
  },
  {
    slot: 'evening',
    hour: 20,
    ref: 'Psalms 121:1',
    title: 'Evening Torah: lift your eyes',
    action: 'Write one sentence about where you needed help today, and where you noticed help arrive.',
  },
];

function getParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const read = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return {
    dateKey: `${read('year')}-${read('month')}-${read('day')}`,
    weekday: read('weekday'),
    hour: Number(read('hour') || '0'),
  };
}

function normalizeText(value: unknown) {
  if (Array.isArray(value)) return value.flat(Infinity).filter(Boolean).join(' ');
  return String(value || '').trim();
}

function sourceUrlFor(ref: string) {
  return `https://www.sefaria.org/${toSefariaPath(ref)}`;
}

function toSefariaPath(ref: string) {
  return ref
    .replace(/\s+/g, '_')
    .replace(/_(\d+):(\d+)$/g, '.$1.$2');
}

async function fetchSefaria(ref: string) {
  const url = `${SEFARIA_BASE}${encodeURIComponent(toSefariaPath(ref))}?context=0&commentary=0`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'JUnitedDailyTorah/1.0' },
  });
  if (!response.ok) throw new Error(`Sefaria ${response.status} for ${ref}`);
  const data = await response.json();
  return {
    ref: data?.ref || ref,
    heRef: data?.heRef || '',
    text: normalizeText(data?.text),
    url: data?.url ? `https://www.sefaria.org${data.url}` : sourceUrlFor(ref),
  };
}

async function fetchParsha() {
  const response = await fetch(HEBCAL_SHABBAT, {
    headers: { Accept: 'application/json', 'User-Agent': 'JUnitedDailyTorah/1.0' },
  });
  if (!response.ok) throw new Error(`Hebcal ${response.status}`);
  const data = await response.json();
  return (data?.items || []).find((item: any) => item?.category === 'parashat');
}

function buildDailyPost(source: any, dateKey: string, item: any) {
  return {
    sourceKey: `daily-torah:${dateKey}:${source.slot}`,
    title: source.title,
    type: 'announcement',
    body: [
      `${source.ref}: ${item.text}`,
      '',
      `Reflect: ${source.action}`,
      '',
      `Verified source: Sefaria (${item.ref || source.ref})`,
      item.url,
    ].join('\n'),
    source_name: 'Sefaria',
    source_ref: item.ref || source.ref,
    source_url: item.url,
  };
}

function buildParshaPosts(parsha: any, dateKey: string) {
  if (!parsha) return [];
  const torah = parsha?.leyning?.torah || 'this week’s parsha';
  const title = parsha?.title || 'This week’s parsha';
  const link = parsha?.link || 'https://www.hebcal.com/shabbat';
  return [
    {
      sourceKey: `daily-torah:${dateKey}:friday-parsha-1`,
      title: `${title}: what is the week asking from us?`,
      type: 'announcement',
      body: [
        `${title} is this week’s parsha. Torah reading: ${torah}.`,
        '',
        'Dvar Torah prompt: What is one responsibility in the parsha that can become one real action before Shabbos?',
        '',
        `Verified calendar/source: Hebcal`,
        link,
      ].join('\n'),
      source_name: 'Hebcal',
      source_ref: torah,
      source_url: link,
    },
    {
      sourceKey: `daily-torah:${dateKey}:friday-parsha-2`,
      title: `${title}: one table question for Shabbos`,
      type: 'question',
      body: [
        `Use this at the table: Where do we see ${title.replace(/^Parashat\s+/i, '')} showing us how individuals become part of a larger people?`,
        '',
        `Verified calendar/source: Hebcal`,
        link,
      ].join('\n'),
      source_name: 'Hebcal',
      source_ref: torah,
      source_url: link,
    },
  ];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body: any = {};
    try { body = await req.json(); } catch (_) {}

    const { dateKey, weekday, hour } = getParts();
    const requestedSlot = body?.slot || null;
    const dueDailySources = DAILY_SOURCES.filter((source) => (
      requestedSlot ? requestedSlot === source.slot : hour >= source.hour
    ));

    const existing = await base44.asServiceRole.entities.UnifiedPost.filter(
      { community_id: COMMUNITY_ID },
      '-created_date',
      80,
    );
    const existingText = new Set(
      (existing || []).map((post: any) => `${post.migrated_from || ''} ${post.title || ''} ${post.body || ''}`),
    );

    const candidates = [];
    for (const source of dueDailySources) {
      try {
        const item = await fetchSefaria(source.ref);
        candidates.push(buildDailyPost(source, dateKey, item));
      } catch (error) {
        console.error('Sefaria fetch failed:', source.ref, error);
      }
    }

    if ((requestedSlot === 'friday-parsha' || (!requestedSlot && weekday === 'Fri' && hour >= 12))) {
      try {
        candidates.push(...buildParshaPosts(await fetchParsha(), dateKey));
      } catch (error) {
        console.error('Hebcal parsha fetch failed:', error);
      }
    }

    const created = [];
    for (const candidate of candidates) {
      if ([...existingText].some((text) => text.includes(candidate.sourceKey))) continue;
      const post = await base44.asServiceRole.entities.UnifiedPost.create({
        user_id: 'official-daily-torah',
        user_name: 'JUnited Torah Desk',
        author_name: 'JUnited Torah Desk',
        community_id: COMMUNITY_ID,
        community_name: COMMUNITY_NAME,
        board: 'feed',
        type: candidate.type,
        post_type: candidate.type,
        title: candidate.title,
        body: candidate.body,
        content: candidate.body,
        is_official: true,
        is_pinned: candidate.type === 'announcement',
        source_name: candidate.source_name,
        source_ref: candidate.source_ref,
        source_url: candidate.source_url,
        migrated_from: candidate.sourceKey,
      });
      created.push(post);
      existingText.add(candidate.sourceKey);
    }

    return Response.json({
      ok: true,
      community_id: COMMUNITY_ID,
      dateKey,
      created: created.length,
      skipped: Math.max(0, candidates.length - created.length),
    });
  } catch (error) {
    console.error('publishDailyTorah error:', error);
    return Response.json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
});
