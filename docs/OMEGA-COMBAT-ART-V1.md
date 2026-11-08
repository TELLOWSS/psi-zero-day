# AIRA · combat artwork authoring handoff v1 — 2026-11-08

Generated concept assets exist and were segmented into 24 **candidate** transparent images: six each for shooting, dash/slide, hit/recovery and the magenta-energy ultimate. An offline reviewer was built; the ZIP also contains a repeatable Python extraction script, review board, original source, per-frame PNGs, 4×6 WebP atlas, and five candidate equipment-part cutouts.

**GitHub does not contain the PNG/WebP binaries.** User-facing pack: `PSI_ZERO_DAY_OMEGA_COMBAT_CANDIDATES_V1.zip`, SHA256 `3f4e2a3cacb4d0f68ff1ca1d541ae76f03e2720e492ca5262dabfe5f0b070a96`. The pack is in the chat working directory, not a public asset URL. Source identity, sha, frame bounds, occlusion candidates and the detailed rejection are in `content/art/omega-combat-v1-review.json`.

## What has actually been built
- Two new generated AIRA character-art source references, one with character/weapon breakdown and one with combat-frame strips and VFX.
- Deterministic crop/alpha-matting research resulting in 24 individual PNG candidates and a 1152×768 (4 rows × 6 columns) RGBA atlas.
- A standalone no-network local HTML frame reviewer with four action buttons, speed, one-frame stepping, a background grid, provisional front/back depth markers and JSON review export.
- The existing **technical 8×6 gait direction reference** is retained separately; do not rebrand it as a 20-frame combat atlas.
- GitHub build contract `src/ui/omega-combat-art-contract.ts` checks full 8-direction × 20-frame authored art, three image digests for every frame (actor/front/back), no mirrored views, actual OMEGA achievements, dedicated QA approvals and independent binary audit.
- New `scripts/verify-omega-approved-frames.mjs` verifies all **160 actor images and 320 mask images** (480 binaries) before an artist-approved cosmetic can be imported.

## Blockers and sequence to playability
1. **Redraw** all directions to match the existing silver-haired, white/graphite-jacket main character. This candidate sheet shows black tactical armor and stylized pink accents; the same identity has not been artist-approved for in-game consistency.
2. Author all 8 headings with the 20 frame positions required by the current Signal Watch directional renderer (160 discrete reviewed frames). Six candidate poses in one direction are insufficient.
3. Hand-clean alpha and hair and create true per-frame front/back wearable masks. Generated part cutouts do not establish correct wrist/socket occlusion.
4. Map equipment sockets/muzzle origins, foot positions and collider offsets to the final approved sprites and run real 4-resolution/Android touch performance.
5. Package assets in `public/assets/omega/approved/`, lock true SHA256 for actor/front/back, obtain explicit artist, visual, combat and device QA approval, then run `node scripts/verify-omega-approved-frames.mjs --manifest content/art/omega-approved-release.json`.
6. Connect the accepted cosmetic as a skin without modifying underlying combat stats or existing saves. Only enable selectable UI if 50/50 normal + all 50 Master 3-star and binary verification pass.

The PR is deliberately DRAFT, as the actual gameplay actor images are not production ready. The release checker is a file/metadata quality gate, not a cryptographically secure anti-cheat proof of a user's local save data.
