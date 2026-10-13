# Authored debris impact

## Scope
Replace confirmed FALLING_DEBRIS material hits in the existing beam/signal/arc paths with an original six-frame concrete break-up sequence. Metal keeps its own art; gas remains the previous independently animated material fragments. No player gait, equipment animation, combat damage, range, collision or sound changes in this step.

## Selected asset and review
Built-in image generation and two targeted framing edits were used. Selected source `exec-aa93e687-c45c-407e-ad53-6156a58b7a88.png`, copied unchanged to `public/assets/survivors/debris-impact-sequence-v1.png`.
Earlier sources `exec-e9561413-e9f0-4338-b1f4-95f6b08d805b.png` and `exec-bbe2c9df-e53b-4ee6-9513-d75a04542a8b.png` were rejected for insufficient cell margins. They are not referenced by runtime code. The second version failed the unchanged >=32px active-alpha safety test; the selected third version passed. The requested 96px margin in the final edit was not achieved exactly, so only the actually measured safety gate is claimed.

Six shapes: compact crush, broken concrete shell, separated angular fragments, tumbling shards, flattened ground dust, sparse settled residue. Ivory/gray material distinguishes it from amber metal sparks. Fragment identities are imperfect across frames; this is a selected candidate for one material, not a full cinematic quality lock.

Shared playback timing, smooth adjacent-frame blend and final fade come from the established authored impact sequencer. Asset-specific first/second core origins align to the hit; one primary core owner per local overlapping contact. Maximum two raster stamps normal, one busy. Worker/blocked/reduced-motion paths retain their semantics; legacy material rendering remains if the image has not decoded.

## Original generation prompt
Use case: stylized-concept. Original production PSI ZERO DAY stone debris impact animation spritesheet for a top-down 2.5D action game. EXACT 3 columns by 2 rows, 1536x1024, six 512x512 cells read left to right then next row. Genuinely transparent RGBA background. No labels, lines, ground, text, humans, weapons, flames or magical rings. Each impact origin precisely cell center 256,256. Entire active painted content inside 48px safe margins. Warm gray concrete chips with pale ivory dust and muted cool-gray shadows, crisp readable high-end painted game VFX. Six genuinely different successive shapes, not scaled duplicates. Frame1 a compact pale jagged crush flash at center with two tiny chips; frame2 concrete shell cracks apart into four fragments with a broad short jagged pressure plume; frame3 brightest break-up, six angular concrete fragments visibly separating and rotating plus discrete short opaque gray dust puffs; frame4 no bright core, same six shards farther outward and lower with clearly changed rotations and separated irregular dusty curls; frame5 only smaller falling chips and thin flattened dust spreading sideways along the ground, nothing at center; frame6 sparse soft fading ground dust and two tiny settled chips, no light at center. Dust must be broken into irregular puffs not a circular cloud. Keep continuity in fragment direction between frames. Fixed scale camera, fixed origin, distinct silhouettes, transparent gaps between fragments. Original art not copied from another game.

## Edit prompts
1. Preserve six chronological silhouettes, concrete material, neutral ivory dust and transparency. Keep 1536x1024 3x2 grid. Move origins to cell center and reduce extent to about 80%; every shard and dust puff at least48px inside the cell. No new content or repeated frames.
2. Preserve six distinct chronological silhouettes and concrete/dust. Keep output1536x1024 3x2. All artwork including faint dust inside the central320x320 square, local96..416. Shrink whole cell illustration to roughly65% about256256. No text, opaque backdrop, flames or added geometry. True RGBA transparency.

## Required verification
Full tests and build, unchanged metal regression, distinct frames/transparent borders/late core decay, three-material playback, actual-game collision-to-render probes on desktop and portrait/landscape mobile viewports. Physical S26 Ultra frame pacing and long unmodified gameplay remain outstanding.

Local only; no GitHub push or Vercel deployment.

## Verified results
- Full suite: 1,435 passed / 1 skipped, 266 files passed / 1 skipped. Build and both TypeScript configurations passed. The >500kB shooting chunk warning remains.
- Selected asset is 1,741,146 bytes, RGBA1536x1024; both metal and debris keep six distinct nonblank transparent cells, unchanged >=32px active-alpha border gate and a dim late center.
- Browser three-material contact timeline passed: gold metal, cool vapor, ivory concrete visually distinct, single primary core per overlapping phase retained. Reviewed raw art and timeline screenshots.
- Playback fixture: 330 rendered samples, 313 distinct pixel states, one paused pixel state. This is neither phone FPS proof nor an unmodified gameplay replay.
- Controlled actual-game engine collision probes at 1440x900 / 390x844 / 844x390 produced debris-atlas calls272 / 366 / 172 and metal-atlas calls274 / 366 / 172. All three had no page errors or overflow. Probe-only debris state is reset in the QA script; shipped engine logic is unchanged.
- Evidence: `artifacts/vfx-composition/contact-timeline.png`, `artifacts/material-playback/material-motion.webm`, `artifacts/premium-visibility/six-equipped-portrait.webm`, corresponding reports. Local preview http://127.0.0.1:5196.
