/**
 * streak-at-risk — evening push job for active mitzvah streaks.
 *
 * Runs from pg_cron with CRON_SECRET. It sends a web push only to users who:
 * - have an active user_streaks.current_streak
 * - have not completed today's streak goal in user_streaks
 * - have fewer than DAILY_GOAL mitzvah_logs dated today
 * - still allow mitzvah/daily reminder notifications
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY   = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY  = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT      = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@junited.us';
const CRON_SECRET        = Deno.env.get('CRON_SECRET') ?? '';
const DAILY_GOAL         = 2;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function isAuthorized(req: Request): boolean {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('x-internal-secret');
  return Boolean(CRON_SECRET && secret === CRON_SECRET);
}

function etDateKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function allowsMitzvahReminder(profile: Record<string, unknown>): boolean {
  if (profile.notifications_enabled === false) return false;

  const prefs = (profile.notification_preferences ?? {}) as Record<string, unknown>;
  if (prefs.mitzvah === false) return false;

  const settings = (profile.notification_settings ?? {}) as Record<string, unknown>;
  if (settings.mitzvahDailyReminders === false) return false;

  return true;
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
  const { data: streaks, error: streakError } = await supabase
    .from('user_streaks')
    .select('user_id, current_streak, last_activity_date')
    .gt('current_streak', 0)
    .lt('last_activity_date', today);

  if (streakError) {
    return new Response(JSON.stringify({ error: streakError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userIds = [...new Set((streaks ?? []).map((row) => row.user_id).filter(Boolean))];
  if (userIds.length === 0) {
    return new Response(JSON.stringify({ checked: 0, sent: 0, reason: 'no_active_streaks_at_risk' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: logs, error: logsError } = await supabase
    .from('mitzvah_logs')
    .select('user_id')
    .in('user_id', userIds)
    .eq('date', today);

  if (logsError) {
    return new Response(JSON.stringify({ error: logsError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const todayCounts = new Map<string, number>();
  for (const log of logs ?? []) {
    todayCounts.set(log.user_id, (todayCounts.get(log.user_id) ?? 0) + 1);
  }

  const atRiskIds = userIds.filter((userId) => (todayCounts.get(userId) ?? 0) < DAILY_GOAL);
  if (atRiskIds.length === 0) {
    return new Response(JSON.stringify({ checked: userIds.length, sent: 0, reason: 'all_streaks_safe' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, notifications_enabled, notification_preferences, notification_settings')
    .in('id', atRiskIds);

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allowedIds = new Set((profiles ?? []).filter(allowsMitzvahReminder).map((profile) => profile.id));
  const finalIds = atRiskIds.filter((userId) => allowedIds.has(userId));
  if (finalIds.length === 0) {
    return new Response(JSON.stringify({ checked: userIds.length, sent: 0, reason: 'preferences_off' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth_key')
    .in('user_id', finalIds);

  if (subError) {
    return new Response(JSON.stringify({ error: subError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = JSON.stringify({
    title: 'Keep your mitzvah streak alive',
    body: `Log ${DAILY_GOAL} mitzvot before the day ends so your streak stays alive.`,
    url: '/MitzvahCircle?tab=log',
    notification_type: 'streak_at_risk',
  });

  const staleIds: string[] = [];
  let sent = 0;

  await Promise.allSettled((subscriptions ?? []).map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth_key },
        },
        payload,
        { TTL: 21600 }
      );
      sent++;
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 410 || status === 404) staleIds.push(sub.id);
    }
  }));

  if (staleIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', staleIds);
  }

  await supabase.from('notifications').insert(finalIds.map((userId) => ({
    user_id: userId,
    type: 'streak_at_risk',
    title: 'Keep your mitzvah streak alive',
    body: `Log ${DAILY_GOAL} mitzvot before the day ends so your streak stays alive.`,
    link_url: '/MitzvahCircle?tab=log',
    data: { goal: DAILY_GOAL, date: today },
  })));

  return new Response(JSON.stringify({
    checked: userIds.length,
    at_risk: finalIds.length,
    sent,
    stale_removed: staleIds.length,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
