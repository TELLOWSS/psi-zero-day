# Equipment identity and evolved combat presentation

## Implemented
- All 16 PSI equipment purchases use character-calibrated torso/dock coordinates, opaque sprite bounds, the same facing, gait, lean and recoil transform as the actor. Raster body gear remains layered with the original glove/tablet foreground.
- The rescue companion stays on its dock. Inspection flight remains driven by actual nearby hazards: dock, launch, inspect, return. There is no decorative idle item orbit.
- Each item has a distinct color/motif/mark signature, a compact ground seal and body-attached raster emission. Communication, timing, logistics, protection, companion and tactics share a bounded six-segment ground band.
- The five acquired evolutions have separate identity markers. A level-five weapon alone is not an evolution. Satellite/hunter flights add dual contours; confirmed evolved contacts add material-specific radial marks; acquired cryo/Tesla/EMF protocols have their own ground signatures.
- Evolved launches and critical confirmed contacts receive capped, decaying presentation recoil. Existing procedural equipment sounds gain a short transient and pressure layer; voice/alarm routing and supplied orchestral score assets are unchanged.
- Reduced motion removes camera recoil, animated raster glints and floor pulses, while retaining static identity. Crowded combat limits detail. No damage, range, spawn rate or simulation-time changes.
- Fitting uses the same attachment and seal renderers; framing includes feet and aura at all zoom values.

## Verification
- Automated coverage: all categories/character profiles, facing, dock stability, unique item signatures, five actual evolution flags, calm worker confirmation, finite/non-clipping PCM, bounded camera/light pools, state immutability and balanced canvas save/restore.
- Browser QA uses real raster assets and production renderers. Constructed loadouts/evolutions are explicit test fixtures, not naturally earned progress or physical-device FPS certification.

## Director review
- Inspiration: readable loot identity, rare-item silhouette and evolution milestones; no copied franchise artwork/audio or third-party IP assets.
- Existing generic atlas equipment is now fitted, not newly commissioned per-character final equipment artwork. Final cinematic art lock still requires visual approval of each item/character pose.
- Equipment contact sound remains procedural. Dedicated final recordings/foley and real headphones/mobile-speaker listening approval are separate gates; stronger transients do not imply orchestral final SFX quality.
