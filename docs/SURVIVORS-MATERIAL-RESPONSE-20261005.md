# Hazard Motion / Confirmed Hit Response

## Changes

- Cart suspension follows the existing distance-driven gait cycle, not wall time or input alone. Actual HP loss adds a bounded brief chassis brace.
- Ordinary gas clouds have a small simulation-clock pressure envelope. Solid gas boss hardware remains rigid; debris has a small HP-loss tilt around its elevated bottom anchor.
- Confirmed HP-loss response uses cached material-colored silhouettes, max opacity .28; no steady-frame pixel scanning, image filter or new sprite allocation. Metal is warm, concrete is aggregate-colored, gas is mint. Tint cache is bounded at 18 entries per image and held through weak image references.
- Existing industrial contact rendering returned before later projectile embellishments. Material contacts now directly add bounded directional fragments: ordinary/critical metal or concrete and restrained gas, omitted under busy combat or reduced motion.
- People remain excluded from industrial destruction materials. Reduced motion suppresses animated/tint responses; gameplay values are not owned by presentation.

## Recovery Bug Found During Verification

Projectile targeting/hit guards skipped every `spent` hazard, including designated crane/debris bosses whose UI calls that phase a control opportunity. Both guards now exempt designated bosses from that skip. Ordinary spent hazards remain ignored. Regression tests cover real projectile contact in both cases. No warning or damage-window shortening.

## Verification

Typecheck, full suite and production build pass. Full suite: 1312 passing, 1 opt-in skipped. Normal-input calibration: all 50 stages have a successful boss-ending route across 150 runs, 140 victories and 10 defeats; all terminate. Not human win-rate data.

Browser fixture checks use actual projectile collision events on cart/gas/debris across 1440x900, 390x844, 844x390: 9 cases with confirmed HP loss, matching material event identity, no page errors or horizontal overflow. Screenshots reviewed: `artifacts/material-response/`. Fixtures are not earned playthroughs. Existing 12 boss-phase render fixtures are also rerun after the engine guard fix.

Remaining: physical mobile FPS, motion comfort and Director acceptance. This is procedural animation on existing finished art, not a new frame-by-frame animation atlas.
