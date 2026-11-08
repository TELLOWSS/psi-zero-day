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

## 2026-11-08 / Measured image QA (48-frame v0.1)

A pixel-level QA utility is now present at `scripts/audit-omega-motion-study.mjs` and regression scenarios at `tests/omega-motion-audit.test.ts`. It decodes all 48 pixels cells with Sharp, verifies the grid, checks source SHA256, measures actual alpha-silhouette variation, flags mirrored NE-versus-NW, and enforces explicit provenance + production equipment-socket blockers.

Measurements on the original untouched 3072×3072 concept atlas (SHA256: `9fbac6535fe41ed572d942a3c6612289dc7cbb0544e8b640cb759cf237188b41`):
- 48 cells readable, alpha masks present, no exact adjacent duplicate frames;
- mean adjacent silhouette changes span **6.9%–9.62%** across eight compass headings; this metric is pixel variation, not biomechanical quality;
- the lower region's alpha-centroid horizontal span is **1.41–6.20 pixels**, not sufficient to verify believable heel-to-toe stance transfer;
- alpha-mask bottom boundaries drift by **0–1 pixel**, but that proves only image alignment, not contact-foot IK;
- NE compared to horizontally reversed NW: **99.52% maximum silhouette overlap**, **96.1% six-phase average**. This flags the documented mirror-source defect, even though phase-by-phase pixel warps reduce the aggregate similarity.

**Release result: FAIL by design.** The human-authored directional source, independent NE, genuine gait and motion/equipment rig still do not exist. A promotional collage generated while attempting an independent NE view was rejected as unsuitable source art; no new NE asset is claimed.

Example diagnostic command (only after downloading the separately supplied asset ZIP locally):
```bash
node scripts/audit-omega-motion-study.mjs \
  --atlas /path/to/omega-walk-MOTION-STUDY-8x6.png \
  --manifest content/art/omega-motion-study-v0.1.json \
  --report /path/to/omega-48frame-pixel-audit.json
```

`node scripts/check-omega-operator-art.mjs --release` now requires not only complete runtime image files, but also `content/art/omega-production-art-approval.json` containing artist-authored status, explicit approval and matching atlas SHA256, plus passing image mirror/phase/sockets checks. It remains blocked before a separately reviewed playable launch.

**No guarantee of anti-cheat:** This is a code and asset quality gate, not cryptographic attestation or a secure user account entitlement system.

## 2026-11-08 / Offline review lab v2 and numerical leg IK

The user-download `PSI_ZERO_DAY_OMEGA_MOTION_REVIEW_LAB_V2.zip` contains the actual 48-frame atlas, a lower-memory mobile atlas, self-contained HTML, metadata, a comparative review board, and Korean instructions. Its HTML source is versioned in `tools/omega-motion-review-v2.html`; the atlas binaries remain outside GitHub production assets. Release readiness remains **false**.

Available offline visual review actions: 8-direction selection, play/pause/step/FPS, onion-skin frame comparison, alpha-derived foot-position proxy markers, side-by-side NE versus flipped-NW inspection and local JSON review export. This is not a new player character. Real browser automation was blocked with `ERR_BLOCKED_BY_ADMINISTRATOR` both for file and loopback HTTP in this tooling environment; HTML/JavaScript syntax and artifact-structure checks did pass.

The image-derived foot-position marks are **not** a skeleton, actual foot joints or ground IK. To prepare real authored animation, `src/ui/omega-leg-ik.ts` now implements a mathematically constrained two-bone knee solution and alternating stance/swing foot targets. `tests/omega-leg-ik.test.ts` verifies limb-length conservation, unreachable-target clamping, contact/swing alternation, cyclic continuity and finite outputs. This is not connected to a runtime actor and must not be used as proof of natural knee deformation.

Independent rear-right (NE) source art was attempted again. The image generator returned a promotional collage, not the requested isolated full-body NE image. It was **rejected** from the asset pack. The mirror defect remains. No result from marketing key art or IK math has been substituted for a final 8-way character atlas.

