# TASK-016F — Scene Element Production Art

Status: CONTRACT COMPLETE / FINAL ART 2 OF 10 / VEHICLE OVERLAP BRIEF LOCKED

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
| access_barrier | FINAL / ACCEPTED | `assets/episode01/scene-elements/access-barrier.webp` | 768×512 | 140 px | 0.50, 0.92 |
| vehicle_overlap_zone | NEXT / BRIEF LOCKED | `assets/episode01/scene-elements/vehicle-overlap.webp` | 768×512 | 168 px | 0.50, 0.50 |
| harness_unclipped | pending | `assets/episode01/scene-elements/harness-twin-lanyard-unclipped.webp` | 512×768 | 112 px | 0.50, 0.96 |
| platform_cut_edge | pending | `assets/episode01/scene-elements/platform-cut-edge.webp` | 768×512 | 148 px | 0.50, 0.86 |
| suspended_load | pending | `assets/episode01/scene-elements/suspended-load-round-sling-choker.webp` | 768×768 | 136 px | 0.50, 0.62 |
| gangform_lift_wire22 | pending | `assets/episode01/scene-elements/gangform-lift-wire22.webp` | 768×768 | 156 px | 0.50, 0.66 |
| exclusion_zone | pending | `assets/episode01/scene-elements/exclusion-zone.webp` | 768×512 | 160 px | 0.50, 0.76 |
| wet_floor | pending | `assets/episode01/scene-elements/wet-floor.webp` | 768×512 | 150 px | 0.50, 0.50 |
| open_edge | pending | `assets/episode01/scene-elements/open-edge.webp` | 768×512 | 154 px | 0.50, 0.82 |

All ten slots require WebP alpha transparency. No text, labels, warnings, site names, logos, floor plate, background scenery, or UI may be baked into the cutout.

## Material-stack visual contract
Approved final asset:
- final path: `public/assets/episode01/scene-elements/material-stack.webp`
- deterministic embedded output: 768×581, 51,984 bytes
- binary SHA-256: `88692a78c8958c697acda30f76379c577b61667422a2d2a43e6105b2016394f0`
- alpha: required and verified
- one homogeneous material specification per bundle
- different dimensions/specifications separated
- central ratchet buckle or equivalent binding visibly identifiable

Gameplay rendering acceptance remains locked at `entry` for `e01_03_plan_breaks` and `yard` for `e01_05_command`, 132 px, pivot 0.50/0.94.

## Access-barrier visual contract
Approved final asset:
- final path: `public/assets/episode01/scene-elements/access-barrier.webp`
- deterministic embedded output: 820×514, 55,802 bytes
- binary SHA-256: `acb24f74cb7976fb2a6afa4efa0534991537e192670c11f639be25875f1fa542`
- alpha: required and verified
- map width: 140 px
- pivot: 0.50 / 0.92
- freestanding high-visibility modular barrier
- clearly readable weighted feet/base blocks and reflective marking
- no text, sign board, warning lamp, people, vehicles, pit/opening, scenery, or branding

The asset is registered for reusable rendering but is not injected into an Episode 01 event that does not already author an access-control barrier.

## Vehicle–pedestrian overlap visual contract
`vehicle_overlap_zone` is a reusable hazard overlay, not a picture of one specific forklift, truck, worker, or project. This keeps the same asset usable in foundation access routes, basement logistics, material yards, and lifting areas.

Production brief:
- catalog key: `vehicle_overlap_zone`
- final path: `public/assets/episode01/scene-elements/vehicle-overlap.webp`
- minimum: 768×512 transparent WebP
- map width: 168 px
- pivot: 0.50 / 0.50
- render mode: route overlay
- vehicle route: wide drive path
- pedestrian route: narrower walk path
- overlap: clearly highlighted intersection/shared zone
- directional language: simple chevrons and lane-edge markings only
- baked vehicle object: forbidden
- baked worker/pedestrian figure: forbidden
- Korean/English text or pseudo-glyphs: forbidden
- vehicle/manufacturer/site branding: forbidden
- scene-specific floor slab, parking bay, building, background, cones, barriers, or signs: forbidden

