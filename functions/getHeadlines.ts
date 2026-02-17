import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ ok: false, error: 'Unauthorized', items: [] }, { status: 200 });
    }

    const body = await req.json();
    const { rssUrl } = body;

    if (!rssUrl) {
      return Response.json({ ok: false, error: 'RSS URL required', items: [] }, { status: 200 });
    }

    // Fetch RSS feed from server-side with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    let response;
    try {
      response = await fetch(rssUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return Response.json({ 
        ok: false, 
        error: 'Failed to fetch RSS feed',
        items: []
      }, { status: 200 });
    }

    if (!response.ok) {
      return Response.json({ 
        ok: false,
        error: `RSS feed returned ${response.status}`,
        items: []
      }, { status: 200 });
    }

    const xmlText = await response.text();

    // Parse XML to JSON
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return Response.json({ 
        ok: false,
        error: 'Invalid RSS XML format',
        items: []
      }, { status: 200 });
    }

    // Extract source from channel title
    const channelTitle = doc.querySelector('channel > title')?.textContent || 'Unknown Source';

    // Extract items
    const items = Array.from(doc.querySelectorAll('item')).map(item => {
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