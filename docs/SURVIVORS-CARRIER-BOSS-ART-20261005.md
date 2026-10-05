# Heavy Carrier Boss Art

## Production Candidate Integrated

The designated RUNAWAY_CART previously shared ordinary cart art. It now uses an original generated heavy industrial carrier: red/graphite chassis, fractured strapped concrete, hydraulic piping, large wheels, brass winches and amber lamps. Only actual stage bosses select this image; ordinary and reinforced carts retain their existing atlas cells. Existing sprite size, collision radius, HP, attack cadence and warnings are unchanged.

Asset: `public/assets/survivors/runaway-carrier-boss-v1.webp`, 1536x1024, 495720 bytes, RGBA. Generated as a transparent final-candidate sprite; alpha preserved through WebP conversion. Four corner alpha values are zero. No chroma key or painted placeholder. Source remains at the generator's original output location.

All cart raster renderers now include low-opacity directional headlamp pools aligned with the actual warning/charge heading. Existing chassis anticipation, compression and braking remain intact. Lighting is drawn underneath the sprite and cannot modify hit windows.

## Verification

- Typecheck and production build pass.
- Full suite: 1308 tests pass, 1 opt-in skipped.
- Selector regression excludes ordinary carts, cranes and people from the new boss sprite.
- Existing phase fixtures: stages 1, 3, 22, 35 at 1440x900, 390x844, 844x390; all 12 pass warning/recovery status, phase-two cue, nonblank canvas, viewport bounds and no page errors.
- Mobile QA now measures the visible compact boss strip instead of the hidden detailed readout. Actual stage-1 screenshot inspected for transparent compositing and dedicated carrier appearance: `artifacts/boss-phases/390x844-1-warning.png`.

## Remaining Scope

This is the first dedicated boss replacement, not 50 individual boss skins or a complete monster overhaul. Crane, gas and debris retain existing production art. Small sprite readability, physical mobile performance, and final Director art acceptance remain review items; binary integration is not final visual lock.
