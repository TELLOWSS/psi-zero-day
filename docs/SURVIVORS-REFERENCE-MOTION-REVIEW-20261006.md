# Reference video motion review

Reference: user's local `KakaoTalk_20261006_113632815.mp4`, 23.57 seconds, 1920x1080, 30 fps. Reviewed contact sheets covering 0-14 and 15-22.5 seconds, plus 12 fps samples at 16-17 seconds. This is sampled visual analysis, not an audio review or a measurement of the source game's internal frame timing.

## Observations
- The clip includes a long module-selection interruption; combat is visible near the beginning and again around 14-22 seconds.
- At 16-17 seconds, the bright impact becomes rounded orange lobes and then darker residual material, rather than remaining a single expanding bright stamp.
- Travel trails, firing flashes and ground warnings have different shapes and roles. A camera filming a screen introduces moire and limits fine-detail assessment.
- Vehicle bodies retain a coherent direction and ground relationship while moving; the clip supports taking weight and settling as references, not claiming unseen joint-animation quality.

## Local implementation
- Material hit core decays quickly. Painted fragments have independent translation, rotation and gravity; vapor lifts while solid material falls. A separate slower tail persists after the core.
- Fragments are sampled from the existing approved industrial raster atlas, feathered into cached 128x128 textures on load. No newly generated sprite sheet, copied reference artwork or per-frame pixel/filter processing. This is layered animation of existing art, not full authored shape-morph animation.
- Maximum additional raster draws per owned hit: six normal critical / two busy. Existing 64-contact pool, local core ownership and per-weapon selection continue to bound overlap.
- Cart hit response settles through neutral; debris briefly braces around its pivot; pressure hardware has a small lateral/vertical deformation. Reduced motion disables these reactions. Engine movement, collision, HP, attack timing and safety treatment of people are unchanged.
- The first raw-crop trial showed rectangular vapor edges and was rejected. Cached radial feathering removes those boundaries; browser QA checks transparent corners.

## Acceptance boundary
Browser fixtures check three materials through five impact ages, three hazard bodies through brace/recovery, no changed collision state, no page exceptions, bounded busy draws and stable paused geometry. These do not prove parity with the reference game's animation.
Remaining: independently authored impact shape-changing frame sequences, fuller locomotion assets, sustained in-combat review and physical S26 Ultra frame pacing. No GitHub push or Vercel deployment.

## Verified result
- Full suite after the final rendering changes: 1,429 passed / 1 skipped; 263 files passed / 1 skipped.
- TypeScript and production build passed. Vite reports the shooting chunk slightly above the 500 kB warning threshold; not a build failure, but retained as a bundle optimization concern.
- Browser material timeline and hazard brace/recovery checks passed. Cached fragment corners are transparent; paused poses recover to identical pixels when compared on identically positioned isolated canvases. A first screen-position hash comparison was invalidated by position-dependent rasterization, so the fixture now uses identical local origins.
- Six-equipped actual-game regressions passed at 1440x900, 390x844, 844x390 without page errors or overflow. This is desktop browser viewport testing, not physical phone performance proof.
- Reviewed evidence: `artifacts/vfx-composition/contact-timeline.png`, `artifacts/vfx-composition/hazard-response.png`, `artifacts/vfx-composition/report.json`. Local preview remains at http://127.0.0.1:5196.

## Follow-up: staggered material playback
- Individual fragments now have different departure delays, rotation rates and trajectories. Solid fragments shrink as they fall; vapor curls and swells before dissipating. Every component retires at the original contact presentation deadline.
- Final regression: 1,430 tests passed, 1 skipped; build/typecheck passed. The >500 kB shooting bundle warning remains.
- Production renderers were recorded in a controlled three-hazard motion fixture on the actual Stage 1 floor: 327 sampled frames / 310 distinct frames; the intentionally paused interval produces exactly one pixel state. This verifies changing/paused animation, not a device FPS benchmark or full engine combat replay.
- Playback source: `scripts/verify-survivors-material-playback.mjs`; evidence `artifacts/material-playback/material-motion.webm`, `animation-review.jpg`, `report.json`.
- Recording initially triggered development hot reloads because artifact files are written under the workspace. The fixture replaces the Vite HMR client only in its browser session; production behavior is unchanged. The successful rerun had no page errors.
- Real shape-changing authored frames are still outstanding; reused material fragments are not presented as a newly completed sprite-animation sheet.
