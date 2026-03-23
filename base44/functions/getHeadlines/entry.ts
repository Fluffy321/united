import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { XMLParser } from 'npm:fast-xml-parser@4.3.6';

const FALLBACK_FEEDS = {
  fivetowns: [
    'https://5tjt.com/feed',
    'https://www.jewishpress.com/feed/'
  ],
  israel: [
    'https://www.jewishpress.com/feed/',
    'https://www.breakingisraelnews.com/feed/',
    'https://www.i24news.tv/feed'
  ]
};

function parseXml(xmlText) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '__cdata',
    textNodeName: '#text',
    parseTagValue: false,
    trimValues: true,
    allowBooleanAttributes: true,
    processEntities: true,
    ignoreDeclaration: true,
    isArray: (name) => ['item', 'entry'].includes(name)
  });
  return parser.parse(xmlText);
}

function extractItems(parsed, sourceUrl) {
  // RSS format: rss.channel.item[]
  const rssChannel = parsed?.rss?.channel;
  if (rssChannel) {
    const channelTitle = rssChannel.title?.['__cdata'] || rssChannel.title || sourceUrl;
    const rawItems = rssChannel.item || [];
    return { format: 'rss', channelTitle, rawItems };
  }

  // Atom format: feed.entry[]
  const atomFeed = parsed?.feed;
  if (atomFeed) {
    const channelTitle = atomFeed.title?.['__cdata'] || atomFeed.title || sourceUrl;
    const rawItems = atomFeed.entry || [];
    return { format: 'atom', channelTitle, rawItems };
  }

  return null;
}

function extractImageFromRssItem(item, description) {
  // 1. media:content or media:thumbnail
  const mediaContent = item['media:content'] || item['media:thumbnail'];
  if (mediaContent) {
    const url = mediaContent?.['@_url'] || (Array.isArray(mediaContent) ? mediaContent[0]?.['@_url'] : null);
    if (url) return url;
  }
  // 2. enclosure
  const enclosure = item.enclosure;
  if (enclosure) {
    const url = enclosure?.['@_url'] || (Array.isArray(enclosure) ? enclosure[0]?.['@_url'] : null);
    const type = enclosure?.['@_type'] || '';
    if (url && (type.startsWith('image') || !type)) return url;
  }
  // 3. Scrape <img> from description HTML
  if (description) {
    const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1]) return imgMatch[1];
  }
  return null;
}

function mapRssItem(item, channelTitle) {
  const title = item.title?.['__cdata'] || item.title || '';
  const link = item.link?.['__cdata'] || item.link || item.guid?.['#text'] || item.guid || '';
  const pubDate = item.pubDate || item['dc:date'] || '';
  const description = item.description?.['__cdata'] || item.description || '';
  const plain = description.replace(/<[^>]*>/g, '').trim();
  const image = extractImageFromRssItem(item, description);
  return {
    title: String(title).trim(),
    link: String(link).trim(),
    pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    excerpt: plain.slice(0, 200) + (plain.length > 200 ? '...' : ''),
    source: String(channelTitle).trim(),
    image: image || null
  };
}

function mapAtomEntry(entry, channelTitle) {
  const title = entry.title?.['__cdata'] || entry.title || '';
  const linkAttr = entry.link?.['@_href'] || '';
  const altLink = Array.isArray(entry.link)
    ? (entry.link.find(l => l['@_rel'] === 'alternate') || entry.link[0])?.['@_href'] || ''
    : linkAttr;
  const updated = entry.updated || entry.published || '';
  const summary = entry.summary?.['__cdata'] || entry.summary || entry.content?.['__cdata'] || entry.content || '';
  const plainSummary = String(summary);
  const image = extractImageFromRssItem(entry, plainSummary);
  const plain = plainSummary.replace(/<[^>]*>/g, '').trim();
  return {
    title: String(title).trim(),
    link: String(altLink).trim(),
    pubDate: updated ? new Date(updated).toISOString() : new Date().toISOString(),
    excerpt: plain.slice(0, 200) + (plain.length > 200 ? '...' : ''),
    source: String(channelTitle).trim(),
    image: image || null
  };
}

