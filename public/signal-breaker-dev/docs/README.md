# SIGNAL BREAKER — Independent development mode

**Branch prototype v0.4.0 (2026-10-10)**. A distinct arcade experience in the **오늘도 무사히 / PSI : ZERO DAY** universe. Development only — **do not present as released, tested on real devices, or production-locked**.

## Scope

- Standalone browser/PWA playable prototype: pulse splitting, net capture, collision/ricochet, adjustable reflector, magnetic field, chain score, stage gates, three training stages and one boss proof-of-concept.
- Works independently of the existing **SIGNAL WATCH** mode and the existing bonus **pinball**. **Do not replace or alter those modules.**
- the three original art references: the three concept sheets are included in `/art/`, while the game's current graphics are **procedural/temporary**. Production sprite/art asset integration remains a later task.
- UI viewport contracts: phone portrait (compact with landscape hint); phone landscape (priority arena); tablet (balanced HUD); desktop (wide HUD + side mission panel). A shared physics coordinate system is used on all devices.
- Auto initial profile defaults to **BALANCED** on coarse-pointer devices and **HIGH** on fine-pointer devices. Players may override with HIGH/BALANCED/LOW and reduced-motion controls.

## Run without Vercel

The static build is served under `public/signal-breaker-dev/` on this development branch. For local testing, use a static server and open `http://localhost:8765/`. It is a fully self-contained frontend, without authentication or backend service. HTTPS hosting permits the separate service worker to cache files after first load; PWA offline revisit requires a real browser test before a guarantee can be made.

From this folder: `python -m http.server 8765` (or any static server). For CI checks, run `node --test tests/*.cjs`.

## Quality gates before exposing in main navigation

1. **G1 gameplay**: play 3 stages + boss across keyboard, touch, and pointer input; consistent split mass, safe pause, local record recovery.
2. **G2 device**: real PC browser at 1920×1080 / 1366×768; tablet at 1024×768 / 1280×800; phone portrait 390×844, landscape 844×390. Target smooth input and zero obscured critical cues. These are *targets*, not verified devices.
3. **G3 audiovisual**: compare final launch → impact → breakup → recovery animation with SIGNAL WATCH reference quality. Current code does not reach that threshold.
4. **G4 integration**: review shared settings/save namespaces, run host regression tests, explicitly approve GameHub entry. No GameHub integration in this branch.

## Safety, originality, production restrictions

This is original construction-hazard signal fiction, not actual incident reenactment. Real workers are support/rescue targets, not enemies. The classic bubble-splitting idea alone is not a license to reuse another game's sprites, music, layout or overall expressive combination. Keep production-specific visual identity original and review IP rights before commercial release.

No Vercel API calls, no direct deployment, no production-branch changes requested for this phase. **Git-provider automatic preview builds are separately configured; pushing this branch cannot guarantee they do not trigger.**