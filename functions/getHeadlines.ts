import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rssUrl } = await req.json();

    if (!rssUrl) {
      return Response.json({ error: 'RSS URL required' }, { status: 400 });
    }

    // Fetch RSS feed from server-side
    const response = await fetch(rssUrl);
    if (!response.ok) {
      return Response.json({ 
        error: `Failed to fetch RSS: ${response.status} ${response.statusText}` 
      }, { status: 500 });
    }

    const xmlText = await response.text();

    // Parse XML to JSON
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return Response.json({ 
        error: 'Failed to parse RSS XML',
        details: parserError.textContent
      }, { status: 500 });
    }

    // Extract items
    const items = Array.from(doc.querySelectorAll('item')).map(item => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      
      // Extract source from channel title
      const channelTitle = doc.querySelector('channel > title')?.textContent || 'Unknown Source';

      return {
        title: title.trim(),
        link: link.trim(),
        pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        description: description.trim().substring(0, 200),
        source: channelTitle
      };
    });

    // Filter out items without links and sort by date
    const validItems = items
      .filter(item => item.link && item.title)
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 20);

    return Response.json({ 
      ok: true, 
      items: validItems,
      count: validItems.length
    });

  } catch (error) {
    console.error('getHeadlines error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
});