// Service worker registration + push subscription helpers.
//
// Everything here degrades silently to "feature unavailable" rather than
// throwing: an older phone without push support must still get a working app,
// not a broken one.

/** Register the service worker. No-op in dev, where it only adds confusion. */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("[Insyte] Service worker registration failed:", err);
    });
  });
}

export const pushSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/** True once this device is registered to receive push for the signed-in user. */
export async function isPushSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  return !!(await reg.pushManager.getSubscription());
}

// Web Push wants the VAPID public key as a Uint8Array, not the base64url the
// server hands out.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/**
 * Ask permission, subscribe, and hand the subscription to the server.
 * Returns null on success, or a message explaining why it didn't work.
 */
export async function subscribeToPush(
  vapidPublicKey: string,
  send: (sub: PushSubscriptionJSON) => Promise<string | null>
): Promise<string | null> {
  if (!pushSupported()) return "This browser doesn't support notifications.";
  if (!vapidPublicKey) return "Push notifications aren't configured on the server yet.";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "Notifications were blocked. Enable them in browser settings.";

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub = existing ?? await reg.pushManager.subscribe({
    userVisibleOnly: true, // required by browsers; silent push isn't allowed
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });

  return send(sub.toJSON());
}

/** Unsubscribe this device locally. */
export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  await sub?.unsubscribe();
}
