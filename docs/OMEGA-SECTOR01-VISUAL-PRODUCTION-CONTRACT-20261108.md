# OMEGA PROTOCOL — AIRA × SECTOR 01 Visual Production Contract

Date: 2026-11-08 / working branch `feat/omega-protocol-roguelite-core-20261108` / Draft PR #235.
Status: **DIRECTOR REFERENCE, NOT ART APPROVAL OR SHIPPABLE SPRITE SOURCE**.

## 0. Source-of-truth identity before illustration integration
The 2026-11-08 chat generated two reference boards: an AIRA concept dossier and a cinematic rainy construction-site gameplay *target*. These are presentation images, **not screenshots produced by the game's engine** and not 8×20 sprite-frame assets.

**Director change order (2026-11-09):** the user explicitly selected the NEW dark charcoal/purple high-ponytail AIRA with magenta streaks, amber goggles, graphite/white tactical suit and rose accents, superseding the legacy silver-haired title art. That design decision is approved for **identity and menu/candidate stage presentation**. It does NOT approve commercial 8×20 action sprites, 320 masks, mobile performance or a production release. The eight non-mirrored neutral direction cutouts in `public/assets/omega/aira-v2` are now imported into the actual OMEGA field renderer (fallback remains if an asset fails). See `content/art/omega-aira-v2-user-approved.json` for independently verified binary SHA-256 provenance.

Keep the silhouette and safety-operative identity original and respectful: no borrowed character models, franchise logos, licensed music, or temporary commercial-game sprites.

## 1. Visual style
- **Hero read at mobile landscape scale:** silhouette and body/weapon bearing first, then fine detail; no micro-text required for decision-making.
- **Color roles:** charcoal #121725, graphite #293746, silver #DCE5EC, safety amber #F4B45B, signal cyan #81E7E8, critical magenta #ED75C1. Saturated pink/cyan only on action-critical effects, not every prop.
- **Scene:** original construction-site access road after rain. Hierarchy: distant crane skyline → scaffolding and floodlight structures → native collision props → hero/enemies and projectiles → **boss warning zone must remain readable** → dust/grade → DOM UI/radar. Preserve signed-world XY geometry and 3/4 camera projection.
- **Performance:** independent low/medium/high tiers; scenery budget must degrade on mobile. No runtime third-party AI, paid API, live image fetch, or heavy filters required.
- **UX:** the mission label, movement pad, real HP, action and dash buttons must stay legible on 390×844 and 844×390. Avoid a fake level or boss HP in the concept storyboard.

## 2. AIRA 8-way production delivery (8 neutral cutouts present, 160 action frames NOT yet present)
Use **world-screen directional conventions of `omegaFieldHeading()`**:
E/right, SE/front-right, S/front, SW/front-left, W/left, NW/back-left, N/back, NE/back-right.
The reference concept sheet's arrows/N-front labels are illustration-only and do not set engine axes.

Each of 8 independently authored headings needs 20 384×512 RGBA transparent frames:
6 walk, 3 fire, 3 dash, 3 hurt, 3 ultimate, 2 finish = **160 total**.
Each has a unique authored rear equipment mask and front equipment mask (320 total); boot ground pivot at **y=454 ±2**, consistent alpha matte, weapon hardpoint, hair attachment direction, unique frame movement, no AI-interpolated near-static duplicates, and no mirrored leftward sprites. Use the action order in `src/ui/omega-protocol-art-slot.ts`. Distinct direction and damage state must be tested at game scale, not only shown on a character sheet.

Only if artist approval, real binary SHA-256 proof, 8×20 integrity, 320 masks, actual gait/impact evidence, the existing motion-review gate, four browser viewports **and Android device** pass should the build-pinned approved-art manifest be activated. Keep `OMEGA_PROTOCOL_APPROVED_ART=null` and `OMEGA_PROTOCOL_BINARY_AUDIT_PASSED=false` until then.

## 3. Sector 01 original scenery production
**Backdrop:** 2–3 original depth layers: distant cranes and building frames, midground safe working-platform mass, short foreground masking rail/prop fragments. These are presentation layers unless they correspond to `omegaFieldNativeTerrain()`; never add misleading solid structures.
**Lighting:** directional sodium work lights against cool cyan rim lighting, low wet-ground reflections and subtle non-obscuring air particles. Avoid expensive full-screen blurs and effect saturation on low-end devices.
**Existing implemented bridge:** `omega-protocol-sector-one-scene.ts` provides deterministic floor lighting/material passes under existing hazard and mission geometry; `omega-protocol-camera.ts` provides stage-aware zoom targets; `OmegaProtocolPlaytest.tsx` interpolates focus between combat, bosses, and mission traversal.
**Next required real art:** original high-resolution construction props with full silhouette/occlusion masks, terrain-aligned backgrounds for the world, and enemy/boss animation. The cinematic board's giant excavator is **not a wave-1 gameplay boss**; real major encounters remain in wave 9 and wave 15. A visualization must not override rules.

## 4. Quality gates and shipping
- `npm run typecheck` and deterministic OMEGA regressions must pass.
- Source-run Chromium snapshots for PC, 390×844 portrait, 844×390 landscape, objective, exit, wave-9 boss and wave-15 boss. Visual review must catch tiny actor, over-dark HUD, clipping, warning obscuration, stretched sprite, and camera snap.
- Genuine 15-stage hand-play is not emulated by developer teleport QA states. Check that stage 1 and stage 9/15 bosses work without soft-locks.
- Android native/real browser 30+ minute combat, thermal, p95 frame pacing, memory, and touch must be measured. Node CPU tests ≠ mobile GPU FPS.
- Keep public menu, existing SIGNAL GUARD / WATCH saves, premium economy, `main`, and Vercel Production unchanged until verified and approved.
