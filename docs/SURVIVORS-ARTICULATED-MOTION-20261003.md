# Articulated shooting motion

This completes the runtime motion work after PR94 grounding, using the existing approved Korean cast artwork. It is a 2D textured joint rig, not newly generated character identities or a 3D character system.

## Runtime

- Authored hip/knee/ankle/sole anchors for all six canonical playable map sprites, worker and legacy director art.
- Actual displacement drives walk/run cadence and facing. Alternate planted feet and lifted swing feet, inverse kinematics at the knee, and separate pelvis/torso movement replace whole-picture bobbing.
- 16 phase poses with direction-sensitive foot projection. Three-quarter art is retained for vertical travel; horizontal travel is mirrored. These are not eight separately drawn viewpoints.
- Starting/stopping eases the gait envelope. Idle breathing, tool-event upper-body settle, contact brace and safe worker exit share the same simulation clock. Pauses and fixed-step intermediate renders freeze the exact pose.
- Original face, helmet, vest, trousers and held equipment textures stay intact. Alpha bounds and source rig preparation are cached on load. Textured leg meshes are baked lazily into 224×240 canvases, with at most 24 LRU frames per source image, then drawn as ordinary sprites. No per-frame full image alpha scan.
- Cart wheel hub texture rotates from cumulative travelled distance, independent of gait wrap. Tyres remain grounded; lights follow the locked trajectory during warning/charge and actual heading while travelling.
- Movement/collision/hit-window/score/risk resolution rules remain owned by the existing engine.

## Verification

Pure tests check foot support throughout walk/run, world-space horizontal support-foot lock, contact/swing continuity, reachable bone lengths, rig coverage, actual-speed mode changes, frozen tool gestures and cart travel continuity. Full required test/type/build and existing browser gameplay flows run.

`verify-survivors-browser.mjs` observes distinct joint pose canvases in actual gameplay, without injecting engine state, and records a phone movement video. `verify-survivors-rig.mjs` is an explicitly labelled presentation-only visual fixture: seven approved actor assets at enlarged size, walk/run/idle/tool states, lower-body pixel changes, frame timings and captured video. Fixture timing is not a physical-phone FPS claim. Its captures must be visually reviewed for cracks, duplicated boots, clipping, body distortion and identity consistency before merge.

The discarded AI walk-sheet candidates remain excluded. Final motion review relies on actual runtime/art continuity, not test count alone. Original master Bible: field readability and no floating characters; preserve the cast and original safety gameplay.
