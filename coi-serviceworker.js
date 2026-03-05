/**
 * coi-serviceworker — Cross-Origin Isolation via Service Worker
 *
 * Purpose: GitHub Pages cannot set HTTP headers. This service worker
 * intercepts all fetch responses and injects the two headers that
 * Godot 4 web exports require to use SharedArrayBuffer:
 *   - Cross-Origin-Opener-Policy: same-origin
 *   - Cross-Origin-Embedder-Policy: require-corp
 *
 * Security notes:
 *   - The SW only adds headers; it never modifies response bodies.
 *   - It never stores, caches, or logs request/response content.
 *   - It only operates on the same origin it was registered from.
 *   - Opaque responses (status 0) are passed through unchanged to
 *     avoid corrupting cross-origin no-cors fetches.
 *
 * Bug mitigations:
 *   - Infinite reload loop: guarded by sessionStorage flag set before
 *     reload and cleared after the SW controller is confirmed active.
 *   - Install/activate races: skipWaiting + claim used to ensure the
 *     SW takes control immediately without a second navigation.
 */

/* ── Service Worker context ─────────────────────────────────────────── */
if (typeof window === "undefined") {

  self.addEventListener("install", () => {
    // Take control immediately — no need to wait for old SW to die.
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    // Claim all open clients so we start intercepting right away.
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener("fetch", (event) => {
    const req = event.request;

    // Skip non-GET and opaque/preflight requests that cannot be cloned.
    if (req.method !== "GET") return;

    // Pass-through for cache-only requests in wrong mode (browser internal).
    if (req.cache === "only-if-cached" && req.mode !== "same-origin") return;

    event.respondWith(
      fetch(req)
        .then((response) => {
          // Opaque responses (cross-origin no-cors): pass through untouched.
          // Modifying them would corrupt the response and cause errors.
          if (!response || response.status === 0 || !response.ok && response.type === "opaque") {
            return response;
          }

          // Clone headers so we can safely mutate them.
          const headers = new Headers(response.headers);
          headers.set("Cross-Origin-Opener-Policy",   "same-origin");
          headers.set("Cross-Origin-Embedder-Policy",  "require-corp");

          return new Response(response.body, {
            status:     response.status,
            statusText: response.statusText,
            headers,
          });
        })
        .catch((err) => {
          // Surface the error so DevTools shows it rather than silently failing.
          console.error("[coi-serviceworker] fetch error:", err);
          // Re-throw so the browser handles it normally (offline page, etc).
          throw err;
        })
    );
  });

/* ── Main thread context ─────────────────────────────────────────────── */
} else {

  (async function registerCOI() {
    if (!("serviceWorker" in navigator)) {
      console.warn("[coi-serviceworker] Service Workers not supported. Godot audio/threads may not work.");
      return;
    }

    // ── Infinite-reload loop guard ────────────────────────────────────
    // If we already reloaded once in this tab session and still don't
    // have a controller, something is wrong — stop and warn rather than
    // looping forever.
    const RELOAD_FLAG = "coi-sw-reloaded";
    if (!navigator.serviceWorker.controller) {
      if (sessionStorage.getItem(RELOAD_FLAG)) {
        console.warn("[coi-serviceworker] Already reloaded once but SW controller is still absent. " +
          "The page will continue without cross-origin isolation. " +
          "Check that the browser supports Service Workers and is not in private mode.");
        sessionStorage.removeItem(RELOAD_FLAG);
        return;
      }
    } else {
      // We have a controller — clear any stale flag from a previous session.
      sessionStorage.removeItem(RELOAD_FLAG);
    }

    // ── Register ──────────────────────────────────────────────────────
    let registration;
    try {
      registration = await navigator.serviceWorker.register(
        // Register with the same path as this script so the scope covers
        // the entire directory (including wiki_export/).
        document.currentScript.src
      );
    } catch (err) {
      console.error("[coi-serviceworker] Registration failed:", err);
      return;
    }

    // ── Reload once if needed ─────────────────────────────────────────
    // If the page loaded before the SW was controlling it, we must
    // reload so that all fetches go through the SW and headers are set.
    if (!navigator.serviceWorker.controller) {
      sessionStorage.setItem(RELOAD_FLAG, "1");
      // Use location.replace so the reload is not added to history.
      location.replace(location.href);
    }
  })();

}
