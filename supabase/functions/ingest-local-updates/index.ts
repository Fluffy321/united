import { createClient } from 'npm:@supabase/supabase-js@2';

type LocalUpdateSource = {
  id: string;
  community_id: string;
  name: string;
  source_type: 'rss' | 'api';
  source_url: string;
  category: string | null;
  auto_publish: boolean;
};

type ParsedUpdate = {
  external_key: string;
  source_url: string;
  title: string;
  source_published_at: string | null;
  short_description: string | null;
  category: string | null;
  raw_payload: Record<string, unknown>;
};

const JSON_HEADERS = {
  'content-type': 'application/json',
};

const REQUEST_HEADERS = {
  'accept': 'application/rss+xml, application/xml, application/atom+xml, application/json, text/xml;q=0.9, */*;q=0.8',
  'user-agent': 'JUnited Local Updates Bot/1.0 (official public source review queue)',
};

const JSON_REQUEST_HEADERS = {
  'accept': 'application/geo+json, application/json, */*;q=0.8',
  'user-agent': REQUEST_HEADERS['user-agent'],
};

const MAX_SOURCE_BYTES = 1_000_000;

function isSafePublicSourceUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local')) return false;
    if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(host)) return false;
    const match = host.match(/^172\.(\d+)\./);
    if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return false;
    if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) return false;
    return true;
  } catch {
    return false;
  }
}

async function readBoundedText(response: Response) {
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > MAX_SOURCE_BYTES) throw new Error('Source response exceeds the size limit');
  const reader = response.body?.getReader();
  if (!reader) return (await response.text()).slice(0, MAX_SOURCE_BYTES);
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_SOURCE_BYTES) {
      await reader.cancel();
      throw new Error('Source response exceeds the size limit');
    }
    chunks.push(value);
  }
  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function getSupabaseSecretKey() {
  const keys = getAllowedServerKeys();
  return keys[0] || '';
}

function getAllowedServerKeys() {
  const keys = [
    Deno.env.get('LOCAL_UPDATES_CRON_SECRET'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    Deno.env.get('SUPABASE_SECRET_KEY'),
  ].filter((value): value is string => Boolean(value));

  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      Object.values(parsed).forEach((value) => {
        if (typeof value === 'string' && value) keys.push(value);
      });
    } catch {
      // If Supabase changes the format, fall back to the other built-in keys.
    }
  }

  return [...new Set(keys)];
}

function getRequestServerToken(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  return (
    request.headers.get('x-cron-secret')?.trim()
    || request.headers.get('apikey')?.trim()
    || bearerToken
  );
}

async function isAuthorizedServerRequest(
  request: Request,
  allowedServerKeys: string[],
  supabase: ReturnType<typeof createClient>,
) {
  const requestServerToken = getRequestServerToken(request);
  if (!requestServerToken) return false;
  if (allowedServerKeys.includes(requestServerToken)) return true;

  const { data, error } = await supabase.rpc('verify_local_updates_cron_secret', {
    p_secret: requestServerToken,
  });
  if (error) return false;
  return data === true;
}

