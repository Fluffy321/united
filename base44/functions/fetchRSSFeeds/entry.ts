import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all enabled news sources
    const sources = await base44.asServiceRole.entities.NewsSource.filter({ enabled: true });
    
    if (sources.length === 0) {
      return Response.json({ message: 'No enabled sources', count: 0 });
    }

    let newItemsCount = 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    for (const source of sources) {
      try {
        // Fetch RSS feed
        const response = await fetch(source.rss_url);
        const xmlText = await response.text();
        
        // Parse RSS/Atom feed
        const items = parseRSSFeed(xmlText, source);
        
        // Get existing URLs to dedupe
        const existingItems = await base44.asServiceRole.entities.NewsItem.filter({ 
          source_id: source.id 
        }, '-created_date', 100);
        const existingUrls = new Set(existingItems.map(item => item.url));

        // Store new items
        for (const item of items) {
          if (!existingUrls.has(item.url)) {
            await base44.asServiceRole.entities.NewsItem.create({
              source_id: source.id,
              source_name: source.name,
              title: item.title,
              url: item.url,
              published_at: item.published_at,
              snippet: item.snippet?.substring(0, 200) || '',
              image_url: item.image_url || ''
            });
            newItemsCount++;
          }
        }
      } catch (error) {
        console.error(`Error fetching ${source.name}:`, error.message);
      }
    }

    // Clean up old items (older than 7 days)
    const oldItems = await base44.asServiceRole.entities.NewsItem.list('-created_date', 1000);
    const itemsToDelete = oldItems.filter(item => item.created_date < sevenDaysAgo);
    
    for (const item of itemsToDelete) {
      await base44.asServiceRole.entities.NewsItem.delete(item.id);
    }

    return Response.json({ 
      message: 'RSS feeds fetched successfully',
      newItems: newItemsCount,
      deletedItems: itemsToDelete.length,
      sources: sources.length
    });
  } catch (error) {
    console.error('RSS fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function parseRSSFeed(xmlText, source) {
  const items = [];
  
  // Simple XML parsing - extract items/entries
  const itemMatches = xmlText.matchAll(/<item[^>]*>(.*?)<\/item>/gs) || 
                      xmlText.matchAll(/<entry[^>]*>(.*?)<\/entry>/gs);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    
    // Extract title
    const titleMatch = itemXml.match(/<title[^>]*>(.*?)<\/title>/s);
    const title = titleMatch ? stripCDATA(titleMatch[1]).trim() : '';
    
    // Extract link
    const linkMatch = itemXml.match(/<link[^>]*>(.*?)<\/link>/s) || 
                      itemXml.match(/<link\s+href=["']([^"']+)["']/);
    const url = linkMatch ? stripCDATA(linkMatch[1]).trim() : '';
    
    // Extract description/summary
    const descMatch = itemXml.match(/<description[^>]*>(.*?)<\/description>/s) ||
                      itemXml.match(/<summary[^>]*>(.*?)<\/summary>/s);
    const snippet = descMatch ? stripHTML(stripCDATA(descMatch[1])).trim() : '';
    
    // Extract pubDate/published
    const dateMatch = itemXml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/s) ||
                      itemXml.match(/<published[^>]*>(.*?)<\/published>/s) ||
                      itemXml.match(/<dc:date[^>]*>(.*?)<\/dc:date>/s);
    const published_at = dateMatch ? new Date(stripCDATA(dateMatch[1]).trim()).toISOString() : new Date().toISOString();
    
    // Extract image (enclosure or media:content)
    const imgMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i) ||
                     itemXml.match(/<media:content[^>]*url=["']([^"']+)["']/i) ||
                     itemXml.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i);
    const image_url = imgMatch ? imgMatch[1] : '';
    
    if (title && url) {
      items.push({
        title,
        url,
        snippet,
        published_at,
        image_url
      });
    }
  }
  
  return items.slice(0, 20); // Limit to 20 items per source per fetch
}

function stripCDATA(text) {
  return text.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
}

function stripHTML(text) {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}