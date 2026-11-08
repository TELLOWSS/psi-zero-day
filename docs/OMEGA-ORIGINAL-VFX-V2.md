# OMEGA / AIRA — original procedural combat VFX v2

**Production state: FRAME ART REVIEW, NOT A PLAYABLE SKIN.**

Four original independently generated effect types were built: muzzle flash, dash/evade arc, radial hit response, and Omega ultimate beam/rings. Each effect contains eight transparent 384×384 RGBA PNG frames (32 total). The pack also contains a 3072×1536 actor-independent 4×8 PNG/WebP atlas, looping GIF, a Korean offline frame viewer with FPS/frame/reduced-motion controls, desktop/mobile inline-browser QA evidence, source Python generator, and SHA256 manifests.

Archive: `PSI_ZERO_DAY_OMEGA_ORIGINAL_VFX_V2.zip` (SHA256: `909b9e94d676dc658a43c9a0d9eab01eb3b0b4d7310aab15b32e197d68595f44`).

The entire asset package is supplied as a **download in the current chat**. It is not uploaded into `public/assets` and should not be represented as live gameplay content. The standalone generated art is original, but its final in-game visual quality must still be approved with existing studio branding.

## Code integration added on draft PR #234

- `src/ui/omega-combat-vfx.ts` defines the 32-frame atlas, time-based frame sampler, weapon/chest/hip socket placement, reduced-motion opacity, and a guarded Canvas blit that refuses invalid dimensions.
- `tests/omega-combat-vfx.test.ts` checks all 32 unique atlas cell coordinates, correct muzzle/hit/ultimate anchors, stale-effect cancellation, reduced-motion behavior, and Canvas save/restore.
- The visual effect placement is future-usable by the existing stage preview bridge. It **does not change combat stats, projectile damage, character selection, or user inventory** and is not wired to the real Signal Watch shooter until the separately approved character atlas ships.
- `scripts/omega-art-mirror-audit.mjs` and its synthetic PNG tests additionally compare actual NE/NW alpha silhouettes and guard against falsely declaring a mirrored image independent.
- `scripts/verify-omega-approved-frames.mjs` now rejects empty actor or front/back equipment masks and blocks an unmistakably mirrored NE versus NW series based on actual pixel evidence. This is a structural gate, not a substitute for artistic or legal acceptance.

## QA evidence
The 32 PNGs have unique decoded image hashes. Effect alpha pixels cover 5.4% to 19.8% of each cell at alpha threshold 20, avoiding opaque background blocks. A headless Chromium **inline HTML/embedded WebP fixture** passed at 1280×900 and 390×844 with VFX switching, frame stepping, reduced motion, zero page errors and zero horizontal overflow. The direct file:/// URL could not be opened because the automated test environment blocked navigation; user local browser execution remains to be confirmed.

## Release-blocking art work
1. Draw and approve canonical AIRA's genuine **8 headings × 20 frames** at main-illustration fidelity (160 unique actor frames), not the 24 one-direction concept candidates or 48 prototype gait frames.
2. Supply true per-frame front/back equipment occlusion alpha masks and rifle/radio/boot sockets. The checker expects 320 separate masks and authenticated hashes.
3. Verify NE independent full-body art across the real authored frames, not just new vector joint guides.
4. Import approved image binaries into the repository, run build-time SHA and mirror QA plus four device/resolution game tests.
5. Only then connect a validated **cosmetic** to master achievements with unchanged save and combat balance.

Keep PR #234 **DRAFT** and production unchanged until the above release criteria pass.
