# Character command animation follow-up

## Production slots

- `public/assets/survivors/kang-command-v1.png`: Kang Taesik pointing/foreman gesture; the legacy park alias shares the same actual actor asset.
- `public/assets/survivors/lim-command-v1.png`: Lim Junho radio wrist and push-to-talk gesture.
- Both sheets contain eight full-body poses in four columns and two rows. They load before the actor is published to gameplay and fitting. Player/jung retain their existing tablet-command sheet.

## Generation brief

The built-in image generator used the existing individual character map image as a visual reference. Each character received a separate sheet, followed by a refinement pass for clipped helmets, boots and missing radio props. Final PNGs are preserved unchanged; no placeholder art was introduced.

Kang prompt brief: preserve the moustached foreman, orange helmet and reflective vest, dark workwear and boots. Author eight pointing-arm intermediate poses, bending the command arm toward the chest and returning to the extended point. Maintain a fixed camera, full-body framing, transparent background and a rigid 4x2 grid. Refine helmet/boot padding and keep the free hand visible.

Lim prompt brief: preserve the yellow helmet, lime reflective vest, navy workwear and black boots. Author eight subtle radio wrist/push-to-talk intermediate poses. Keep the black walkie-talkie present in every cell, fixed camera and full-body framing, transparent background and a rigid 4x2 grid. Refine missing radio details and helmet/boot framing.

## Runtime integration

Support-boot registration normalizes each sheet to 256px body height. The new neutral supplies the walking mesh and fixed lower-body pixels. Character-specific head/PPE regions are restored from that same neutral. Replacement bands and preserved rectangles use integer pixel boundaries to avoid alpha-edge seams. Kang's replacement starts at the top of the body to remove the old extended-arm silhouette during folded poses.

Rig joints are character-specific. Hip-crossing hands are restored over the leg mesh, and command-frame hand occluders place moving gloves/radio in front of equipment. Body gear continues using the shared torso transform and mirrored sockets. No combat, economy, progression or audio rules changed.

## Verification

`npm test`: 1,364 passed, one skipped. `npm run typecheck` and `npm run build`: passed. `verify-survivors-authored-materials.mjs`: passed, including the existing player gestures and optical materials.

`verify-survivors-command-cast.mjs` checks three registered command actors, eight distinct composites, stable protected face/lower-body pixels, both facings and moving equipment. It exercises each new character's fitting screen at 1440x900, 390x844, 844x390 and 568x320, with pause, reduced motion, asset loading, no horizontal overflow and no browser errors. Local reports and screenshots are in `artifacts/command-cast` and are not production assets.

`verify-survivors-encounter-aura.mjs`: passed at desktop, portrait and landscape, including boss arrival/core/secured transitions, soundtrack continuity, four boss effect renders and all nine character/alias carried-tool renders. Pixel comparison canvases request `willReadFrequently` so Chromium's first GPU-to-CPU readback does not introduce a false first-frame difference.

## Director gate / remaining work

This is not a final cinematic quality lock. The source sheets still have uneven pose spacing and less padding than requested; the runtime stabilizes face and lower-body registration but cannot invent missing directional artwork. Neutral character identity and intermediate-pose timing require visual review. Yoon, Lee and the safety monitor still need their own authored sheets. Left/right currently mirror the same view; genuine front/back or eight-direction artwork is not complete.
