/**
 * NameCardScan Progressive Web App service worker.
 *
 * Copied to dist/client as a reliable fallback for TanStack Start / Amplify
 * builds. vite-plugin-pwa (injectManifest → src/sw.ts) also emits sw.js when
 * its build hook runs; this file guarantees installability if that hook is skipped.
 *
 * - Precaches app shell + logos + offline OCR assets
 * - Stale-while-revalidate for static assets (JS/CSS/fonts/images)
 * - Network-first navigation with offline shell fallback
 * - Never intercepts API / auth network calls
 * - Auto-activates on deploy (skipWaiting + clients.claim) and drops old caches
 */

const CACHE_VERSION = "namecardscan-pwa-v1";
const PRECACHE = [
  "/",
  "/scan",
  "/contacts",
  "/queue",
  "/settings",
  "/events",
  "/manifest.webmanifest",
  "/favicon.png",
  "/logo.png",
  "/logo-mark.png",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
  "/paddleocr/models/PP-OCRv5_mobile_det_onnx_infer.tar",
  "/paddleocr/models/PP-OCRv5_mobile_rec_onnx_infer.tar",
  "/paddleocr/wasm/ort-wasm-simd-threaded.wasm",
  "/paddleocr/wasm/ort-wasm-simd-threaded.mjs",
  "/paddleocr/wasm/ort-wasm-simd-threaded.jsep.wasm",
  "/paddleocr/wasm/ort-wasm-simd-threaded.jsep.mjs",
];

const API_PREFIXES = [
  "/api/",
  "/health",
  "/contacts",
  "/integrations",
  "/admin",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response.ok) await cache.put(url, response);
          } catch {
            // Missing optional assets must not block install.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isApiRequest(pathname) {
  return API_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(prefix) ||
      pathname.startsWith(prefix.replace(/\/$/, "")),
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.startsWith("chrome-extension://")) return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (isApiRequest(requestUrl.pathname)) return;

  // HTML navigations: network first, fall back to cached app shell.
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(event.request, networkResponse.clone());
            cache.put("/", networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cached =
            (await caches.match(event.request)) ||
            (await caches.match("/")) ||
            (await caches.match("/scan"));
          if (cached) return cached;
          return new Response(
            "<!doctype html><title>Offline</title><h1>NameCardScan is offline</h1><p>Reconnect to sync queued contacts.</p>",
            {
              headers: { "Content-Type": "text/html; charset=utf-8" },
              status: 503,
            },
          );
        }
      })(),
    );
    return;
  }

  const isPaddleAsset = requestUrl.pathname.startsWith("/paddleocr/");
  const isStaticAsset =
    isPaddleAsset ||
    /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|map|webmanifest)$/i.test(
      requestUrl.pathname,
    ) ||
    requestUrl.pathname.startsWith("/assets/") ||
    requestUrl.pathname.startsWith("/icons/");

  if (!isStaticAsset) {
    event.respondWith(
      fetch(event.request)
        .then(async (networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) {
        if (!isPaddleAsset) {
          fetch(event.request)
            .then(async (networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const cache = await caches.open(CACHE_VERSION);
                cache.put(event.request, networkResponse);
              }
            })
            .catch(() => undefined);
        }
        return cached;
      }

      const networkResponse = await fetch(event.request);
      if (
        networkResponse &&
        networkResponse.status === 200 &&
        networkResponse.type === "basic"
      ) {
        const cache = await caches.open(CACHE_VERSION);
        cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    })(),
  );
});
