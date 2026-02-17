import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FALLBACK_FEEDS = {
  fivetowns: [
    'https://5tjt.com/feed',
    'https://www.jewishpress.com/feed/'
  ],
  israel: [
    'https://www.israelnationalnews.com/RSS.aspx',
    'https://www.jpost.com/rss',
    'https://www.timesofisrael.com/the-daily-edition/rss-feed/'
  ]
};

async function tryFetchFeed(urls) {
  const attempts = [];
  
  for (const url of urls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MitzvahApp/1.0)',
          'Accept': 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7'
        },
        redirect: 'follow'
      });
      clearTimeout(timeoutId);
      
      attempts.push({ url, status: response.status });
      
      // Skip 404/403 and try next
      if (response.status === 404 || response.status === 403) {
        continue;
      }
      
      if (!response.ok) {
        continue;
      }
      
      const xmlText = await response.text();
      
      // Detect blocked/HTML responses
      const lowerText = xmlText.toLowerCase();
      if (xmlText.trim().startsWith('<!doctype html') || lowerText.includes('cloudflare')) {
        continue;
      }
      
      return { success: true, xmlText, url, attempts };
      
    } catch (error) {
      clearTimeout(timeoutId);
      attempts.push({ url, status: 'timeout/error' });
      continue;
    }
  }
  
  return { success: false, attempts };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ ok: false, error: 'Unauthorized', items: [] }, { status: 200 });
    }

    const body = await req.json();
    const sourceType = body?.sourceType || 'fivetowns';
    const urls = FALLBACK_FEEDS[sourceType] || [body?.rssUrl || FALLBACK_FEEDS.fivetowns[0]];

    // Try to fetch from fallback URLs
    const fetchResult = await tryFetchFeed(urls);
    
    if (!fetchResult.success) {
      return Response.json({
        ok: false,
        error: 'All sources failed',
        attempts: fetchResult.attempts,
        items: []
      }, { status: 200 });
    }
    
    const { xmlText, url: successUrl } = fetchResult;

    // Parse XML to JSON
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return Response.json({ 
        ok: false,
        error: 'Parse failed',
        sample: xmlText.slice(0, 200),
        items: []
      }, { status: 200 });
    }

    // Try RSS format first (<item>), then Atom (<entry>)
    let items = [];
    let channelTitle = '';
    
    const rssItems = doc.querySelectorAll('item');
    if (rssItems.length > 0) {
      // RSS format
      channelTitle = doc.querySelector('channel > title')?.textContent || 'Unknown Source';
      
      items = Array.from(rssItems).map(item => {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        
        // Strip HTML tags from description and limit to 200 chars
        const plainDescription = description.replace(/<[^>]*>/g, '').trim();
        const excerpt = plainDescription.substring(0, 200) + (plainDescription.length > 200 ? '...' : '');

        return {
          title: title.trim(),
          link: link.trim(),
          pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          excerpt: excerpt,
          source: channelTitle
        };
      });
    } else {
      // Try Atom format (<entry>)
      const atomEntries = doc.querySelectorAll('entry');
      if (atomEntries.length > 0) {
        channelTitle = doc.querySelector('feed > title')?.textContent || 'Unknown Source';
        
        items = Array.from(atomEntries).map(entry => {
          const title = entry.querySelector('title')?.textContent || '';
          const linkEl = entry.querySelector('link[href]');
          const link = linkEl?.getAttribute('href') || '';
          const updated = entry.querySelector('updated')?.textContent || '';
          const summary = entry.querySelector('summary')?.textContent || entry.querySelector('content')?.textContent || '';
          
          const plainSummary = summary.replace(/<[^>]*>/g, '').trim();
          const excerpt = plainSummary.substring(0, 200) + (plainSummary.length > 200 ? '...' : '');

          return {
            title: title.trim(),
            link: link.trim(),
            pubDate: updated ? new Date(updated).toISOString() : new Date().toISOString(),
            excerpt: excerpt,
            source: channelTitle
          };
        });
      }
    }

    // If no items found, return parse error
    if (items.length === 0) {
      return Response.json({ 
        ok: false,
        error: 'Parse failed',
        sample: xmlText.slice(0, 200),
        items: []
      }, { status: 200 });
    }

    // Filter out items without links and sort by date
    const validItems = items
      .filter(item => item.link && item.title)
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 10);

    return Response.json({ 
      ok: true, 
      items: validItems,
      count: validItems.length
    }, { status: 200 });

  } catch (error) {
    console.error('getHeadlines error:', error);
    return Response.json({ 
      ok: false,
      error: 'Unexpected error',
      items: []
    }, { status: 200 });
  }
});