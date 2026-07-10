/**
 * weekly-impact — Sunday-evening recap push for active mitzvah users.
 *
 * Runs from pg_cron with CRON_SECRET. For every user with at least one
 * mitzvah_log in the past 7 days it sends "your week of impact": mitzvot
 * logged, points total, and current streak. Skips users who opted out of
 * mitzvah notifications, and dedupes per ISO week so a retry can't
 * double-send.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@junited.us';
const CRON_SECRET       = Deno.env.get('CRON_SECRET') ?? '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function isAuthorized(req: Request): boolean {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('x-internal-secret');
  return Boolean(CRON_SECRET && secret === CRON_SECRET);
}

function allowsMitzvahNotifications(profile: Record<string, unknown>): boolean {
  if (profile.notifications_enabled === false) return false;
  const prefs = (profile.notification_preferences ?? {}) as Record<string, unknown>;
  if (prefs.mitzvah === false) return false;
  return true;
}

function isoWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
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

  const weekKey = isoWeekKey();
  const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const { data: logs, error: logsError } = await supabase
    .from('mitzvah_logs')
    .select('user_id')
    .gte('date', since);

  if (logsError) {
    return new Response(JSON.stringify({ error: logsError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const counts = new Map<string, number>();
  for (const log of logs ?? []) {
    if (log.user_id) counts.set(log.user_id, (counts.get(log.user_id) ?? 0) + 1);
  }
  const userIds = [...counts.keys()];
  if (userIds.length === 0) {
    return new Response(JSON.stringify({ users: 0, sent: 0, reason: 'no_weekly_activity' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const [{ data: profiles }, { data: streaks }, { data: points }, { data: existing }] = await Promise.all([
    supabase.from('profiles').select('id, notifications_enabled, notification_preferences').in('id', userIds),
    supabase.from('user_streaks').select('user_id, current_streak').in('user_id', userIds),
    supabase.from('mitzvah_points').select('user_id, total_points').in('user_id', userIds),
    supabase.from('notifications').select('user_id').eq('type', 'weekly_impact').contains('data', { week: weekKey }),
  ]);

  const allowed = new Set((profiles ?? []).filter(allowsMitzvahNotifications).map((p) => p.id));
  const alreadySent = new Set((existing ?? []).map((n) => n.user_id));
  const streakByUser = new Map((streaks ?? []).map((s) => [s.user_id, s.current_streak ?? 0]));
  const pointsByUser = new Map((points ?? []).map((p) => [p.user_id, p.total_points ?? 0]));

  const finalIds = userIds.filter((id) => allowed.has(id) && !alreadySent.has(id));
  if (finalIds.length === 0) {
    return new Response(JSON.stringify({ users: userIds.length, sent: 0, reason: 'all_sent_or_opted_out' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth_key')
    .in('user_id', finalIds);

  const subsByUser = new Map<string, NonNullable<typeof subscriptions>>();
  for (const sub of subscriptions ?? []) {
    const list = subsByUser.get(sub.user_id) ?? [];
    list.push(sub);
    subsByUser.set(sub.user_id, list);
  }

  const messageFor = (userId: string) => {
    const logged = counts.get(userId) ?? 0;
    const streak = streakByUser.get(userId) ?? 0;
    const total = pointsByUser.get(userId) ?? 0;
    const parts = [`${logged} mitzvah${logged === 1 ? '' : 's'} logged`];
    if (streak > 1) parts.push(`a ${streak}-day streak`);
    if (total > 0) parts.push(`${total} points`);
    return `This week: ${parts.join(', ')}. Keep it going!`;
  };

  const staleIds: string[] = [];
  let sent = 0;

  await Promise.allSettled(finalIds.map(async (userId) => {
    const payload = JSON.stringify({
      title: 'Your week of impact',
      body: messageFor(userId),
      url: '/MitzvahCircle?tab=mine',
      notification_type: 'weekly_impact',
    });
    for (const sub of subsByUser.get(userId) ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload,
          { TTL: 43200 }
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

  await supabase.from('notifications').insert(finalIds.map((userId) => ({
    user_id: userId,
    type: 'weekly_impact',
    title: 'Your week of impact',
    body: messageFor(userId),
    link_url: '/MitzvahCircle?tab=mine',
    data: { week: weekKey, logged: counts.get(userId) ?? 0 },
  })));

  return new Response(JSON.stringify({
    users: userIds.length,
    recapped: finalIds.length,
    sent,
    stale_removed: staleIds.length,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
