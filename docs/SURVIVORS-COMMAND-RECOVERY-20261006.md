# Authored command recovery continuity

## Implemented

The first cast-wide continuity pass changes playback, not source art. Kang's original sheet has a folded-arm peak at source frame 3 followed by an extended point at frame 4. Playback now uses `[0,1,2,3,2,1,6,7]`, returning through actual intermediate poses rather than jumping immediately out of the folded pose. His eight source cells are unchanged; the active cycle uses six distinct source poses and intentionally repeats two during recovery.

All authored characters share normalized phase starts `[0,.10,.20,.32,.48,.62,.75,.88]` and settle on the exact neutral composite during the final four percent of a gesture. This gives the peak/release more time and ensures the gesture ends on the same body as idle. The authored body and hand/equipment occlusion use one frame selector, so recovering hands cannot use a different equipment cutout. Existing attack durations, simulation clock, rapid-shot gesture continuity, ultimate priority and reduced-motion behavior are unchanged. No gameplay/economy/audio rules changed.

## Files / verification

- `src/ui/survivors-command-art.ts`: character sequence and deterministic phase selector.
- `src/ui/survivors-rig-renderer.ts`: body and occlusion share that selector.
- `tests/survivors-command-art.test.ts`: foreman return order, other actors' original order, neutral settling, invalid input and exhaustive frame bounds.
- `scripts/verify-survivors-command-cast.mjs`: validates rendered distinct poses against the actual sequence, stable head/lower body and final settled pixels matching neutral.

Full suite: 1,365 passed, one skipped. Typecheck and production build passed. Browser cast checks cover all six canonical actors, both facings, walking gear and exact neutral settling. Fitting covers five command actors at desktop, portrait, landscape and compact landscape, with animation, pause, reduced motion, exact asset loading, no horizontal overflow and no page errors. Reports and montages stay local under `artifacts/command-cast`.

## Director review / TODO

Review folded-arm recovery and end-to-idle continuity in actual gameplay. This is a modest playback improvement, not newly drawn in-between frames, optical-flow interpolation or cinematic lock. Source pose spacing and grip consistency still need a visual art pass. True front/back/eight-direction artwork, additional action sequences and the separately illustrated legacy Yoon are outstanding. Existing sheets must not be described as fully directional animation.
