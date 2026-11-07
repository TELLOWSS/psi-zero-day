# OMEGA v0 eight-direction turnaround — production handoff

**Current artifact:** A 1536×1024, 4×2 generated turnaround, transparent RGBA source. Each figure is extracted into 384×512 PNG and WebP, and arranged into 3072×512 **8×1 directional reference atlas**, plus a turntable review GIF and QA report.

**Important:** The pack is a review deliverable supplied in the conversation, **not installed in this repository**. It is not a playable motion atlas and cannot be deployed to production by adding only its metadata.

## Consistency review
The current live RE:IGNITION heroine is the canonical character. Preserve the light silver-white ponytail and bangs, amber goggles, safety-identity yellow/gray/white jacket over dark fitted tactical suit, radio, gloves, pouch and boot position. Newly generated marketing posters elsewhere in the conversation are not approved source art.

Prototype includes E, SE, S, SW, W, NW, N and NE reference images. **NE is a temporary horizontal mirror of the NW candidate**: shoulder radio / belt / reflective stripes are not directionally authentic. A unique original rear-right render, correct left-right equipment asymmetry, proper hip/foot registration and final art-direction signoff are required.

## Frame production and workflow
- Re-render and approve unique NE; reconcile identity, field PPE and gear asymmetry across all 8 directions.
- Draw a true 8×6 contact-motion atlas (idle, pivot, four gait phases), body height and pelvis anchor consistent. Do not get a 6-frame gait by repeating a single pose or shifting the image.
- Draw 8-direction action atlases with wrist/hand weapon connections: attack, combo, dash, hit, knockdown, recovery, ultimate, victory, defeat.
- Supply indexed sockets for head/chest/back/belt/wrists/knees/feet and occlusion masks. Update `src/ui/survivors-directional-art.ts` and the authored layout. Verify `SurvivorsFittingPreview`, carried equipment, muzzle origins, shadow and head continuity.
- Preserve the existing `CharacterId` gameplay stats and hit boxes, wallet and progress until full tests. Do not mark playable based on unlock records alone.
- Run `node scripts/check-omega-operator-art.mjs --release`: it must be green **only after** every authentic gameplay art atlas and anchor file is installed. Current v0 prototype should fail, which is expected.
- Test 390×844, 844×390, 1024×768 and 1440×900; verify 8-direction turning, 3D camera mimic, feet and hair inertia, equipment overlap, device memory, reduced-motion, save/load and master unlock.
- When the full asset package is added to the branch, use GitHub CI + Preview READY before presenting a production-ready playable character.

## Traceability
See `content/art/omega-prototype-8dir-v0.json` for exact source-cell-to-engine-heading mapping. The generated chat ZIP contains `qa-report.json` and a local `omega-review-check.mjs` that validates dimensions and alpha and intentionally fails `--release`.

## 2026-11-08 / Eight-direction 6-phase motion study

A separate conversation download `PSI_ZERO_DAY_OMEGA_WALK_8x6_STUDY_20261108.zip` now contains:

- 48 transparent 384×512 phase images, each direction with six unique pixel-deformed poses
- A 3072×3072 8-column / 6-row reference PNG atlas and lossless WebP
- A 1536×1536 mobile reference atlas (lossless WebP, approximately 1.41 MB in file size and 9.44 MB RGBA texture memory rather than 37.75 MB)
- A looping eight-direction motion preview GIF, an offline HTML inspector and detailed QC JSON
- Reproducible local source script `build_omega_walk_prototype.py` in the ZIP

**This is motion research, not authored animation.** Six unique pixel states do not equal six artist-drawn gait frames; the stance-foot root, left/right knees, forearm/weapon occlusion and ground contact physics remain unverified. The NE view still mirrors another direction. Both full-resolution and optimized atlases remain outside the GitHub runtime assets.

`src/ui/omega-walk-atlas.ts` maps time + angle to one of the 48 reference cells and has a separate quarter-memory mobile mapping. Its frame coordinates can be tested without loading any imagery into the running game. It never grants an OMEGA CharacterId, new combat power or premium equipment, and marks the reference as unapproved.

### Gate conditions still blocking playable release

1. Re-render the unique NE rear-right illustration and approve the canonical face, suit and gear asymmetry.
2. Replace pixel deformation with truly authored upper/lower-body walking phases and reliable plant/swing anchors for all eight directions.
3. Supply attack/recoil, dodge, hit/knockdown, stand-up, ultimate and win/lose clips along with exact weapon, wrist and boot sockets.
4. Run actual game playthroughs with equipment, large crowds and camera; report measured mobile FPS/memory and reduced-motion cases.
5. Import signed-off art binaries into the proper production resources; validate with `node scripts/check-omega-operator-art.mjs --release` and full CI.
6. Keep PR #234 as a draft until all gates pass; do not deploy cosmetic prototypes as though they were a finished playable exclusive.

The published local SHA256 values are recorded in `content/art/omega-motion-study-v0.1.json` to distinguish the zip's art from any eventual reviewed release assets.
