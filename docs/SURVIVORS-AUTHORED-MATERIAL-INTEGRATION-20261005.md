# Authored command and material integration

## Implemented scope

The player and legacy jung alias now share an eight-pose tablet-command sheet in gameplay and fitting. At this initial integration, other characters kept their existing approved art and rig. The subsequent Kang/park and Lim command integration is recorded in [Character command animation follow-up](SURVIVORS-COMMAND-CAST-20261005.md); the remaining cast's bespoke sheets are not complete. The new neutral body also supplies the walking leg mesh, so attacks do not switch between two body designs.

The sheet is normalized once on load to 256px body height using the support-boot centroid. Each command composite retains the neutral face, PPE, hips and boots and replaces only the authored upper-body command region. The generated PNG itself is preserved unchanged. Body equipment uses that same canonical width, torso transform and active command occlusion layer. Player chest and belt sockets were recalibrated. Animation follows attack progress in simulation seconds; fitting uses its own isolated presentation clock. Reduced motion suppresses authored attack gestures.

Rapid mixed emissions retrigger recoil independently while the hand gesture completes its current cycle. An ultimate starts its own command cycle and cannot be interrupted by ordinary shots. Clock rollback resets the gesture consistently.

Optical effects now use `cinematic-vfx-v3.png`: textured ignition, ion mist, plasma, shield refraction, projectile trails, ground ripple, contact sparks, frost, electricity and recovery. Existing weapon tiers, equipment effects, impact receipts and evolution gates continue to own when they appear. Damage, radius, progression, shop prices and sound mechanics are unchanged.

Silhouette energy is sampled as moving strips of the raster material along a curved path, not detached moving stickers. Two signatures use sixteen strip draws total; crowded combat uses one signature and four strips. Stationary simulation time produces identical pixels and reduced motion retains static identity marks. The material flow stays body-local and does not imply an attack radius.

## Verification and quality gate

Browser verification checks eight distinct command composites with identical face/PPE and lower-body pixels, canonical body bounds, mirrored equipment sockets, moving material and contact fronts, pause and reduced motion. Fitting checks cover desktop, portrait and compact landscape. Screenshots and JSON reports are saved under `artifacts/authored-materials`, `artifacts/fitting-motion` and `artifacts/encounter-aura`.

The regression suite passed with 1,360 tests passed and one skipped; typecheck and production build passed. Focused tests also passed after the final cached feather-mask adjustment. Fitting passed all five viewports (1440x900, 390x844, 844x390, 667x375, 568x320), with no overflow, browser errors or storage mutation. Encounter checks passed desktop, portrait and landscape: arrival controls, core interlocks, secured handoff, four boss material renders, all nine character/alias tool attachments and soundtrack continuity without audio failures.

This is a concrete visual-production improvement, not a claim of final film-quality lock. The generated sheet still has registration variation outside the active command crop. The runtime stabilizes those differences, rather than approving them as authored art. Next art work is character-specific intermediate arm poses, directional sets and a full neutral/walk/command continuity review. Optical texture generation did not fully honor the requested generous cell gutters; source sampling is cell-bounded, and the actual combat screenshots remain the visual acceptance gate.
