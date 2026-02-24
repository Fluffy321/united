import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MitzvahApp/1.0)' }
    });
    clearTimeout(tid);

    if (!res.ok) return Response.json({ error: `Fetch failed: ${res.status}` }, { status: 502 });

    const html = await res.text();

    // Extract OG image
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const image = ogImageMatch?.[1] || null;

    // Extract OG description
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
    const ogDesc = ogDescMatch?.[1] || null;

    // Extract article body — try common article containers
    let articleHtml = '';
    const bodyPatterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]+class=["'][^"']*(?:entry-content|post-content|article-body|article-content|content-body|td-post-content|the-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    ];
    for (const pat of bodyPatterns) {
      const m = html.match(pat);
      if (m?.[1]) { articleHtml = m[1]; break; }
    }

    // Strip scripts, styles, iframes, ads, nav
    articleHtml = articleHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<form[\s\S]*?<\/form>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/class=["'][^"']*["']/gi, '')
      .replace(/style=["'][^"']*["']/gi, '')
      .replace(/id=["'][^"']*["']/gi, '');

    // Fallback: strip all HTML and return plain text paragraphs
    let plainText = '';
    if (!articleHtml) {
      const stripped = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      plainText = stripped.slice(0, 4000);
    }

    return Response.json({ image, ogDesc, articleHtml: articleHtml || null, plainText: plainText || null });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});