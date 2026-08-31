const AUTO_PUBLISH_LIMIT = 4;
const MAX_AUTO_PUBLISH_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function publishedTimestamp(item) {
  const timestamp = new Date(item?.source_published_at || '').getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function selectAutoPublishCandidates(items = [], now = new Date(), limit = AUTO_PUBLISH_LIMIT) {
  const nowTimestamp = now.getTime();
  const cutoff = nowTimestamp - MAX_AUTO_PUBLISH_AGE_MS;

  return items
    .filter((item) => {
      const timestamp = publishedTimestamp(item);
      return timestamp !== null && timestamp >= cutoff && timestamp <= nowTimestamp + 5 * 60 * 1000;
    })
    .sort((a, b) => publishedTimestamp(b) - publishedTimestamp(a))
    .slice(0, Math.max(0, limit));
}

function automaticCategory(item) {
  const category = String(item?.category || '').toLowerCase();
  const parser = String(item?.raw_payload?.parser || '').toLowerCase();
  const severity = String(item?.raw_payload?.severity || '').toLowerCase();
  const urgency = String(item?.raw_payload?.urgency || '').toLowerCase();
  const emergencyWeather = parser === 'nws-alerts'
    && (severity === 'severe' || severity === 'extreme' || urgency === 'immediate');

  if (emergencyWeather) {
    return { category: 'safety', postSubtype: 'alert', urgency: 'emergency' };
  }
  if (category.includes('event') || category.includes('calendar')) {
    return { category: 'events', postSubtype: 'local_event', urgency: null };
  }
  if (category.includes('kashrus') || category.includes('kosher') || category.includes('vaad')) {
    return { category: 'kosher_food', postSubtype: 'local_update', urgency: null };
  }
  return { category: 'local', postSubtype: 'local_update', urgency: null };
}

export function buildAutomatedPost(item, community, now = new Date()) {
  const classification = automaticCategory(item);
  const summary = String(item?.short_description || '').trim();
  const sourceName = String(item?.source_name || '').trim();
  const sourceUrl = String(item?.source_url || '').trim();
  const sourceCategory = String(item?.category || '').trim();
  const body = [
    summary,
    sourceCategory ? `Category: ${sourceCategory}` : '',
    sourceName ? `Source: ${sourceName}` : '',
    sourceUrl ? `Read original: ${sourceUrl}` : '',
  ].filter(Boolean).join('\n\n');

  return {
    user_id: null,
    author_user_id: null,
    community_id: community.id,
    title: String(item?.title || '').trim(),
    body,
    content: body,
    type: 'announcement',
    post_type: 'announcement',
    post_kind: 'local_update',
    post_subtype: classification.postSubtype,
    category: classification.category,
    urgency: classification.urgency,
    is_official: true,
    privacy_level: 'public',
    visibility: 'public',
    trust_status: 'verified_source',
    verified: true,
    last_verified_at: now.toISOString(),
    source_name: sourceName,
    source_url: sourceUrl,
    migrated_from: `local-update:${item.id}`,
    location_text: 'Five Towns',
    author_name: community.name || 'Five Towns',
    author_avatar_url: community.logo_url || null,
  };
}
