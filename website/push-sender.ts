import webpush from "web-push";

// Web Push, behind env vars in the same style as email-sender.ts. Without the
// VAPID keys this whole module is inert and the app is unaffected — push is an
// enhancement, never a requirement for the site to work.
//
// VAPID_PUBLIC_KEY is safe to expose (the browser needs it to subscribe).
// VAPID_PRIVATE_KEY must only ever live in Railway's env.
const PUBLIC_KEY = (process.env.VAPID_PUBLIC_KEY || "").trim();
const PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || "").trim();
const CONTACT = (process.env.VAPID_CONTACT || "mailto:insyte.startup@gmail.com").trim();

let configured = false;
if (PUBLIC_KEY && PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(CONTACT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
  } catch (err) {
    // Loud: a malformed key means every push silently vanishes otherwise.
    console.error("[Insyte] VAPID keys present but invalid — push disabled:", err);
  }
}

export function pushEnabled(): boolean {
  return configured;
}

export function pushPublicKey(): string {
  return configured ? PUBLIC_KEY : "";
}

export interface StoredSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

/**
 * Send to every device for one user.
 *
 * Returns the endpoints that are permanently dead (404/410 — browser uninstalled
 * or permission revoked) so the caller can prune them. Anything else is logged
 * and retried next time rather than dropped, since a transient 500 from a push
 * service shouldn't cost someone their subscription.
 */
export async function sendPush(subs: StoredSub[], payload: PushPayload): Promise<string[]> {
  if (!configured || subs.length === 0) return [];
  const body = JSON.stringify(payload);
  const dead: string[] = [];

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body
      );
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 404 || status === 410) {
        dead.push(s.endpoint);
      } else {
        console.error(`[Insyte] Push failed (${status || "no status"}):`, err?.body || err?.message || err);
      }
    }
  }));

  return dead;
}
