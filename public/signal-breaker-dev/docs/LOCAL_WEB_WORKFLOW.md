# SIGNAL BREAKER · Local web preview workflow (127.0.0.1:5199)

## Principle

Edit and validate via **local browser preview**, commit to the isolated `feature/signal-breaker-foundation-20261010` branch, and deploy to Vercel only after Director review and integration on `main`. A loopback preview is a browser-served site on the **same computer**; it is not a globally accessible website and the server stops when its process exits.

The repository's Vercel `vercel.json` currently contains:

```json
"git": { "deploymentEnabled": { "*": false, "main": true } }
```

Do **not** remove this protection. The connected Vercel project's build/deploy settings and any deploy hooks must still be checked if they change later. Merely creating a GitHub branch does not guarantee previews are disabled; this explicit configuration is what matters.

## Start on Windows (no download ZIP, no npm install)

1. Work in the GitHub repository checkout and switch to `feature/signal-breaker-foundation-20261010`.
2. Open `public/signal-breaker-dev/START_WEB_PREVIEW.cmd`, or run from the repository root:

   `node public/signal-breaker-dev/dev-preview.mjs`

3. Open `http://127.0.0.1:5199/` in Edge/Chrome. Saving HTML/CSS/JS in the preview folder causes an automatic refresh (Node file watcher). **No Vercel deploy occurs.**
4. Execute tests from this directory: `node --test tests/*.cjs`. The development branch has not been merged into `main`.
5. Stop the server with Ctrl+C. Closing the process stops the address. It does **not** change production.

The preview server uses only Node.js built-ins, is bound to `127.0.0.1`, and returns static local source files with `Cache-Control: no-store`. It does not receive external traffic by default.

## Cache caveat

PWA service workers are intentionally **not registered on HTTP localhost** so that production-style offline caches do not hide edits. If an older prototype already registered a service worker under this exact origin/port, clear it once in Edge/Chrome DevTools > Application > Service Workers > Unregister (then hard refresh). Production HTTPS hosting continues to be eligible for PWA registration.

## Device tests

PC browser: direct `127.0.0.1:5199`. For tablet/phone layout, browser device emulation can help but does **not** verify real-device touch latency or GPU performance. Real devices cannot use the PC's `127.0.0.1`; they need an explicitly permitted LAN/HTTPS test URL in a separate secure step. Keep the local service bound to loopback by default.

## Quality gates before release

- Mechanics: split / ricochet / magnet / net / pause / boss in all four prototype stages.
- Performance: PC, tablet, mobile aspect ratios, landscape/portrait, low and high settings; no critical indicators hidden.
- Regression: existing SIGNAL WATCH, bonus pinball, and save data remain unchanged.
- Integration: verify `main` at the intended base, implement menu entry only after approval, run full tests, review diffs, then allow **one intentional Vercel build**.