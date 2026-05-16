import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT    = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@junited.us';

const TYPE_TO_PREF: Record<string, string> = {
  new_message:          'messages',
  mitzvah_offer:        'mitzvah',
  mitzvah_accepted:     'mitzvah',
  verification_request: 'mitzvah',
  community_activity:   'community',
  comment_reply:        'replies',
  announcement:         'localBrief',
};

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { user_id, title, body, url, notification_type } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: 'user_id, title, and body are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check profile notification preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('notifications_enabled, notification_preferences')
      .eq('id', user_id)
      .single();

    if (!profile?.notifications_enabled) {
      return new Response(JSON.stringify({ sent: 0, reason: 'notifications_disabled' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (notification_type) {
      const prefKey = TYPE_TO_PREF[notification_type];
      if (prefKey && profile.notification_preferences?.[prefKey] === false) {
        return new Response(JSON.stringify({ sent: 0, reason: 'preference_off' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Load all push subscriptions for this user (service role bypasses RLS)
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth_key')
      .eq('user_id', user_id);

    if (subError || !subscriptions?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_subscriptions' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({ title, body, url: url ?? '/', notification_type });
    const staleIds: string[] = [];
    let sent = 0;

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth_key },
            },
            payload,
            { TTL: 86400 }
          );
          sent++;
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 410 || status === 404) {
            staleIds.push(sub.id);
          }
        }
      })
    );

    // Clean up expired/unsubscribed endpoints
    if (staleIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', staleIds);
    }

    return new Response(JSON.stringify({ sent, stale_removed: staleIds.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
