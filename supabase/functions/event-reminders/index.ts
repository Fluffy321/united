/**
 * event-reminders — morning push job for community events happening today.
 *
 * Runs from pg_cron with CRON_SECRET. For every published community event
 * dated today (ET), it notifies users with a going/maybe/interested RSVP:
 * - respects notifications_enabled and notification_preferences.events
 * - web push via the same VAPID setup as streak-at-risk
 * - in-app notification row, deduped so a cron retry can't double-send
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@junited.us';
const CRON_SECRET       = Deno.env.get('CRON_SECRET') ?? '';

const REMINDED_STATUSES = ['going', 'maybe', 'interested'];

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function isAuthorized(req: Request): boolean {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('x-internal-secret');
  return Boolean(CRON_SECRET && secret === CRON_SECRET);
}

function etDateKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function allowsEventReminder(profile: Record<string, unknown>): boolean {
  if (profile.notifications_enabled === false) return false;
  const prefs = (profile.notification_preferences ?? {}) as Record<string, unknown>;
  if (prefs.events === false) return false;
  return true;
}

function eventTimeLabel(event: Record<string, unknown>): string {
  const time = (event.event_time || event.start_time) as string | undefined;
  if (time) return ` at ${time}`;
  if (event.starts_at) {
    const dt = new Date(event.starts_at as string);
    if (!isNaN(dt.getTime())) {
      return ` at ${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}`;
    }
  }
  return ' today';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret, x-internal-secret',
      },
    });
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const today = etDateKey();

  // The events table carries both date columns (start_date/event_date) and a
  // starts_at timestamptz from different eras — treat an event as "today" if
  // any of them lands on today's ET date.
  const [byDate, byTimestamp] = await Promise.all([
    supabase
      .from('community_events')
      .select('id, community_id, title, event_time, start_time, starts_at, status')
      .eq('status', 'published')
      .or(`start_date.eq.${today},event_date.eq.${today}`),
    supabase
      .from('community_events')
      .select('id, community_id, title, event_time, start_time, starts_at, status')
      .eq('status', 'published')
      .gte('starts_at', `${today}T00:00:00-05:00`)
      .lt('starts_at', `${today}T23:59:59-05:00`),
  ]);

  if (byDate.error || byTimestamp.error) {
    return new Response(JSON.stringify({ error: (byDate.error || byTimestamp.error)!.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const eventsById = new Map<string, Record<string, unknown>>();
  for (const event of [...(byDate.data ?? []), ...(byTimestamp.data ?? [])]) {
    eventsById.set(event.id as string, event);
  }
  const events = [...eventsById.values()];
  if (events.length === 0) {
    return new Response(JSON.stringify({ events: 0, sent: 0, reason: 'no_events_today' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: rsvps, error: rsvpError } = await supabase
    .from('community_event_rsvps')
    .select('event_id, user_id, status')
    .in('event_id', [...eventsById.keys()])
    .in('status', REMINDED_STATUSES);

  if (rsvpError) {
    return new Response(JSON.stringify({ error: rsvpError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!rsvps || rsvps.length === 0) {
    return new Response(JSON.stringify({ events: events.length, sent: 0, reason: 'no_rsvps' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userIds = [...new Set(rsvps.map((row) => row.user_id).filter(Boolean))];

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, notifications_enabled, notification_preferences')
    .in('id', userIds);

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allowedIds = new Set((profiles ?? []).filter(allowsEventReminder).map((p) => p.id));

  // Dedupe: skip (user, event) pairs already reminded today (cron retry safety).
  const { data: existing } = await supabase
    .from('notifications')
    .select('user_id, data')
    .eq('type', 'event_reminder')
    .gte('created_at', `${today}T00:00:00-05:00`);
  const alreadySent = new Set(
    (existing ?? []).map((n) => `${n.user_id}:${(n.data as Record<string, unknown>)?.event_id ?? ''}`)
  );

  const reminders = rsvps.filter((rsvp) =>
    allowedIds.has(rsvp.user_id) && !alreadySent.has(`${rsvp.user_id}:${rsvp.event_id}`)
  );

  if (reminders.length === 0) {
    return new Response(JSON.stringify({ events: events.length, sent: 0, reason: 'all_reminded_or_opted_out' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth_key')
    .in('user_id', [...new Set(reminders.map((r) => r.user_id))]);

  const subsByUser = new Map<string, typeof subscriptions>();
  for (const sub of subscriptions ?? []) {
    const list = subsByUser.get(sub.user_id) ?? [];
    list.push(sub);
    subsByUser.set(sub.user_id, list);
  }

  const staleIds: string[] = [];
  let sent = 0;

  await Promise.allSettled(reminders.map(async (rsvp) => {
    const event = eventsById.get(rsvp.event_id)!;
    const payload = JSON.stringify({
      title: `Today: ${event.title}`,
      body: `You RSVP'd ${rsvp.status} — it's happening${eventTimeLabel(event)}.`,
      url: `/communities/${event.community_id}?tab=events`,
      notification_type: 'event_reminder',
    });
    for (const sub of subsByUser.get(rsvp.user_id) ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload,
          { TTL: 21600 }
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 410 || status === 404) staleIds.push(sub.id);
      }
    }
  }));

  if (staleIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', staleIds);
  }

  await supabase.from('notifications').insert(reminders.map((rsvp) => {
    const event = eventsById.get(rsvp.event_id)!;
    return {
      user_id: rsvp.user_id,
      type: 'event_reminder',
      title: `Today: ${event.title}`,
      body: `You RSVP'd ${rsvp.status} — it's happening${eventTimeLabel(event)}.`,
      link_url: `/communities/${event.community_id}?tab=events`,
      data: { event_id: rsvp.event_id, community_id: event.community_id, date: today },
    };
  }));

  return new Response(JSON.stringify({
    events: events.length,
    reminders: reminders.length,
    sent,
    stale_removed: staleIds.length,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
