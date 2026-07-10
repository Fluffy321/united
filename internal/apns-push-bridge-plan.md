# APNs Push Bridge Plan (Capacitor iOS)

Written 2026-07-09 alongside the Capacitor init (master-plan item 17). Web push
(VAPID) does not work inside the iOS wrapper — WKWebView has no service-worker
push. This is the plan for bridging JUnited's existing push pipeline to APNs.

## Current pipeline (web)

- `push_subscriptions` table: `user_id, endpoint, p256dh, auth_key` (VAPID).
- Senders: `push-notify`, `streak-at-risk`, `event-reminders`, `weekly-impact`
  edge functions, all using `npm:web-push` with VAPID keys.
- Client subscribe flow lives in Settings (`pushSubscribed` toggle).

## Bridge design

1. **Schema**: add `platform text not null default 'web'` and `apns_token text`
   to `push_subscriptions` (or a sibling `native_push_tokens` table —
   prefer the column: one fan-out query, `unique (user_id, coalesce(endpoint, apns_token))`).
2. **Client (iOS build only)**: `@capacitor/push-notifications` plugin.
   On login + permission grant, `PushNotifications.register()` →
   `registration` event yields the APNs device token → upsert into
   `push_subscriptions` with `platform: 'ios'`. Gate on
   `Capacitor.isNativePlatform()` so the web path is untouched.
3. **Server**: a shared `sendToUser(userId, payload)` helper used by all four
   edge functions:
   - `platform='web'` rows → existing web-push/VAPID path.
   - `platform='ios'` rows → APNs HTTP/2 (`https://api.push.apple.com`) with a
     p8 token key (`APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY` secrets;
     JWT signed ES256 — Deno's crypto supports this natively, no dependency).
   - Same stale-token pruning: APNs 410/`Unregistered` → delete row.
4. **Payload mapping**: web payload `{title, body, url}` → APNs
   `{aps: {alert: {title, body}, sound: 'default'}, url}`; the Capacitor
   plugin's `pushNotificationActionPerformed` handler deep-links via the
   existing `getNotificationRoute()` helper.
5. **Apple-side setup (owner)**: Apple Developer account, App ID
   `us.junited.app` with Push capability, APNs auth key (.p8) generated and
   stored in Supabase secrets + vault.

## Order of work

1. Owner: Apple Developer enrollment + APNs key (blocker for everything below).
2. Migration: platform/apns_token columns.
3. Edge: shared sender helper + APNs path; switch the four functions to it.
4. Client: plugin install, register-on-login, deep-link handler.
5. Test on TestFlight build; verify streak-at-risk fires to a real device.

Everything except step 1 is code we can ship ahead of the Apple account; the
web path keeps working unchanged throughout.
