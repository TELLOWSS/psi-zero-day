# PSI: ZERO DAY — OMEGA/AIRA HD art v3 and runtime integration

**Release status: BLOCKED.** This branch now contains real selectable-skin code paths but an explicit fail-closed release artifact (`src/ui/omega-approved-release.ts`) keeps gameplay access disabled.

## Created art handoff
An eight-direction, high-detail silver-haired AIRA turnaround has been produced, preserving a recognizable amber-goggle, white-and-graphite tactical suit silhouette and magenta accents. From eight unique neutral source views, 160 **candidate** 384×512 transparent sprites were generated (8 headings × 20 frames), with 320 **candidate** front/rear occlusion sprites and 18 action/layer WebP atlas files.

**Not artist-approved 160 motion frames.** The 160 binary outputs exist and all have distinct hashes, but most poses are 2.5D warped derivatives of only eight neutral illustrations, with procedural weapon overlays. They are not 160 separately painted smooth combat frames. The masks are approximations and cannot be approved for correct backpack/arm/rifle occlusion. No individual frame has been certified for stance-foot lock or natural knee articulation.

- Download **full art pack**: `PSI_ZERO_DAY_OMEGA_160_FRAME_ART_REVIEW_V3.zip` (94.6MB, SHA256 `4e27434ec8ddbd5910effd848c8ece4d74b74c205cbc5965f5264f639f66476e`). This is a downloadable sandbox artifact, **not** an asset hosted on the game site.
- Download **small offline reviewer**: `PSI_ZERO_DAY_OMEGA_160_FRAME_PREVIEW_V3.zip` (15.0MB, SHA256 `d8bf0d0b2927db38a116af2a8f8b7bce51ab82c21a7c35888bb65b00df9a1c0a`).
- Individual PNG and atlas filenames are documented in the ZIP's `PROVENANCE_AND_QA.json` and `SHA256SUMS.txt`.
- The 8×20 offline Canvas art QA was tested with real Chromium HTML/asset interception at 1440×900, 390×844, 844×390. Direction, action, frame, front/back image toggles and reduced motion worked without exceptions or horizontal overflow.
- New source turnaround's NE view is independently illustrated rather than a mirrored NW crop; alpha overlap with mirrored NW ranges 0.648–0.658. This **does not prove** all future animated NE frames are unique authored drawings.

## GitHub branch integration
- `src/ui/omega-approved-release.ts` explicitly exports `null` art and `false` approval. This must only change after a real, reviewed **build** audit of the final image files, never from a browser query or local storage.
- `src/ui/omega-runtime-skin.ts` implements action-frame sampling, 8 direction headings, 74px sprite projection, bounded lazy image loading and a 3-layer compositing bridge (rear → actor → front). Fallback to the base character when art fails loading.
- `src/ui/PatrolSurvivorsGame.tsx` has a gated OMEGA equip control and draw path. Existing CharacterId, HP, weapons, stats, premium upgrades, projectiles and save structure are untouched. **The equip button remains disabled** as assets have not passed the release gate.
- `tests/omega-runtime-skin.test.ts` checks actual art approval defaults, action indices, image-loading fallback, cache cap, Canvas draw order.
- Source/manifest approvals are reviewed by `scripts/verify-omega-approved-frames.mjs`, including 160 sprites and 320 image masks, SHA256s and original NE/NW mirror analysis.

## Must-fix before activation
1. High-quality authored 6-frame locomotion with a genuine stance foot lock for all eight headings.
2. Full original shooting/dodging/hit/ultimate/finish animation that changes limb pose convincingly, not simply vector/shear deformation.
3. Properly layered approved PPE/radio/rifle/backpack occlusion data with correct wrist and muzzle sockets and precise alpha removal.
4. Reviewed 480 individual source files and signed QA manifest (art, gameplay, mobile devices, accessibility); run the production binary gate.
5. Verify final player movement, firing, performance, equipment, and local save continuity on at least four viewport sizes and real Android device.
6. Only after those release gates pass should PR #234 leave DRAFT, merge to main and redeploy Production.

This creates a usable art-handoff package and a guarded game integration, **not** a claim of a finished premium playable character.
