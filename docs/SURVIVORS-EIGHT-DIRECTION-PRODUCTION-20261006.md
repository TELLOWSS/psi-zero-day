# Eight-Direction Production Requirements

Status: Director-authorized player walking candidate cleaned and integrated; NOT visually locked. Other actors and authored directional idle/command/ultimate remain pending.

## First Generated Candidate Review

The reference-based 8x8 walking candidate was generated and retained locally at `artifacts/eight-direction/player-walk-candidate-v1.png`. It was NOT added to the runtime or counted as final source art.

Visual review rejected immediate integration: ground shadows/background residue are visible, some successive steps have insufficient pose separation, and exact cell geometry/pivot/socket data have not been validated. Rear silhouettes exist, but that alone does not establish eight-direction animation quality. A generated contact sheet is not a completed delivery. Next art pass must resolve these issues before extraction and equipment fitting.

## Current Evidence

`survivors-sprite-motion.ts` stores horizontal facing (`1 | -1`) and vertical travel for gait deformation. The six command sheets are temporal gestures, not eight viewing angles. Mirroring, rotation, or renaming them cannot satisfy this task.

## First Production Slice

Use the canonical `player-map.webp` actor as the first slice; retain the other five characters until it passes approval. Scope: idle, walk, command, ultimate, and the three existing wearable attachments. Do not replace every character simultaneously.

Create independent views in clockwise order: E, SE, S, SW, W, NW, N, NE. Coordinates follow the game world: right = E, down = S. A rear view must actually expose the back of the helmet, harness, and clothing, not a flipped face.

For each direction, deliver:

- Idle: 4 authored breathing frames.
- Walk: 8 frames, contact / down / passing / up for both feet; first/last transition must loop. Boot ground contact remains stable.
- Command: 8 frames, anticipation / intermediate / release / recovery, returning to idle. Preserve the actor-specific tool gesture.
- Ultimate: 8 frames with the same phase structure; source emission belongs to the release frame, not initial anticipation.

Use transparent RGBA PNG, uniform 256x256 cells, consistent scale and ground pivot, no baked aura, no ground shadow, no text. Frame numbering is zero-based. Keep the canonical facial identity, PPE, clothing material, tool proportions and light direction. This is an art delivery requirement, not permission to fabricate unavailable frames at runtime.

## Equipment Contract

Every direction/action/frame requires normalized cell-local attachment anchors: radio/head, chest, back dock, left hand, right hand, feet/ground. Supply per-frame foreground occlusion polygons for hands, tools and torso. Mark front/back layer explicitly: a rear-facing chest item may be obscured; its aura may remain visible without drawing the equipment through the body.

Match `voice_lens`, `shock_mantle`, `inspection_wing` and existing base tools. Do not reuse current front-view socket numbers for the rear views. Do not reflect text, radio controls, insignia or asymmetric tools.

## Integration Gate

1. Review an enlarged contact sheet for eight distinct views, silhouette, anatomy, canonical identity, consistent PPE and stable foot pivot.
2. Validate every cell has alpha, no clipping, no duplicate rear/front art and correct frame dimensions.
3. Use an explicit direction state with a dead zone and retained last facing when stationary. Quantize travel to eight sectors; do not switch angles on noisy zero input.
4. Body frame and equipment anchors must be selected by the same direction/action/frame tuple. Do not publish an actor before its assets and socket data load.
5. Test walk stop/start, diagonal transitions, direction changes during command, pause, reduced motion, and all three wearables together.
6. Verify raster differences across all eight views, foot drift at native scale, equipment occlusion, and mobile performance before production approval.

The initial rejection above is historical. After Director authorization to reuse the previous work, the player sheet received transparent-background cleanup and runtime extraction. Eight travel sectors, retained idle facing, shared frame/socket selection and rear equipment occlusion are now connected. See `SURVIVORS-RUNTIME-V2-INTEGRATION-20261006.md` for measured scope and remaining approval gates. A generated contact sheet alone is not final animation approval.