Deno.serve(async (req) => {
  const attempts = [];
  let stage = 'input';
  let lastUrl = '';
  let lastStatus = null;
  let lastSample = '';

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ ok: false, stage: 'auth', error: 'Unauthorized', items: [] });
    }

    stage = 'input';
    let body = {};
    try { body = await req.json(); } catch (_) {}
    const sourceType = body?.sourceType || 'fivetowns';
    const urls = FALLBACK_FEEDS[sourceType] || FALLBACK_FEEDS.fivetowns;

    let xmlText = null;
    let successUrl = null;

    for (const url of urls) {
      lastUrl = url;
      stage = 'fetch';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MitzvahApp/1.0)',
            'Accept': 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7'
          },
          redirect: 'follow'
        });
        clearTimeout(timeoutId);
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        attempts.push({ url, status: 'timeout/error', stage: 'fetch', error: String(fetchErr) });
        continue;
      }

      stage = 'status';
      lastStatus = response.status;
      attempts.push({ url, status: response.status, stage: 'status' });

      if (response.status === 403 || response.status === 404 || !response.ok) {
        continue;
      }

      stage = 'contentType';
      const text = await response.text();
      lastSample = text.slice(0, 300);

      stage = 'detectHtml';
      const lower = text.toLowerCase().trimStart();
      if (lower.startsWith('<!doctype html') || lower.includes('cloudflare')) {
        attempts.push({ url, status: response.status, stage: 'blocked', error: 'Feed blocked (HTML). Use different source.' });
        continue;
      }

      xmlText = text;
      successUrl = url;
      break;
    }

    if (!xmlText) {
      return Response.json({
        ok: false,
        stage,
        rssUrl: lastUrl,
        status: lastStatus,
        error: 'All sources failed',
        sample: lastSample,
        attempts,
        items: []
      });
    }

    stage = 'parse';
    let parsed;
    try {
      parsed = parseXml(xmlText);
    } catch (parseErr) {
      return Response.json({
        ok: false,
        stage: 'parse',
        rssUrl: successUrl,
        status: lastStatus,
        error: String(parseErr),
        sample: xmlText.slice(0, 300),
        attempts,
        items: []
      });
    }

    stage = 'map';
    const extracted = extractItems(parsed, successUrl);
    if (!extracted) {
      return Response.json({
        ok: false,
        stage: 'map',
        rssUrl: successUrl,
        status: lastStatus,
        error: 'No RSS channel or Atom feed found in parsed XML',
        sample: xmlText.slice(0, 300),
        attempts,
        items: []
      });
    }

    const { format, channelTitle, rawItems } = extracted;
    const mapped = rawItems
      .map(item => {
        try {
          return format === 'atom' ? mapAtomEntry(item, channelTitle) : mapRssItem(item, channelTitle);
        } catch (_) {
          return null;
        }
      })
      .filter(item => item && item.link && item.title)
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 10);

    // For items missing images, try to fetch OG image from the article page
    const items = await Promise.all(mapped.map(async (item) => {
      if (item.image) return item;
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(item.link, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MitzvahApp/1.0)' }
        });
        clearTimeout(tid);
        if (!res.ok) return item;
        const html = await res.text();
        const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (ogMatch?.[1]) return { ...item, image: ogMatch[1] };
      } catch (_) {}
      return item;
    }));

    if (items.length === 0) {
      return Response.json({
        ok: false,
        stage: 'map',
        rssUrl: successUrl,
        status: lastStatus,
        error: `Parsed ${format} but found 0 valid items (rawItems: ${rawItems.length})`,
        sample: xmlText.slice(0, 300),
        attempts,
        items: []
      });
    }

    return Response.json({ ok: true, items, count: items.length, source: channelTitle });

  } catch (err) {
    return Response.json({
      ok: false,
      stage,
      rssUrl: lastUrl,
      status: lastStatus,
      error: String(err),
      sample: lastSample,
      attempts,
      items: []
    });
  }
});