# Ultimate source release presentation

## Implemented

Ultimate launch feedback previously lasted .10 seconds although its authored character gesture lasts .42 seconds and its shockwave projectile lasts 1.5 seconds. Ultimate launch feedback now follows the .42-second gesture, with local ignition, an expanding painted ground pressure front and a quiet material tail. This is post-activation presentation, not a new gameplay charge-up or delay.

The renderer reuses the approved `cinematic-vfx-v3.png` materials. Its source effect is limited to a 52px presentation radius and uses seven local stamps in normal combat, two when busy. It adds no fullscreen flash, blur, random particles, extra raster assets or collision area. Actual shockwave rings, damage, projectile lifetime, cutin, audio and character gestures remain unchanged. Worker receipts stay on their existing calm path. Reduced motion retains the existing reduced feedback rather than drawing the moving optical layers. Missing textures keep the previous renderer.

The existing bounded 64-effect pool owns its clock/lifetime. No additional timer or state pool was added; paused simulation time cannot advance the effect.

## Files / verification

- `src/ui/survivors-ultimate-release.ts`: bounded, deterministic release envelope and raster renderer.
- `src/ui/survivors-projectile-feedback.ts`: launch-duration specialization and renderer integration.
- `tests/survivors-ultimate-release.test.ts`: envelopes, draw budget, context restoration, pause geometry, reduced motion, missing atlas and pool expiry.
- `scripts/verify-survivors-ultimate-release.mjs`: browser pixel checks and local phase montages.

Full test suite: 1,368 passed, one skipped. Typecheck and production build passed. Browser renderer checks passed at 1440x900, 390x844 and 844x390 using the real raster: six distinct visible phase frames, exact paused pixels, visible busy detail, no moving raster in reduced mode, blank after expiry and identical output through the integrated feedback layer. This verifies the rendering path, not a newly recorded full ultimate activation/cutin gameplay flow. Local phase montages and JSON are in `artifacts/ultimate-release`.

## Director review / TODO

Review source brightness and readability underneath the existing ultimate cutin and expanding collision-bound shockwave during real combat. This is a restrained source-material improvement, not a claim of final film-quality lock. Directional character art and additional authored action sequences remain outstanding.
