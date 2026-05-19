export const TRUST_STATUS = {
  VERIFIED: 'verified',
  SOURCE_BACKED: 'source_backed',
  COMMUNITY_SUBMITTED: 'community_submitted',
  NEEDS_REVIEW: 'needs_review',
  UNVERIFIED: 'unverified',
};

export const ACTIVITY_KIND = {
  FEED_POST: 'feed_post',
  COMMUNITY_POST: 'community_post',
  MITZVAH_REQUEST: 'mitzvah_request',
  MARKETPLACE_LISTING: 'marketplace_listing',
  MAP_POST: 'map_post',
};

export const PRIVACY_LEVEL = {
  PUBLIC: 'public',
  COMMUNITY_ONLY: 'community_only',
  PRIVATE: 'private',
  ANONYMOUS_ENABLED: 'anonymous_enabled',
};

export function normalizeTrustMetadata(item = {}, fallback = {}) {
  const sourceUrl = item.source_url || item.sourceUrl || fallback.source_url || '';
  const sourceName = item.source_name || item.sourceName || item.source_label || item.verification || fallback.source_name || '';
  const status = item.trust_status
    || item.verification_status
    || (item.verified || item.is_verified ? TRUST_STATUS.VERIFIED : '')
    || (sourceUrl ? TRUST_STATUS.SOURCE_BACKED : '')
    || (item.needs_review ? TRUST_STATUS.NEEDS_REVIEW : '')
    || fallback.trust_status
    || TRUST_STATUS.UNVERIFIED;

  return {
    trust_status: status,
    verified: status === TRUST_STATUS.VERIFIED || status === TRUST_STATUS.SOURCE_BACKED || Boolean(item.verified || item.is_verified),
    last_verified_at: item.last_verified_at || item.last_verified || item.reviewed_at || fallback.last_verified_at || null,
    source_name: sourceName,
    source_url: sourceUrl,
    submitted_by: item.submitted_by || item.submitted_by_user_id || item.user_id || fallback.submitted_by || null,
    submitted_by_name: item.submitted_by_name || item.user_name || item.author_name || fallback.submitted_by_name || null,
    needs_review: Boolean(item.needs_review || status === TRUST_STATUS.NEEDS_REVIEW || item.status === 'pending'),
  };
}

export function trustLabel(item = {}) {
  const trust = normalizeTrustMetadata(item);
  if (trust.needs_review) return 'Needs review';
  if (trust.trust_status === TRUST_STATUS.VERIFIED) return 'Verified';
  if (trust.trust_status === TRUST_STATUS.SOURCE_BACKED) return 'Source-backed';
  if (trust.trust_status === TRUST_STATUS.COMMUNITY_SUBMITTED) return 'Community submitted';
  return 'Unverified';
}

export function normalizeUnifiedActivity(payload = {}, options = {}) {
  const kind = options.kind || payload.activity_kind || inferActivityKind(payload);
  const now = new Date().toISOString();
  const trust = normalizeTrustMetadata(payload, options.trust || {});
  const privacy = payload.privacy_level
    || payload.visibility
    || (payload.is_anonymous ? PRIVACY_LEVEL.ANONYMOUS_ENABLED : PRIVACY_LEVEL.PUBLIC);

  return {
    ...payload,
    activity_kind: kind,
    unified_kind: kind,
    canonical_type: payload.canonical_type || kind,
    type: payload.type || kind.replace('_post', '').replace('_listing', ''),
    body: payload.body || payload.content || payload.description || '',
    content: payload.content || payload.body || payload.description || '',
    privacy_level: privacy,
    visibility: payload.visibility || privacy,
    comments_count: payload.comments_count || 0,
    reactions_count: payload.reactions_count || payload.likes_count || 0,
    replies_enabled: payload.replies_enabled !== false,
    reactions_enabled: payload.reactions_enabled !== false,
    map_enabled: Boolean(payload.map_enabled || payload.post_to_map || payload.location_lat || payload.location_lng),
    created_date: payload.created_date || payload.created_at || now,
    updated_date: payload.updated_date || payload.updated_at || now,
    trust_status: trust.trust_status,
    verified: trust.verified,
    last_verified_at: trust.last_verified_at,
    source_name: trust.source_name,
    source_url: trust.source_url,
    submitted_by: trust.submitted_by,
    submitted_by_name: trust.submitted_by_name,
    needs_review: trust.needs_review,
  };
}

export function inferActivityKind(payload = {}) {
  if (payload.activity_kind) return payload.activity_kind;
  if (payload.marketplace_category || payload.price || payload.pickup_option) return ACTIVITY_KIND.MARKETPLACE_LISTING;
  if (payload.request_kind || payload.urgency || payload.needed_by) return ACTIVITY_KIND.MITZVAH_REQUEST;
  if (payload.location_lat || payload.location_lng || payload.post_to_map) return ACTIVITY_KIND.MAP_POST;
  if (payload.community_id) return ACTIVITY_KIND.COMMUNITY_POST;
  return ACTIVITY_KIND.FEED_POST;
}

export function retentionEvent(type, metadata = {}) {
  return {
    event_type: type,
    metadata,
    created_date: new Date().toISOString(),
  };
}
