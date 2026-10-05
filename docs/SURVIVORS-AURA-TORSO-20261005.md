# Aura Torso Attachment - 2026-10-05

- Silhouette aura now shares the actor/wearable torso transform: facing, lean, quantized gait offset, brace, and firing pose.
- World-direction movement drag is converted into mirrored body coordinates so left-facing effects do not trail in the wrong direction.
- Ground seals stay on the ground plane. Movement-dependent aura/protocol drag is enabled by actual sprite movement during play, not held movement input alone.
- Reduced-motion retains facing but removes the added torso motion. Existing idle flow, launch pulse, busy budgets, and final raster atlas remain unchanged.
- No new placeholder art, engine state mutation, combat radius, item stats, or audio changes.

## Verification

- Full suite: 1,334 passed, one intentionally skipped; typecheck and production build passed.
- Regression compares mantle transform calls with the shared wearable torso helper and verifies reduced-motion and unchanged game state.
- Browser checks passed at 1440x900, 390x844, and 844x390: actual raster mantle pixels changed with torso pose (10,193 values) and facing (11,043 values); repeated pose and reduced-motion comparisons were identical.
- Existing boss encounter, controls, score routing, aura, four boss raster, overflow, and page-error checks passed.
- Development entry loaded meaningful content without a Vite error overlay.

Controlled raster checks do not replace Director visual review of every character/loadout or long-session physical-device performance testing. Existing art reuse is not a new cinematic final-art lock.
