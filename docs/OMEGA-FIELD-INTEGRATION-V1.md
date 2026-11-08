# OMEGA / AIRA — Stage-space technical preview bridge (2026-11-08)

**STATUS: DEVELOPMENT-ONLY; NOT AN ACTUAL PLAYABLE CHARACTER.**

## What now works

The separate user-deliverable `PSI_ZERO_DAY_OMEGA_FIELD_RIG_LAB_V1.zip`
(SHA-256 `8e40cbf51a8ed3bcf8f9d338bd05c32b151a2626593dae03a217aa10e9c0ad70`)
contains a complete, no-API HTML/Canvas field laboratory with the original
8-direction × 6-pose vector research atlas, a mobile texture, frame-level
socket JSON, offline source, screenshots, and a repeatable browser QA script.

The stage screen supports eight heading buttons, WASD/arrow motion, pause,
frame stepping, desktop/mobile image switching, reduced motion, and independently
selectable foot, skeleton, equipment and muzzle-origin overlays. The scene is a
standalone original industrial 2D background; it is not a live Watch level.

Verified in headless Chromium through an inline-data playback fixture:
- all eight headings changed correctly;
- joint/socket and contact overlays rendered with no JS exceptions;
- manual frame advance, reduced motion, and both texture variants succeeded;
- keyboard steering changed the actor heading;
- at 390×844, horizontal overflow was 0 px.
These tests do NOT prove full-game quality or measured on-device performance.
A separate actual filesystem navigation was blocked by the test environment;
test fixtures ran using inline assets without network fetches.

## Runtime integration preparation

`src/ui/omega-stage-preview-bridge.ts` bridges `omegaFrameSocketGuide`
and `omegaMotionFrame` to the existing Canvas drawing coordinate convention:

1. The direction determines one of eight atlas columns.
2. The six-phase walk sample selects one atlas row (mobile 192×256,
   desktop 384×512).
3. A requested stage sprite height scales the 384×512 authoring space.
4. World ground location aligns with source Y=454, the technical planted-foot baseline.
5. All 16 guide sockets transform into the same world coordinate space;
   useful for later left-shoulder radio, wrists, weapon muzzle and boots.
6. `drawOmegaTechnicalPreview` has an explicit non-playable status check
   and validates source texture dimensions.

`tests/omega-stage-preview-bridge.test.ts` checks all 48 rectangles in
both profiles, source/destination/world-point projection, static reduced-motion
behavior, and mocked Canvas drawing.

## Blocking differences from the existing Watch renderer

The existing `src/ui/survivors-directional-art.ts` authored direction
layout requires **20 frames per heading**, not six. The technical study has
only six gait frames. Therefore it MUST NOT be mapped into the currently live
character table by repeating or falsely labeling rows as attacks.

Remaining required production steps:

- redrawn high-fidelity adult AIRA sheet matching current canonical hero artwork;
- unique professionally illustrated NE turn (the new **vector** NE is unique,
  the previous premium illustrated NE source is still mirrored);
- full 20-frame action/special coverage and authored equipment occlusion masks;
- physically grounded feet in the **world** (a source-cell baseline alone
  does not stop foot sliding while walking);
- art approval, source SHA lock, non-mirrored alpha QA, fit/gear/hitbox checks,
  real Android/mobile performance and accessibility playtests;
- only then connect the approved cosmetic to player choice; preserve
  storage compatibility and baseline combat stats.

**No main or production merge** is justified merely by the preview working.
The project must remain PR #234 DRAFT until asset and user-play release gates pass.

The user download also includes `omega-field-8direction-playback.gif` (24 true Chromium Canvas capture frames: eight headings × three sampled gait phases), and desktop/mobile screenshots. This is evidence of the debug renderer operating, not evidence of released combat animation.
