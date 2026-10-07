# Passing Poses and Independent Equipment Motion

Base: PR #120, production commit `28f8ea4`.

## Authored Passing Art

`public/assets/survivors/player-walk-passing-v1.png` contains two passing poses for each of the existing eight directions. The existing eight stride poses remain in their original sheet. The renderer inserts passing poses at cycle phases 1.5 and 5.5, aligns pelvis anchors, normalizes body height, and retains contact poses when stopped.

Generated with the built-in image generation tool, using the existing walking sheet as the edit reference. The final prompt requested an 8-row, 2-column transparent sheet of alternating left/right passing poses, preserving the original character, helmet, uniform, harness, ponytail, tablet, camera, direction order, and lighting. The generated source is copied into the repository; runtime loading has no dependency on the generation directory.

## Equipment Motion

Each item has its own presentation spring keyed by player and item ID. Radio, spray, armor, pack, wrist, dock, and belt attachments have bounded rotation with different stiffness, damping, gait phase, and attack response. Mounted sockets and foreground occlusion retain the existing character attachment geometry.

Body movement time drives carried and mounted equipment, including combat hit-stop. Equal timestamps retain the same sample; time rewinds, large gaps, facing changes, and reduced motion reset the relevant item. The game state is not modified by presentation animation. Existing drone deployment, recovery, and protocol effects retain their authored behavior.

## Verification

- Unit coverage: passing-phase selection, weight conservation, stopped contacts, independent item history, bounds, reset behavior, hit-stop clock, mounted coordinates.
- `scripts/verify-survivors-passing-motion.mjs`: real asset loading, 80 distinct rendered poses, continuous sockets, six concurrent item motion channels, and screenshots on PC/mobile portrait/mobile landscape.
- Existing fitting verification: five viewport sizes, walk/action, pause, facing, reduced motion, inactive tab, storage preservation, and overflow.
- Required repository checks: `npm test`, `npm run typecheck`, `npm run build`.

Physical-device performance and final art approval remain separate from these browser checks.
