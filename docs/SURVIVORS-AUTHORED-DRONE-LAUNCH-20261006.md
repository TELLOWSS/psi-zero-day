# Inspection drone authored launch

Follow-up hunter-specific launch is recorded in SURVIVORS-AUTHORED-HUNTER-LAUNCH-20261006.md. The scope below records the earlier inspection-only implementation.

## Scope and selection
Original six-frame raster animation replaces inspection-wing drone_laser launch cores only. Ordinary drone, rescue wing, hunter beam, impact, worker/blocked receipt and reduced motion keep existing paths. Existing core ownership, launch lifetime .14 seconds and bounded feedback pool remain. No weapon damage, targeting, rate or audio changes.

Selected built-in source: `C:/Users/user/.codex/generated_images/01a1002a-207a-7242-a0aa-73c7b743c706/exec-c10fb8e8-5cf5-42f8-8088-4c64e69dd8e2.png`, copied unchanged to `public/assets/survivors/inspection-drone-launch-v1.png`. 1536x1024 RGBA, 1,459,671 bytes, approximately 6MiB decoded. Six 512px cells have different silhouettes: ignition, branching jet, detached plasma, broken curls, wisps, sparse flecks. Active alpha >32 stays >=32px from cell edges; corners transparent; last central energy below 20 percent of second frame.

Requested x80..432 margins and exact192256 registration were not fully achieved. Runtime registers first ignition at169259 and second core at208262; later fragments retain that second origin. Rendering rotates at the recorded engine direction, uses64 world-unit sheet extent, source-over composition, adjacent smoothstep frames normally and one nearest frame when busy. It replaces, not stacks on, the existing launch core. Raw last-frame fleck is still bright locally but low-area and runtime-faded; this is not a perfect match to every requested artistic invariant.

Edited source `exec-c69ad0f4-ecb5-40c7-89e7-2dab2e0886a4.png` rejected: alpha at cell corners up to88, active content touches edges. It is never loaded by runtime. No manual alpha removal or masking was used to bypass rejection.

## Emission alignment correction
Actual-game screenshot exposed a pre-existing mismatch: engine used a circular65/85 world-unit orbit, while presentation compressed Y by .55 and shifted the body up32. The visible drone and muzzle event could differ by over60 world units.

`src/domain/survivors-drone-origin.ts` now centralizes the existing engine orbit, used by both engine launch and UI body placement. Ordinary65 and evolved85 radii, three evolved phases and target calculations are unchanged. Body uses the authoritative emission point; shadow remains32 units below. The drone no longer visually emits from a separate compressed orbit. An already emitted effect remains world-anchored while the drone continues moving.

## Generation prompt
Use case: stylized-concept. Asset type: final candidate original PSI ZERO DAY inspection-drone muzzle animation spritesheet. Exactly1536x1024 RGBA transparent, regular3columns2rows, each cell512x512. Six chronological drawings left-to-right then next row. Drone fires RIGHT. Muzzle origin fixed local192256 every frame. No drone, ground, characters, UI, text, borders, labels, stars, circular magic glyphs, opaque background or rectangular glow. All painted content localx80..432,y100..412, at least80pixels fully transparent margin. Rich painterly compact top-down action-game VFX, cyan-white electric plasma with cobalt shadow edges and small amber metal sparks; shaded luminous material volume, not simple line art. Six genuinely evolving silhouettes: tiny ignition white knot with two cyan prongs; narrow branching tongue to right with core and amber flecks; tongue breaks into three disconnected curved fragments, core dimmer; no core, small separated curls pushed right; two ragged thin dim wisps and faint sparks; two faint fading flecks with empty center. Fixed origin/scale, distinct breakup, not repeated scaled/rotated stamp. Readable at56pixels gameplay width. Original artwork, not copied from another game.

## Rejected edit prompt
Edit only framing and emitter registration. Preserve six changing cyan plasma/amber drawings and true RGBA. Exact1536x1024 regular3x2 grid512square. Align left muzzle root in frames1/2/3 to192256, not forward tip. Preserve detached drift and empty emitter in4/5/6. Reduce extent20percent around muzzle so content including wisps stays x80..432,y100..412. No labels, borders, floor, drone, characters, rings or opaque rectangles. Last frame only faint flecks, no new bright star.

## Browser evidence
`scripts/verify-survivors-drone-launch.mjs` uses real production renderer for twelve direction/time samples per viewport and real engine-generated drone launches against a controlled stationary target. No fabricated launch receipt is inserted into actual gameplay. QA supplies six valid equipment categories and level5 drone, not an unmodified natural progression playthrough.

Artifacts: `artifacts/drone-launch/report.json`, three viewport timelines/preparation/launch PNGs, `inspection-launch-portrait.webm`. Timeline and portrait launch captures visually inspected. Browser fixture suppresses HMR while preserving CSS injection; earlier runs that accidentally suppressed styles are not final evidence. Normal command clicks are restored in the final fixture. S26 Ultra performance, long combat readability, other equipment-specific animation and authored alternating-foot gait remain outstanding.

## Final verification
Full suite: 1,449 passed, one skipped across270 files. Production build and explicit npm run typecheck passed. Existing shooting chunk warning remains (503.86kB minified). git diff --check passed with existing line-ending warnings.

Drone browser regression passed1440x900,390x844,844x390. Actual authored draw counts148/336/126; actual engine launch receipts9/19/7. All origins remain65units from player; no browser errors or horizontal overflow. Twelve controlled direction/time samples per viewport were nonblank. Existing premium visibility/material-contact browser regression passed all three viewports. These counts establish connection, not device FPS or long-play visual production lock.

Local server: http://127.0.0.1:5196. All changes local. No GitHub commit/push or Vercel deployment.
