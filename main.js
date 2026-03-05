/**
 * assets/main.js
 *
 * All interactive behaviour for index.html.
 * Kept in a separate file so index.html can enforce
 * script-src 'self' in its Content Security Policy
 * (inline scripts are forbidden under that directive).
 */

(function () {
  "use strict";

  /* ── Constants ──────────────────────────────────────────────────── */
  // How long (ms) to wait before assuming the game loaded,
  // in case the iframe load event doesn't fire as expected.
  const LOAD_TIMEOUT_MS = 20_000;

  // Path to the Godot HTML5 export entry point (same-origin, relative).
  // This is a compile-time constant — never accept this from user input.
  const WIKI_EXPORT_SRC = "wiki_export/index.html";

  /* ── Element references ─────────────────────────────────────────── */
  const frame         = document.getElementById("wiki-frame");
  const loader        = document.getElementById("loader");
  const loaderMessage = document.getElementById("loader-message");
  const errorPanel    = document.getElementById("error-panel");

  if (!frame || !loader) {
    console.error("[main] Required DOM elements not found.");
    return;
  }

  /* ── Helpers ────────────────────────────────────────────────────── */
  function revealFrame() {
    loader.setAttribute("aria-hidden", "true");
    loader.classList.add("hidden");
    frame.classList.add("loaded");
    frame.removeAttribute("aria-hidden");
  }

  function showError(message) {
    loader.setAttribute("aria-hidden", "true");
    loader.classList.add("hidden");
    if (errorPanel && loaderMessage) {
      // Use textContent (not innerHTML) — never interpolate untrusted data.
      loaderMessage.textContent = message;
      errorPanel.removeAttribute("hidden");
      errorPanel.removeAttribute("aria-hidden");
    }
  }

  /* ── Load detection ──────────────────────────────────────────────
   *
   * The iframe `load` event fires when the HTML document inside loads,
   * but it ALSO fires on 404 pages. We detect that case by checking
   * if the frame's contentDocument title matches Godot's export or
   * is a browser error page.
   *
   * We use a belt-and-suspenders approach:
   *   1. Listen for the `load` event.
   *   2. On load, try to read the inner document's title.
   *      - If accessible (same-origin) and looks like an error → show error.
   *      - If accessible and looks fine → reveal.
   *      - If inaccessible (cross-origin, shouldn't happen here) → reveal anyway.
   *   3. Safety timeout: reveal after LOAD_TIMEOUT_MS regardless.
   * ─────────────────────────────────────────────────────────────── */
  let revealed = false;

  function onFrameLoad() {
    if (revealed) return;

    try {
      const doc   = frame.contentDocument || frame.contentWindow?.document;
      const title = doc?.title ?? "";

      // Heuristic: browser 404/error pages often have no body content
      // or contain known error strings. Check for empty body as a proxy.
      const bodyText = doc?.body?.innerText?.trim() ?? "";
      if (bodyText === "" || bodyText.toLowerCase().includes("404")) {
        showError("Wiki export not found. Export the Godot wiki project to the wiki_export/ folder and push.");
        return;
      }
    } catch {
      // contentDocument inaccessible — cross-origin frame or strict
      // browser security. Treat as success and let Godot handle itself.
    }

    revealed = true;
    revealFrame();
  }

  frame.addEventListener("load", onFrameLoad);

  // Safety timeout — reveals the frame regardless so the user isn't
  // stuck on the loader if the load event misfires.
  const fallback = setTimeout(() => {
    if (!revealed) {
      revealed = true;
      revealFrame();
    }
  }, LOAD_TIMEOUT_MS);

  // If we reveal early via the load event, clear the timeout.
  frame.addEventListener("load", () => clearTimeout(fallback), { once: true });

  /* ── Set iframe src after registering listeners ───────────────────
   * Setting src in HTML would start loading before our JS listeners
   * are attached, potentially missing the load event on fast connections.
   * We set it here to guarantee the listener is in place first.
   * ─────────────────────────────────────────────────────────────── */
  frame.src = WIKI_EXPORT_SRC;

  /* ── Fullscreen button ───────────────────────────────────────────── */
  const fsButton = document.getElementById("fullscreen-btn");
  if (fsButton) {
    fsButton.addEventListener("click", () => {
      const target = frame.parentElement ?? frame;
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      } else {
        target.requestFullscreen({ navigationUI: "hide" }).catch((err) => {
          console.warn("[main] Fullscreen request failed:", err);
        });
      }
    });

    document.addEventListener("fullscreenchange", () => {
      const isFullscreen = !!document.fullscreenElement;
      fsButton.setAttribute("aria-pressed", String(isFullscreen));
      fsButton.title = isFullscreen ? "Exit fullscreen" : "Enter fullscreen";
    });
  }

})();
