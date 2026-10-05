# Boss Visual Direction - 2026-10-05

## Implemented

- Existing cinematic raster atlas distinguishes arrival, interlocked core, exposed core, and secured encounter states.
- Warning, charge, and falling trajectories suppress supplemental core decoration to preserve danger readability.
- Presentation retains one copied boss snapshot after neutralization. Existing boss art settles and fades during the secured interval; it cannot attack, receive damage, or grant rewards.
- Crane/debris elevation and cart facing are retained at the transition instead of snapping to an unrelated pose.
- Reduced-motion removes rotation, pulsing, and settling movement. Busy combat reduces supplementary effects.
- No new placeholder assets, gameplay rules, reward changes, or audio recordings were introduced.

## Verification

- Full suite: 1,327 passed, one intentionally skipped.
- Typecheck and production build passed after the final elevation/facing adjustment; four focused presentation tests passed.
- Browser checks passed at 1440x900, 390x844, and 844x390: arrival, core protection, secured transition, no horizontal overflow, no browser errors.
- All four existing boss-family raster images rendered nonblank, changed during the secured fade, and disappeared at its end.
- Aura animation changed between active frames and remained stable when paused or reduced-motion was enabled.

## Review Boundary

Controlled browser fixtures verify presentation transitions, not natural-play difficulty or sustained mobile frame rate. Existing raster reuse is not a new final-art delivery or cinematic production lock. Director review remains necessary for silhouette, visual hierarchy, and device performance in real play.
