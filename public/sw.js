const CACHE_NAME = "chiutahara-portal-v2";
const APP_SHELL = ["/", "/emergency", "/downloads", "/community", "/faq"];
const OFFLINE_API_PATHS = new Set(["/api/community-updates", "/api/public-forms"]);
const STATIC_PATH_PREFIX = "/_next/static/";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);

    const shellDocuments = await Promise.all(APP_SHELL.map((path) => cache.match(path).then((response) => response?.text() || "")));
    const assetUrls = new Set();
    for (const html of shellDocuments) {
      for (const match of html.matchAll(/(?:src|href)=["']([^"']*\/_next\/static\/[^"']+)["']/g)) {
        const assetUrl = new URL(match[1], self.location.origin);
        if (assetUrl.origin === self.location.origin) assetUrls.add(assetUrl.href);
      }
    }

    await Promise.all(Array.from(assetUrls, async (assetUrl) => {
      const response = await fetch(assetUrl);
      if (response.ok) await cache.put(assetUrl, response);
    }));
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("chiutahara-portal-") && key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const isPublicFormDownload = /^\/api\/public-forms\/[a-f\d]{24}$/i.test(url.pathname) && !url.search;
  if (isPublicFormDownload) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const contentLength = Number(response.headers.get("Content-Length"));
        if (
          response.ok
          && response.headers.get("Content-Type")?.startsWith("application/pdf")
          && contentLength > 0
          && contentLength <= 5 * 1024 * 1024
        ) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      }).catch(async () => (
        await caches.match(event.request)
        || new Response("This form is not available offline. Open it once while online to save it for offline use.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      )),
    );
    return;
  }

  const isPublicAppShell = APP_SHELL.includes(url.pathname);
  const rscParamsAreSafe = url.searchParams.has("_rsc")
    && Array.from(url.searchParams.keys()).every((key) => key === "_rsc");
  if (isPublicAppShell && rscParamsAreSafe && event.request.headers.get("RSC") === "1") {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      }).catch(() => caches.match(event.request).then((response) => response || new Response("This page is not available offline.", { status: 503 }))),
    );
    return;
  }

  if (event.request.mode === "navigate") {
    if (!APP_SHELL.includes(url.pathname) || url.search) return;

    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      }).catch(async () => (
        await caches.match(event.request)
        || await caches.match(url.pathname)
        || new Response("This page is not available offline.", { status: 503 })
      )),
    );
    return;
  }

  if (OFFLINE_API_PATHS.has(url.pathname) && !url.search) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      }).catch(() => caches.match(event.request).then((response) => response || new Response(
        JSON.stringify({ message: "This public information is not available offline yet." }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      ))),
    );
    return;
  }

  if (url.pathname.startsWith(STATIC_PATH_PREFIX)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      })),
    );
  }
});