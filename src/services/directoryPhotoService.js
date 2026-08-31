import { supabase } from '@/api/supabaseClient';

const MAX_BATCH = 8;
const QUEUE_DELAY_MS = 50;
const VALID_STATUSES = new Set(['ready', 'empty', 'unavailable']);

let pendingRequests = [];
let queueTimer = null;

function fallback(listingId, status = 'unavailable') {
  return { listingId, status };
}

function normalizePhoto(listingId, photo) {
  if (!photo || photo.listingId !== listingId || !VALID_STATUSES.has(photo.status)) {
    return fallback(listingId);
  }
  if (photo.status === 'ready' && (!photo.imageUrl || !photo.sourceUrl)) {
    return fallback(listingId);
  }
  return {
    listingId,
    status: photo.status,
    ...(photo.status === 'ready' ? {
      imageUrl: photo.imageUrl,
      sourceUrl: photo.sourceUrl,
      sourceLabel: photo.sourceLabel || 'Google Places',
      ...(photo.authorName ? { authorName: photo.authorName } : {}),
      ...(photo.authorUri ? { authorUri: photo.authorUri } : {}),
    } : {}),
  };
}

function chunks(items, size) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => (
    items.slice(index * size, (index + 1) * size)
  ));
}

export async function fetchDirectoryPhotos(listingIds, { client = supabase } = {}) {
  const uniqueIds = [...new Set((listingIds || []).filter((id) => typeof id === 'string' && id))];
  if (!uniqueIds.length) return {};
  if (!client?.functions?.invoke) {
    return Object.fromEntries(uniqueIds.map((id) => [id, fallback(id)]));
  }

  const resolved = {};
  for (const batch of chunks(uniqueIds, MAX_BATCH)) {
    try {
      const { data, error } = await client.functions.invoke('directory-photos', {
        body: { listingIds: batch },
      });
      if (error || !Array.isArray(data?.photos)) throw error || new Error('Malformed photo response');
      const byId = new Map(data.photos.map((photo) => [photo?.listingId, photo]));
      batch.forEach((id) => { resolved[id] = normalizePhoto(id, byId.get(id) || fallback(id, 'empty')); });
    } catch {
      batch.forEach((id) => { resolved[id] = fallback(id); });
    }
  }
  return resolved;
}

async function flushPhotoQueue() {
  const requests = pendingRequests;
  pendingRequests = [];
  queueTimer = null;

  const byClient = new Map();
  requests.forEach((request) => {
    const group = byClient.get(request.client) || [];
    group.push(request);
    byClient.set(request.client, group);
  });

  await Promise.all([...byClient.entries()].map(async ([client, group]) => {
    const ids = [...new Set(group.map((request) => request.listingId))];
    const photos = await fetchDirectoryPhotos(ids, { client });
    group.forEach((request) => request.resolve(photos[request.listingId] || fallback(request.listingId)));
  }));
}

export function requestDirectoryPhoto(listingId, { client = supabase } = {}) {
  if (!listingId) return Promise.resolve(fallback('', 'empty'));
  return new Promise((resolve) => {
    pendingRequests.push({ listingId, client, resolve });
    if (!queueTimer) queueTimer = setTimeout(flushPhotoQueue, QUEUE_DELAY_MS);
  });
}

export function resetDirectoryPhotoQueueForTests() {
  if (queueTimer) clearTimeout(queueTimer);
  pendingRequests.forEach((request) => request.resolve(fallback(request.listingId)));
  pendingRequests = [];
  queueTimer = null;
}
