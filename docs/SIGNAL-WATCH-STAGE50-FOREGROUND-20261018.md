# Signal Watch — real approved foreground equipment depth, 01–50

## IMPLEMENTED
- All fifty stages keep their authored floor images and engine state; a single shared renderer now places existing **three types of real equipment sprites** into the same feet-Y sorting pass as player, hazards and loot.
- Actual floodlight towers, flammable-storage drums and electrical distribution cabinets can render **in front of or behind the moving actor** according to their existing world-space feet/contact anchors. The old early sprite draw is removed, so the equipment sprite is not drawn twice.
- Warning zones, status text and hazard telegraphs are drawn in the original field pass and never become fake foreground objects; slurry puddles and overhead crane danger areas are explicitly excluded.
- The genuine raster obstacle becomes partially see-through **only when it would hide the player**, down to 52% opacity, making actor position visible without changing collisions.
- No additional image binaries, placeholders, fictional barriers, world geometry, damage, unlock, save or difficulty changes; no runtime mask allocation.

## FILES
- `src/ui/survivors-foreground-props.ts`: authored equipment classification, feet-Y anchor, visibility factor.
- `src/ui/PatrolSurvivorsGame.tsx`: single ordered material pass, no duplicate fixture art.
- `tests/survivors-foreground-props.test.ts`: exact fixture anchors, non-occluding warnings, overlap behavior, state immutability.
- `.github/workflows/verify-signal-watch-stage50.yml`: complete 50-stage four-size browser verification and overall tests.

## TEST
- `npm test && npm run typecheck && npm run build`, 50 x four real viewport sizes x normal/reduced motion and low-performance phone crowd samples by GitHub Actions.

## TODO
- This **does not** reconstruct separate foreground cut-outs from all 50 painted stage maps. Stage environment segmentation and newly authored and reviewed occlusion masks remain an explicit subsequent art-production step.
- Pixel-for-pixel before/after comparison on real Android devices and original-art layer approvals remain required for visual production lock.
- Ensure that high foreground equipment density doesn't compromise scene readability and all phone movement remains playable.

## DIRECTOR REVIEW
- This is actual sprite layer separation for existing equipment, not another brightness tweak. Quality should be assessed by moving behind one of the approved equipment pieces, not by a stationary empty floor screenshot.
