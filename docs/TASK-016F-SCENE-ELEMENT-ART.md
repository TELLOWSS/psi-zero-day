# TASK-016F — Scene Element Production Art

Status: CONTRACT COMPLETE / FINAL ART 1 OF 10 / MATERIAL STACK ACCEPTED / ACCESS BARRIER BRIEF LOCKED

## Objective
Promote reusable physical construction-site props and hazards from lightweight CSS placeholders to commercial transparent WebP cutouts without changing engine rules, event outcomes, or scene recipes.

## Runtime precedence
Scene elements intentionally use a shorter visual precedence than characters:

1. final transparent WebP registered through the validated asset manifest,
2. CSS placeholder token + Korean UI label.

There is no RC SVG layer for scene elements. This prevents production props from accumulating another temporary illustration tier.

## Production slots
| Element | Status | Final path | Minimum | Map max | Pivot |
| --- | --- | --- | ---: | ---: | --- |
| material_stack | FINAL / ACCEPTED | `assets/episode01/scene-elements/material-stack.webp` | 768×512 | 132 px | 0.50, 0.94 |
| access_barrier | NEXT / BRIEF LOCKED | `assets/episode01/scene-elements/access-barrier.webp` | 768×512 | 140 px | 0.50, 0.92 |
| vehicle_overlap_zone | pending | `assets/episode01/scene-elements/vehicle-overlap.webp` | 768×512 | 168 px | 0.50, 0.50 |
| harness_unclipped | pending | `assets/episode01/scene-elements/harness-twin-lanyard-unclipped.webp` | 512×768 | 112 px | 0.50, 0.96 |
| platform_cut_edge | pending | `assets/episode01/scene-elements/platform-cut-edge.webp` | 768×512 | 148 px | 0.50, 0.86 |
| suspended_load | pending | `assets/episode01/scene-elements/suspended-load-round-sling-choker.webp` | 768×768 | 136 px | 0.50, 0.62 |
| gangform_lift_wire22 | pending | `assets/episode01/scene-elements/gangform-lift-wire22.webp` | 768×768 | 156 px | 0.50, 0.66 |
| exclusion_zone | pending | `assets/episode01/scene-elements/exclusion-zone.webp` | 768×512 | 160 px | 0.50, 0.76 |
| wet_floor | pending | `assets/episode01/scene-elements/wet-floor.webp` | 768×512 | 150 px | 0.50, 0.50 |
| open_edge | pending | `assets/episode01/scene-elements/open-edge.webp` | 768×512 | 154 px | 0.50, 0.82 |

All ten slots require WebP alpha transparency. No text, labels, warnings, site names, logos, floor plate, background scenery, or UI may be baked into the cutout.

## Material-stack visual contract
The first final scene element is `material_stack`, because it is already used by Episode 01 (`e01_03_plan_breaks` and `e01_05_command`).

Approved final asset:
- final path: `public/assets/episode01/scene-elements/material-stack.webp`
- deterministic embedded output: 768×581, 51,984 bytes
- binary SHA-256: `88692a78c8958c697acda30f76379c577b61667422a2d2a43e6105b2016394f0`
- alpha: required and verified
- visual content: one homogeneous material specification per bundle
- mixed dimensions/specifications: not allowed in one visual bundle
- binding: central ratchet buckle or equivalent separate binding must be visibly identifiable
- no lifting hook/slings, text, signs, UI, site scenery or other material specification mixed into the cutout

The bundle/profile is a site-visual practice, not a standalone safety verdict. Gameplay evaluation must still consider stack stability, dunnage/support, actual binding condition, passage encroachment, and the applicable work plan.

Gameplay rendering acceptance is locked by automated tests:
- `e01_03_plan_breaks`: same final WebP at `entry`
- `e01_05_command`: same final WebP at `yard`
- map width: 132 px
- pivot translation: 0.50 / 0.94
- CSS token is not rendered when the final asset resolves

## Access-barrier visual contract
`access_barrier` is deliberately generic because it must be reusable across foundation, typical-floor, scaffold, basement, and lifting scenes without implying a specific hazard that the authored event did not contain.

Production brief:
- catalog key: `access_barrier`
- final path: `public/assets/episode01/scene-elements/access-barrier.webp`
- minimum: 768×512 transparent WebP
- map width: 140 px
- pivot: 0.50 / 0.92
- form: freestanding modular construction barrier
- material: high-visibility polymer body
- stabilization: clearly readable weighted feet/base
- visibility: reflective marking must remain readable at gameplay scale
- integrated Korean/English text: forbidden
- integrated warning/sign board: forbidden
- warning lamps/beacons: forbidden in the generic reusable cutout
- people, vehicles, opening/pit, scaffolding, floor slab, background, scenery and unrelated props: forbidden

The previously generated orange barricade concepts with Korean copy, warning sign boards, lamps, sandbags, dark studio background, or an opening/pit are concept references only and must not be promoted to the production slot.

The barrier shape itself is not a safety verdict. Gameplay evaluation must separately consider whether barriers are continuous, stable against overturning/movement, placed around the actual restricted area, preserve a safe bypass route, and match the applicable work plan.

## Fall-protection visual contract
The reusable fall-protection hazard must visually match contemporary site practice without embedding a commercial brand.