The overlay must communicate **where vehicle and pedestrian movement conflict**, not claim that a particular vehicle model or worker action is the hazard. At gameplay scale the wide vehicle route, narrow pedestrian route, and overlap hotspot must remain distinguishable.

The overlay itself is not a safety verdict. Gameplay evaluation must separately consider physical route separation, barricades, guide/signal personnel, vehicle speed, reversing movement, driver sightlines and blind spots, lighting, parking, material storage encroachment, and the applicable work plan.

The final asset will remain reusable and will not be injected into an Episode 01 event unless that event explicitly authors vehicle/pedestrian route conflict.

## Fall-protection visual contract
### Twin-lanyard harness
- catalog key: `harness_unclipped`
- full-body harness
- twin/Y lanyard: 2 lanyards, 2 large hooks
- internal ergonomic reference: SWELOCK double-lanyard products may inform proportions only
- branding: no logo, trademark, product name, or fake manufacturer label
- final path: `harness-twin-lanyard-unclipped.webp`

The twin-lanyard shape is a site-default visual profile, not a standalone safety verdict. Gameplay evaluation still considers actual attachment, anchorage, hook engagement, fall clearance, swing-fall exposure, absorber/lanyard condition, and work conditions.

## Lifting visual contract
### General material lifting
- catalog key: `suspended_load`
- round sling
- site-default hitch: choker hitch (초크걸이)
- capacity basis: manufacturer sling tag / Choker WLL
- final path: `suspended-load-round-sling-choker.webp`

The rigging method itself is not a safety verdict. Evaluation considers load, center of gravity, choke angle, sling condition, edge protection, sling angle, lifting point, hardware, and work plan.

### Gangform lifting
- catalog key: `gangform_lift_wire22`
- wire rope
- site visual profile: Ø22 mm
- hitch: `site_defined`
- final path: `gangform-lift-wire22.webp`

Diameter alone must never produce a safe/unsafe result. Evaluation considers rated capacity, rope condition, angles, connections, lifting points, shackles/hardware, and work plan.

## Pivot contract
`pivot.x` and `pivot.y` are normalized values from 0 to 1. The scene anchor marks a world point; the cutout is translated by the negative pivot percentage so the authored contact/suspension point aligns to that world point.

Ground props use a lower-center pivot; suspended loads use an interior suspension/readability point; area overlays such as vehicle overlap use a centered pivot.

## Automated gates
Normal development/release verification runs:

`npm run assets:scene-elements-contract`

This validates slot count, unique IDs/paths, WebP destinations, minimum dimensions, normalized pivots, map scale, required alpha metadata, lifting profiles, twin-lanyard profile, material storage/binding profile, access-barrier profile, and the vehicle/pedestrian traffic-conflict profile. Any slot promoted to `final` must have a real WebP and pass dimensions/alpha checks.

Strict all-art gate:

`npm run assets:production-scene-elements-check`

This requires all 10 files, valid WebP headers, each minimum dimension, and actual WebP alpha transparency.

## Manifest behavior
Scene-element asset IDs enter `content/episode01/assets.json` only when an exact final WebP exists. Missing scene-element art keeps the runtime on the CSS placeholder. The original core production gate remains 17 files; scene-element production remains a separate 10-slot gate.

With `material_stack` and `access_barrier` final, the normal Episode 01 manifest resolves 19 assets.

## Rendering acceptance
At gameplay scale each final cutout must:
- remain identifiable at configured `map_max_px`,
- align through the catalog pivot,
- preserve clean transparent edges,
- sit below actors and interactive risk signals,
- contain no Korean text or pseudo-glyphs,
- avoid implying a hazard not authored by the event,
- preserve correct lifting gear/hitch when applicable,
- preserve two lanyards/two hooks for the fall-protection asset,
- keep material specifications separated and central binding visible for `material_stack`,
- keep `access_barrier` generic and sign-free,
- keep `vehicle_overlap_zone` as a route-conflict overlay with no baked vehicle, worker, text, or branding.

## Next named production slot
`public/assets/episode01/scene-elements/vehicle-overlap.webp`

Produce exactly one transparent route-overlap asset that satisfies the locked contract above. Do not produce a sheet or full gameplay screen. Final acceptance uses the same binary, alpha, pivot, map-scale, manifest, TypeScript, test, and production-build gates used for the first two final scene elements.
