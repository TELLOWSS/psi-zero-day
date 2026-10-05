# Lee Jaehoon command animation

## Production integration

`public/assets/survivors/lee-command-v1.png` contains eight plan-holding wrist poses in a 4x2 transparent sheet. The canonical Lee actor uses it in gameplay and fitting. The neutral supplies the walking mesh, while head/PPE and lower-body pixels remain fixed across command composites. The pocket hand is protected over the moving leg mesh and per-frame plan/glove occlusion follows the wrist. Combat, economy, progression and audio rules are unchanged.

The first browser montage exposed clipping when the rolled drawing tilted outside the neutral silhouette. Lee therefore receives 24px of symmetric horizontal room at normalized 256px body height. His 105px neutral becomes a 129px canvas. Rig joints, protected head/pocket hand and command occluders map into that padded coordinate space. Chest gear sockets are recalibrated to the new torso. Other actors keep zero extra padding.

## Asset and prompt record

Built-in image generation referenced the existing `public/assets/episode01/characters/lee-jaehoon-map.webp`. The selected output was copied from `$CODEX_HOME/generated_images/01a1002a-207a-7242-a0aa-73c7b743c706/exec-49aecddf-3e91-4301-9057-656c98af1554.png`; source outputs are retained outside the repo. PNG alpha contains transparent pixels. No programmatic image alteration was used.

Prompt brief: preserve the young Korean engineer's face, silver/white blue-striped helmet, chin strap, navy workwear, blue reflective harness, gloves, black boots and rolled construction drawing. Generate eight full-body poses in a rigid transparent 4x2 grid. Only animate the drawing wrist: neutral, small lift, outward tilt, maximum tilt/lift, release, mid-return, near-neutral and settling. Keep the other hand in the pocket, fixed head/body/legs/camera, and generous margins. The source has less margin and more registration variation than requested; runtime canonical-region compositing and canvas padding address the observed integration issues.

## Verification

Full test suite: 1,364 passed, one skipped. Production build and both TypeScript projects passed. The command-cast browser checks cover five command actors, eight distinct composites with stable protected face/lower-body pixels, walking gear and both facings. Four fitting actors are checked at 1440x900, 390x844, 844x390 and 568x320, including moving frames, pause, reduced motion, exact actor-specific asset loading, no horizontal overflow and no browser errors. Local screenshots/reports are under `artifacts/command-cast` and are not staged as production assets.

## Director review / TODO

Review Lee's identity continuity, plan grip and gesture timing. This is not final cinematic quality approval: authored pose spacing is uneven, and actual directional sheets remain outstanding. The subsequent [safety monitor integration](SURVIVORS-SAFETY-COMMAND-20261006.md) adds dedicated radio poses. Left/right currently mirror one camera view.