function decodeEntities(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function tagText(xml: string, tagName: string) {
  const match = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return decodeEntities(
    (match?.[1] || '')
      .replace(/<!\[CDATA\[/g, '')
      .replace(/\]\]>/g, '')
      .trim()
  );
}

function tagAttribute(xml: string, tagName: string, attributeName: string) {
  const match = xml.match(new RegExp(`<${tagName}[^>]*\\s${attributeName}=["']([^"']+)["'][^>]*>`, 'i'));
  return decodeEntities(match?.[1] || '');
}

function stripHtml(value = '') {
  return value
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

function normalizeDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function parseRssFeed(source: LocalUpdateSource, xml: string): Promise<ParsedUpdate[]> {
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  const entryMatches = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  const nodes = [...itemMatches, ...entryMatches].slice(0, 20);

  const updates = await Promise.all(nodes.map(async (node) => {
    const title = tagText(node, 'title');
    const rssLink = tagText(node, 'link');
    const atomLink = tagAttribute(node, 'link', 'href');
    const link = rssLink || atomLink || source.source_url;
    const guid = tagText(node, 'guid') || tagText(node, 'id');
    const published = normalizeDate(tagText(node, 'pubDate') || tagText(node, 'published') || tagText(node, 'updated'));
    const description = stripHtml(tagText(node, 'description') || tagText(node, 'summary') || tagText(node, 'content'));
    const fallbackKey = await sha256(`${source.id}:${title}:${link}:${published || ''}`);

    return {
      external_key: guid || link || fallbackKey,
      source_url: link,
      title: title || source.name,
      source_published_at: published,
      short_description: description || null,
      category: source.category,
      raw_payload: {
        parser: 'rss',
        title,
        link,
        guid,
        published,
      },
    };
  }));

  return updates.filter((item) => item.title && item.source_url);
}

async function parseNwsAlerts(source: LocalUpdateSource, payload: Record<string, unknown>): Promise<ParsedUpdate[]> {
  const features = Array.isArray(payload.features) ? payload.features.slice(0, 20) : [];

  return features.map((feature) => {
    const record = feature as Record<string, unknown>;
    const props = (record.properties || {}) as Record<string, unknown>;
    const id = String(record.id || props.id || props['@id'] || '');
    const event = String(props.event || 'Weather Alert');
    const area = String(props.areaDesc || 'Nassau County');
    const headline = String(props.headline || `${event} for ${area}`);
    const description = stripHtml(String(props.description || props.instruction || ''));
    const sent = normalizeDate(String(props.sent || props.effective || props.onset || ''));

    return {
      external_key: id || `${source.id}:${headline}:${sent || ''}`,
      source_url: String(props['@id'] || props.id || source.source_url),
      title: headline,
      source_published_at: sent,
      short_description: description || null,
      category: source.category || 'Weather Alerts',
      raw_payload: {
        parser: 'nws-alerts',
        id,
        event,
        area,
        severity: props.severity,
        certainty: props.certainty,
        urgency: props.urgency,
      },
    };
  }).filter((item) => item.title && item.source_url);
}

async function fetchSource(source: LocalUpdateSource) {
  if (!isSafePublicSourceUrl(source.source_url)) {
    throw new Error('Source URL must be a public HTTPS address');
  }
  const response = await fetch(source.source_url, {
    headers: source.source_type === 'api' ? JSON_REQUEST_HEADERS : REQUEST_HEADERS,
    redirect: 'error',
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  if (source.source_type === 'api') {
    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    if (contentType && !contentType.includes('json')) throw new Error('API source returned an unexpected content type');
    const json = JSON.parse(await readBoundedText(response));
    return parseNwsAlerts(source, json);
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() || '';
  if (contentType && !contentType.includes('xml') && !contentType.includes('rss') && !contentType.includes('atom')) {
    throw new Error('RSS source returned an unexpected content type');
  }
  const xml = await readBoundedText(response);
  return parseRssFeed(source, xml);
}

Deno.serve(async (request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseSecretKey = getSupabaseSecretKey();
  const allowedServerKeys = getAllowedServerKeys();

  if (!supabaseUrl || !supabaseSecretKey || allowedServerKeys.length === 0) {
    return new Response(JSON.stringify({
      error: 'Missing Supabase Edge Function environment variables.',
    }), { status: 500, headers: JSON_HEADERS });
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false },
  });

  const authorized = await isAuthorizedServerRequest(request, allowedServerKeys, supabase);
  if (!authorized) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
    }), { status: 401, headers: JSON_HEADERS });
  }

  const { data: sources, error: sourcesError } = await supabase
    .from('local_update_sources')
    .select('id, community_id, name, source_type, source_url, category, auto_publish')
    .eq('enabled', true)
    .order('created_at', { ascending: true });

  if (sourcesError) {
    return new Response(JSON.stringify({ error: sourcesError.message }), { status: 500, headers: JSON_HEADERS });
  }

  const summary = {
    sources_checked: 0,
    new_items_inserted: 0,
    duplicates_skipped: 0,
    errors: [] as Array<{ source_id: string; name: string; error: string }>,
  };

  for (const source of (sources || []) as LocalUpdateSource[]) {
    summary.sources_checked += 1;

    try {
      const parsedItems = await fetchSource(source);
      if (parsedItems.length > 0) {
        const rows = parsedItems.map((item) => ({
          source_id: source.id,
          community_id: source.community_id,
          external_key: item.external_key,
          source_url: item.source_url,
          title: item.title,
          source_name: source.name,
          source_published_at: item.source_published_at,
          short_description: item.short_description,
          category: item.category || source.category,
          raw_payload: item.raw_payload,
          status: source.auto_publish ? 'pending' : 'pending',
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('local_update_items')
          .upsert(rows, {
            onConflict: 'source_id,external_key',
            ignoreDuplicates: true,
          })
          .select('id');

        if (insertError) throw insertError;

        const insertedCount = inserted?.length || 0;
        summary.new_items_inserted += insertedCount;
        summary.duplicates_skipped += Math.max(0, rows.length - insertedCount);
      }

      await supabase
        .from('local_update_sources')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', source.id);
    } catch (error) {
      summary.errors.push({
        source_id: source.id,
        name: source.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return new Response(JSON.stringify(summary), { headers: JSON_HEADERS });
});