### Twin-lanyard harness
- catalog key: `harness_unclipped`
- harness type: full-body harness
- lanyard configuration: twin/Y lanyard
- visible lanyards: 2
- visible large hooks: 2
- connection intent: one connection can remain attached while the second lanyard transfers to the next suitable anchorage
- internal ergonomic reference: SWELOCK double-lanyard products may inform strap/hook proportions only
- branding rule: no SWELOCK logo, trademark, product name, fake label, or manufacturer-specific marking in final art
- final path: `harness-twin-lanyard-unclipped.webp`

The twin-lanyard shape is a site-default visual profile, not a claim that two lanyards alone make the work safe. Gameplay evaluation must still consider whether the worker is actually connected, the suitability/location/strength of the anchorage, hook engagement, fall-clearance distance, swing-fall exposure, energy absorber/lanyard condition and the applicable work condition.

When the hazard state is `harness_unclipped`, the final cutout must still show both lanyards and both hooks clearly so the player can understand that available protection exists but is not correctly connected.

## Lifting visual contract
The lifting element is split so the game does not present one generic rigging method for all loads.

### General material lifting
- catalog key: `suspended_load`
- visual rigging method: round sling
- site-default hitch method: choker hitch (초크걸이)
- capacity basis in game metadata: manufacturer sling tag / Choker WLL, not the vertical rating
- final path: `suspended-load-round-sling-choker.webp`
- intended use: ordinary construction material lifting scenes

The choker hitch is the authored site-default presentation for general heavy-load scenes in PSI : ZERO DAY. It is not encoded as a universal statement that every load must be choked. A scene may override the authored rigging profile when its work plan or load geometry requires another method.

When a choker hitch is shown, gameplay safety evaluation must not treat the rigging method itself as proof of safety. The evaluation must consider the sling tag/manufacturer choker rating, load mass and center of gravity, choke angle, sling and stitching/cover condition, sharp-edge protection, sling angle, connection condition, lifting point, hook/shackle hardware and the applicable work plan.

### Gangform lifting
- catalog key: `gangform_lift_wire22`
- visual rigging method: wire rope
- wire-rope diameter represented in the site visual profile: Ø22 mm
- hitch method: `site_defined` until the authored gangform work plan specifies the connection method
- final path: `gangform-lift-wire22.webp`
- intended use: gangform lifting scenes

The rigging method is a visual/site-practice profile, not a standalone safety verdict. Gameplay safety evaluation must consider the load, rated capacity, rigging condition, lifting angle, connection condition, lifting points, shackles/related hardware, and work plan as applicable. Wire-rope diameter alone must never produce a safe/unsafe result.

## Pivot contract
`pivot.x` and `pivot.y` are normalized values from 0 to 1. The scene anchor marks a world point; the cutout is translated by the negative pivot percentage so the authored contact/suspension point aligns to that world point.

Examples:
- ground props use a pivot near the lower center,
- a suspended load uses an interior suspension/readability point,
- area overlays such as wet floor or vehicle overlap use a centered pivot.

## Automated gates
Normal development/release verification runs:

`npm run assets:scene-elements-contract`

This validates slot count, unique IDs/paths, WebP destination paths, minimum dimensions, normalized pivots, map scale, required alpha metadata, lifting-rigging profile rules, the twin-lanyard fall-protection profile, the material-stack storage/binding profile, and the reusable access-barrier profile. Any slot promoted to `final` must also have a real WebP present and pass its dimensions/alpha checks during the normal contract check.

When all final scene-element art is ready, run the strict binary gate:

`npm run assets:production-scene-elements-check`

The strict gate requires all 10 files, valid WebP headers, each per-slot minimum dimension, and actual WebP alpha transparency.

## Manifest behavior
Scene-element asset IDs are part of the planned asset pipeline but are emitted into `content/episode01/assets.json` only when an exact final WebP exists. Missing scene-element art does not create an RC/fallback image manifest entry, so the runtime naturally falls back to the existing CSS placeholder.

The original Episode 01 core production gate remains exactly 17 files (1 background + 16 character images). Scene-element production is a separate 10-slot gate and does not distort the core release count. With `material_stack` final, the normal Episode 01 manifest currently resolves 18 assets.

## Rendering acceptance
At gameplay scale each final cutout must:
- remain identifiable at its configured `map_max_px`,
- align to its scene anchor via the catalog pivot,
- preserve clean transparent edges with no rectangular halo,
- sit below actors and interactive risk signals,
- contain no Korean text or pseudo-glyphs,
- avoid visually implying a hazard not present in the authored episode data,
- show the correct lifting gear and hitch method for the authored scene profile when the element is a lifting asset,
- show two distinct lanyards and two distinct hooks for the fall-protection asset while remaining brand-neutral,
- keep different material dimensions/specifications in separate bundles and show the authored central binding for `material_stack`,
- keep `access_barrier` generic: weighted freestanding body + reflective marking, with no baked sign/text/lamp or hazard-specific surroundings.

## Next named production slot
`public/assets/episode01/scene-elements/access-barrier.webp`

Produce exactly one reusable transparent cutout for this slot, not a sheet or full gameplay screen. It must satisfy the access-barrier contract above. Final acceptance will use the same binary, alpha, pivot, map-scale, manifest, UI-rendering, TypeScript, and production-build gates used for `material_stack`.
