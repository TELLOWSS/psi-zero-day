# Signal Watch — STAGE 01 production candidate

Scope: presentation only, based on main `09040ba51642e6106509acc9be90baf08e49f74c`.
The September 24 master bible governs production discipline; its DefenseGame paths do not identify Signal Watch. This change targets PatrolSurvivorsGame only.

## Implementation

- Replace the existing STAGE 01 floor slot with a newly generated material pass. Preserve central walkway, slab joints, perimeter props and world coordinates. Retain v2 for rollback. Runtime v3 is 1564×1006 WebP; conversion uses the existing sharp dependency.
- Derive the player's cast shadow from the current authored directional frame. Project its alpha onto the floor before terrain, equipment, actors and warning overlays. Reuse the pose composite and a bounded per-actor mask; no per-frame pixel reads, blur filters or additional asset requests.
- Keep existing foot lock, contact mesh, eight directions and actor identity. No new animation sheets are claimed.
- Give STAGE 01 a restrained warm static actor fill matching the floor key. Preserve that static fill under reduced motion; combat pulses retain the existing flash setting. Smooth/low detail continues to omit ambient light and cast shadow.
- Reduce only STAGE 01's inspection beam opacity to preserve concrete readability. Other 49 stage light profiles remain untouched.
- The shared actor runtime bundle and release hash manifest must be regenerated because this source module also participates in the existing shared build.

No engine, save schema, unlock, growth, reward, spawn, damage, collision, camera or HUD behavior changes.

## Image provenance

Built-in ImageGen edit of the project's existing `stage-01-ground-v2.webp`, October 18, 2026. No downloaded reference-game art was incorporated. Existing source art's provenance remains subject to its existing project records.

Final prompt:

> Use case: lighting-weather / precise-object-edit. Asset type: FINAL gameplay floor texture for original construction safety game SIGNAL WATCH, not a screenshot or concept board. Edit the supplied floor ONLY. Preserve exact overhead orthographic camera, rectangular canvas aspect ratio, exact location/width of the central vertical green walkway, all concrete slab joints, border drains, stacked timber/rebar and lamp fixture positions. Keep every traversable part free of objects. Upgrade material rendering to refined physically plausible game environment art: detailed tactile gray concrete aggregate and rubbed surface, restrained natural stains and tire wear, crisply rendered rebar and timber stacks, subtle warm practical lamp pools from the existing perimeter lamps, cool neutral ambient fill. Upper-left key light, shallow coherent shadows to lower-right. Bright enough for mobile hazard readability, quieter medium-frequency texture through the central combat space; perimeter has the richer detail. Preserve all existing geometry and gameplay coordinates, no new props/characters/obstacles, no perspective shift, no text, no logos, no UI, no icons, no arrows. Full-bleed floor image only. Maintain existing green painted central walkway, do not turn it into a road. The image is a replacement of the same texture slot, not a new map. Output landscape matching reference ratio.

## Verification and review gate

`tests/verify-survivors-stage01-visual.mjs` records matched before/after paused scenes at 1440×900, 390×844, 844×390 and 1024×768, with and without reduced motion. Fixed seed and player position/time; the test deliberately removes moving hazards/projectiles for comparison, so these captures do not establish crowded combat performance. This is a production candidate, not a Production Visual Lock.

Record actual test results and screenshots alongside this document before review. Remaining gates: live crowd performance, Android device input/thermal behavior, art-direction approval, STAGE 03 occlusion and STAGE 05 equipment lighting. STAGE 01 review precedes any 50-stage rollout.

The generated floor improves material rendering but remains an overhead floor. Multi-layer foreground/midground/background assets and new character animation production are not implemented by this candidate.

## Executed results

- `npm test`: 392 files passed, 1 skipped; 2,300 tests passed, 1 skipped.
- `npm run typecheck`: passed. `npm run build`: passed including prebuild contracts (existing large-chunk notice remains).
- Before/after browser matrix: 16 captures, zero page exceptions or horizontal overflow; contact leg stretch 1.0; new raster and live-pose shadow present in all 8 candidate cases, including reduced motion.
- Synthetic crowd smoke: 390×844 and 844×390, 65 forced hazards, six level-5 equipment perks, 24 peak projectiles. Playing phase maintained; one-second right input moved the character; no page exceptions. This is not a natural progression/balance test or an Android FPS measurement.
- Evidence: [reports and representative captures](qa/signal-watch-stage01-20261018/).

Awaiting Director visual review. No Production Visual Lock or production-main merge is asserted.
