# Ground Contact Replacement

## Video Review

Reviewed the user-provided 65.54-second, 30-fps portrait recording locally.
Persistent cyan/yellow foot seals remain attached during traversal (visible around
20-41 seconds and 45-57 seconds). Dense blue electrical silhouettes overlap the
boot contact; this reads as an attached graphic rather than a transient material.
Walking changes pose, but this recording does not measure input-to-photon delay.
Existing distance-driven eight-direction cadence and direct touch input are retained.
Private recording and extracted frames are not included in Git.

## Runtime Replacement

- Removed persistent equipment/evolution ground identity calls, the player accent
  oval, and the decorative leadership dashed oval from the game renderer.
- Preserved functional attack-range and danger telegraphs, actual contact shadow,
  worn equipment sockets, and body mantle.
- New authored six-phase raster material sequences: electrical discharge, pressure
  dust, and metallic debris. Nonuniform source rectangles match the authored layout.
- Acquisition/evolution, local firing, evolved contact, and critical contact create
  bounded effects. Ordinary fire with no relevant equipment/evolution creates none.
- Contact positions are captured at creation, never follow the player afterward.
  Ground-plane drift, fade, and adjacent-frame crossfade replace rotating seals.
- Cadence caps and busy budgets prevent continuous fire becoming an opaque carpet.
  Reduced motion suppresses decorative ground animation without changing gameplay.
- Sixteen gear IDs have material-family assignments for acquisition. This is three
  material families, NOT sixteen fully bespoke authored animations.

## Asset Provenance

`public/assets/survivors/equipment-ground-contact-v1.png` was generated specifically
for this production slot using imagegen on 2026-10-06. Original source:
`exec-8c6ea555-94fb-426d-ae9f-042aec5c8959.png` in the task's generated_images directory.
The second attempted uniform-grid edit was rejected and is not shipped.
Transparency and nonblank animation phases are verified in browser pixel checks.
This is a runtime replacement candidate, not a Director-approved cinematic art lock.

## Verification And Remaining Scope

Five focused tests cover idle expiry, stationary world anchors, blending, all gear
material mappings, event suppression, reduced motion, run reset and bounded bursts.
Browser checks cover desktop 1440x900 and portrait/landscape 390x844 / 844x390.
Movement-response regression uses actual keyboard/touch events; this is desktop
Chrome automation, not a Samsung S26 Ultra performance certification.

Remaining: individually authored gear-specific release animations beyond the three
families, separately authored directional body/boot transitions and animation art
review, actual handset testing, and Director approval of the new material treatment.
No promise of Diablo-equivalent production quality is made.
