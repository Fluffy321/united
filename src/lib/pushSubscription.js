/**
 * Web Push subscription helpers.
 *
 * VAPID setup (one-time, per environment):
 *   1. Generate keys:  npx web-push generate-vapid-keys
 *   2. Add to .env.local:
 *        VITE_VAPID_PUBLIC_KEY=<publicKey>
 *   3. Set Supabase secrets:
 *        npx supabase secrets set VAPID_PUBLIC_KEY=<publicKey> VAPID_PRIVATE_KEY=<privateKey> VAPID_SUBJECT=mailto:admin@junited.us
 *   4. Add VITE_VAPID_PUBLIC_KEY to Vercel environment variables (Production + Preview).
 *
 * All functions are safe to call even if push is unsupported — they fail silently.
 */

import { supabase } from '@/api/supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function getSwRegistration() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

/** Returns the current Notification permission state, or 'unsupported'. */
export function pushPermissionState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

/** Returns true if the browser supports Web Push at all. */
export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** Checks whether a push subscription is currently active on this device. */
export async function isPushSubscribed() {
  const reg = await getSwRegistration();
  if (!reg) return false;
  try {
    return Boolean(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
}

/**
 * Prompt the user for notification permission.
 * Returns 'granted' | 'denied' | 'default' | 'unsupported' | 'error'.
 */
export async function requestPushPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'error';
  }
}

/**
 * Subscribe this device to push and store the subscription in Supabase.
 * Idempotent — safe to call if already subscribed.
 * Returns true on success, false on any failure.
 */
export async function subscribeToPush(userId) {
  if (!VAPID_PUBLIC_KEY || !userId || !supabase) return false;

  const reg = await getSwRegistration();
  if (!reg) return false;

  try {
    const existing = await reg.pushManager.getSubscription();
    const subscription =
      existing ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth_key: json.keys.auth,
      },
      { onConflict: 'user_id,endpoint' }
    );

    return !error;
  } catch {
    return false;
  }
}

/**
 * Unsubscribe this device and remove its endpoint from Supabase.
 */
export async function unsubscribeFromPush(userId) {
  const reg = await getSwRegistration();
  if (!reg || !userId || !supabase) return;

  try {
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return;

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', subscription.endpoint);

    await subscription.unsubscribe();
  } catch {
    // Unsubscribe errors are non-fatal
  }
}
