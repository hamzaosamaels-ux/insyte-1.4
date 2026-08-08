// Insyte service worker — offline support + push notifications.
//
// Caching here is deliberately conservative. The classic PWA failure is an
// over-eager cache pinning users to an old build with no way out, which in this
// project would look exactly like the silent bugs that have already cost us
// data. So:
//   - /api/*      never cached. Stale class data is worse than an honest error.
//   - navigation  network first, cache only as an offline fallback.
//   - /assets/*   cache first, but ONLY because Vite content-hashes those
//                 filenames — a new build produces new names, so a cached file
//                 can never shadow a newer one.
const VERSION = "insyte-v1";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

// Enough to render the app shell offline; everything else is fetched live.
const SHELL_URLS = ["/", "/index.html", "/manifest.webmanifest", "/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

// Drop caches from older versions, then take over open tabs immediately so a
// deploy doesn't leave people on the previous worker until every tab closes.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let the API/CDN handle theirs
  if (url.pathname.startsWith("/api/")) return;    // never serve stale app data

  // Hashed build output: safe to serve from cache first, filename changes on deploy.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(ASSETS).then((c) => c.put(request, copy));
        }
        return res;
      }))
    );
    return;
  }

  // Pages: always try the network so a new deploy is picked up straight away,
  // and fall back to the cached shell only when genuinely offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put("/index.html", copy));
          return res;
        })
        .catch(() => caches.match("/index.html").then((hit) => hit || Response.error()))
    );
  }
});

// ---- Push ----------------------------------------------------------------
// The server sends the same title/body it already stores as an in-app
// notification, so the two channels can't drift apart.
self.addEventListener("push", (event) => {
  let payload = { title: "Insyte", body: "You have a new notification.", url: "/" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // A malformed payload should still notify rather than fail silently.
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      // The recipient's own character when the server sends one, so the
      // notification reads as someone from the Insyte world, not a system
      // alert. badge stays the app logo regardless — that's the small
      // monochrome status-bar mark, meant to identify the app, not the sender.
      icon: payload.icon || "/logo-192.png",
      badge: "/logo-192.png",
      data: { url: payload.url },
      tag: payload.tag || undefined
    })
  );
});

// Focus an existing tab if one is open rather than piling up new ones.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