**Next genuine art gate:** artist-approved NE view, six uniquely authored gait poses for each direction, pelvis/ankle/weapon sockets, pre/post-occlusion layers, live character selection with actual equipment/ranged-fire integration and 4-device gameplay acceptance testing.

## 2026-11-08 / Joint-anchor annotation lab v1 (next art handoff)

A downloadable offline artist-annotation package has been created and verified locally:
`PSI_ZERO_DAY_OMEGA_RIG_ANCHOR_LAB_V1.zip` (the atlas is **not** uploaded to runtime assets).

- `tools/omega-rig-annotation-lab.html`: standalone HTML with the existing quarter-size 1536×1536 reference atlas; no network or paid API.
- Every one of 48 source frames has independently editable guide points for head, chest, both hips, knees, feet, wrists and equipment. All initial anchors are explicitly **estimates**, not joint recognition.
- Drag points manually by mouse/touch; choose E/SE/S/SW/W/NW/N/NE, replay six phases, optionally inspect the preceding frame as a ghost.
- A two-bone knee IK suggestion acts on the user's specified hips and feet. It changes JSON guide coordinates **only**, not pixel art or the game's animator.
- Export all 48 frame records as a local JSON review, or import prior reviews. No account uploads or hidden storage.
- The GitHub test `tests/omega-rig-annotation-lab.test.ts` exercises controls, IK proposals, reset and export in a mocked DOM. Local Node smoke: PASS.
- Chromium headless UI screenshot test timed out in the current sandbox. An actual desktop/mobile browser session was **not** verified.
- **Release gate remains closed:** source NE is mirrored; gait art consists of pixel deformations, human-approved joint anchors and true walk/attack sprites do not exist, and no playable character is enabled.

This is the first usable manual artist review handoff. A future commit can consume approved reviewed JSON as **input data**, but only after all 48 frames have been calibrated and fully redrawn where needed.


## 2026-11-08 — Independent NE + redrawn 48-frame technical art

The work package \`PSI_ZERO_DAY_OMEGA_RIGGED_GAIT_NE_v1.zip\` includes freshly rendered 384×512 transparent original SVG-derived vector poses, not warped versions of prior PNG art. It contains E/SE/S/SW/W/NW/N/NE × six gait states, a full 3072×3072 RGBA atlas, WebP optimized atlas, individual PNGs, dedicated NE source, comparison board, an animated preview, editable Python generator, and the SHA-256/geometry verification report.

**Quality: ARTIST_APPROVAL_FALSE.** Although NE no longer borrows NW bitmap pixels within this *new vector technical mock-up*, the vectors are significantly simpler than the released key artwork. They are not production-level natural/anime illustrated poses; the old premium rendered NE still has the mirror defect, and this does **not** approve the canonical art replacement.

The pack's image QA reports 48 unique rendered PNGs; all 16 frame-level sockets remain in 384×512; planted feet have consistent screen-space floor Y; NE versus horizontally mirrored NW has alpha-mask overlaps of 0.66–0.704 (versus up to 0.9952 in the old pixel-deformed atlas). This measures technical independence, **not** naturalism or equipment clipping.

Code handoff: \`src/ui/omega-equipment-socket-guide.ts\` now independently recomputes all 48 guide positions from camera azimuth and gait phase. It exposes exact guide anchors for the physical left-shoulder radio, right-side muzzle origin, left/right foot contacts, knees, hips, wrists and torso, with \`avatarEnabled: false\` and explicit provisional provenance. \`tests/omega-equipment-socket-guide.test.ts\` verifies independent NE coordinates, all 48 poses, valid sockets, grounded phases, and non-playable status.

**Runtime asset binaries are not in the GitHub release tree.** Technical frames remain in the user-deliverable ZIP; do not substitute them for final artist-approved gameplay textures. The existing production release checks remain deliberately blocked.
