# Equipment Presence / Combat Graphics

## Implemented

- Corrected the raster-loaded presentation path that skipped equipment-specific ground motifs. All 16 premium signatures now retain their identifying geometry with the existing production VFX atlas.
- Increased ground emission visibility while bounding premium seals to a 90px band and evolution emission to 104px. These seals do not represent attack ranges.
- Added silhouette-attached shoulder/side emission: at most two dominant signatures, or one during busy combat. Acquired evolutions take precedence; premium selections retain their separate ground motifs. No gameplay values are changed.
- Reduced motion keeps static identifying strokes without animated raster pulses. Busy combat lowers opacity and effect count.
- Added a directional hot core and four material fragments to confirmed premium/evolved impacts. Worker feedback, ordinary shots, reduced motion and busy combat retain their restrained paths.
- Replaced the visually dominant blue Tesla perimeter with green electrical field grading, six segmented range markers, and short electrical strokes. Its actual engine radius is unchanged.

## Verification

Typecheck and production build pass. Full suite: 1307 passed, 1 opt-in skipped. Regression checks cover state immutability, retained motifs with a loaded atlas, bounded draw counts, reduced motion, worker exclusions and balanced canvas save/restore.

Browser screenshots compare base, six-item premium, and five-evolution fixtures at 1440x900, 390x844 and 844x390. Nine cases produce nonblank, distinct character-region pixels without page errors. Fixtures deliberately inject visual loadouts and are not earned playthroughs. Screenshots reviewed for character readability and effect positioning. See `scripts/verify-survivors-mantle.mjs` and `artifacts/equipment-mantle/`.

## Remaining Art Scope

This is a combat/equipment presentation upgrade using existing finished raster assets, not a new character animation set or a full environment/monster repaint. Physical mobile GPU/FPS, motion comfort and Director visual acceptance remain open. No claim of final cinematic visual lock.
