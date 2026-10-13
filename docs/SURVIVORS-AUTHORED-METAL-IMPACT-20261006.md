# Authored metal-impact sequence

## Scope
Original six-frame shape-changing metal impact replaces the static whole-stamp contact for confirmed RUNAWAY_CART / CRANE_BOSS impacts in existing beam/signal/arc material paths. It is not a new animation for every weapon, gas, debris, player locomotion or equipment.

Built-in image generation produced `exec-0c1ad9fc-9bee-4c86-b730-ccde5a1e3be7.png`. Selected binary copied without editing to `public/assets/survivors/metal-impact-sequence-v1.png`. Real RGBA 1536x1024, 3x2 grid. No reference game's assets were copied.

## Runtime contract
- Six genuinely different silhouettes: ignition, branching flash, break-up, detached fragments, sparse chips, faint residual dust.
- Nonuniform normalized keys: 0 / .07 / .23 / .46 / .72 / 1. Adjacent frames smoothstep blend; final .18 of lifetime fades out.
- Per-frame emission-core origins align to the confirmed hit. World positions, HP, timing and collision are unchanged.
- Critical/normal authored extent: 104/76 world units; no fullscreen flash. At most two raster draws normal / one busy. Existing local-core ownership and pool bounds prevent bright-core stacking.
- Metal sequence replaces the old primary material core, fragments and tail rather than layering another explosion on top. The weapon-specific colored accent remains.
- Workers, blocked receipts, reduced motion and other materials retain their prior paths. Missing/undecoded authored asset uses the existing industrial rendering, not a new placeholder.

## Review
Inspected raw six-frame sheet: visible silhouette and brightness changes; core disappears toward the end, not the same stamp scaled six times. Alpha-based checks: six different frame hashes, nonblank frame areas, >=32px active-pixel cell margins, transparent corners and final core energy <20% of the branching-flash frame.
This is a selected runtime candidate for one material. It does not establish a project-wide cinematic visual lock or reference-game parity. Frame-to-frame shard identities are not perfect; authored intermediate cleanup and real combat readability review remain necessary.

## Generation prompt
Use case: stylized-concept. Production asset: original PSI ZERO DAY metal-impact animation spritesheet, top-down 2.5D action game. Make EXACTLY six chronological frames on a regular 3 columns x 2 rows grid, 1536x1024 canvas, each cell 512x512. True transparent RGBA background. No lettering, borders, ground, characters or weapons. All impacts originate at EXACT cell center (256,256), same camera and direction, expand toward upper right. Entire content stays 40px clear of each cell boundary. High-end readable hand-painted action RPG material effect, crisp faceted bronze steel fragments, short pale-yellow hot core, amber spark arcs and soft dark gray dust, not photoreal fire. Six frames MUST be genuinely different chronological shapes, NOT same pose scaled: 1 compact asymmetric ignition star very small with four sparks; 2 broad bright branching impact flower and three metal chips starting to separate; 3 peak break-up with curling amber lobes, core dimming, distinct five rotating steel shards flying outward; 4 fully separated shards at larger distances, collapsed amber core and disconnected gray dust puffs; 5 only scattered smaller tumbling chips and thinning separated dust wisps, no central explosion; 6 sparse faint gray dust and two tiny amber embers at farthest distances, no bright core. Track shard identities and outward directions across frames. Do not duplicate the frames. Transparent space between shapes; no opaque rectangular background or opaque white blob. Visible differences in fragment orientation and silhouette frame-to-frame. Original artwork only; do not copy any existing game's asset.

## Publishing
Local only. No GitHub or Vercel synchronization.

## Verification result
- Full suite: 1,433 passed, 1 skipped; 265 files passed, 1 skipped. Focused asset/frame tests rerun after the asset-test scan optimization: 3 passed.
- TypeScript and production build passed. The shooting bundle >500 kB warning remains; the new raw asset is 1,796,117 bytes, decoded RGBA about 6 MiB.
- Three-material contact timeline passed, with authored metal changing shape through the sampled ages. Three-hazard playback recorded 335 frames, 318 distinct pixel states, one paused pixel state; this controlled fixture is not a physical-device FPS benchmark.
- Actual game controlled-probe regression at 1440x900, 390x844 and 844x390: native engine projectile collisions produced new metal-atlas render calls (260 / 376 / 172), no page errors or overflow. Six equipped items remain visible. The test injects a harmless stationary cart and projectiles; it is not an unmodified player playthrough.
- Evidence: `artifacts/vfx-composition/contact-timeline.png`, `artifacts/material-playback/material-motion.webm`, `artifacts/premium-visibility/six-equipped-portrait.webm`, reports in those directories. Frame/contact alignment and alpha checked; cinematic parity not claimed.
