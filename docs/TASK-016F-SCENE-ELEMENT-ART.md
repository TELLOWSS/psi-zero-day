# TASK-016F — Scene Element Production Art

Status: CONTRACT COMPLETE / FINAL ART 0 OF 10

## Objective
Promote reusable physical construction-site props and hazards from lightweight CSS placeholders to commercial transparent WebP cutouts without changing engine rules, event outcomes, or scene recipes.

## Runtime precedence
Scene elements intentionally use a shorter visual precedence than characters:

1. final transparent WebP registered through the validated asset manifest,
2. CSS placeholder token + Korean UI label.

There is no RC SVG layer for scene elements. This prevents production props from accumulating another temporary illustration tier.

## Production slots
| Element | Final path | Minimum | Map max | Pivot |
| --- | --- | ---: | ---: | --- |
| material_stack | `assets/episode01/scene-elements/material-stack.webp` | 768×512 | 132 px | 0.50, 0.94 |
| access_barrier | `assets/episode01/scene-elements/access-barrier.webp` | 768×512 | 140 px | 0.50, 0.92 |
| vehicle_overlap_zone | `assets/episode01/scene-elements/vehicle-overlap.webp` | 768×512 | 168 px | 0.50, 0.50 |
| harness_unclipped | `assets/episode01/scene-elements/harness-unclipped.webp` | 512×768 | 112 px | 0.50, 0.96 |
| platform_cut_edge | `assets/episode01/scene-elements/platform-cut-edge.webp` | 768×512 | 148 px | 0.50, 0.86 |
| suspended_load | `assets/episode01/scene-elements/suspended-load-round-sling.webp` | 768×768 | 136 px | 0.50, 0.62 |
| gangform_lift_wire22 | `assets/episode01/scene-elements/gangform-lift-wire22.webp` | 768×768 | 156 px | 0.50, 0.66 |
| exclusion_zone | `assets/episode01/scene-elements/exclusion-zone.webp` | 768×512 | 160 px | 0.50, 0.76 |
| wet_floor | `assets/episode01/scene-elements/wet-floor.webp` | 768×512 | 150 px | 0.50, 0.50 |
| open_edge | `assets/episode01/scene-elements/open-edge.webp` | 768×512 | 154 px | 0.50, 0.82 |

All ten slots require WebP alpha transparency. No text, labels, warnings, site names, logos, floor plate, background scenery, or UI may be baked into the cutout.

## Lifting visual contract
The lifting element is split so the game does not present one generic rigging method for all loads.

### General material lifting
- catalog key: `suspended_load`
- visual rigging method: round sling
- final path: `suspended-load-round-sling.webp`
- intended use: ordinary construction material lifting scenes

### Gangform lifting
- catalog key: `gangform_lift_wire22`
- visual rigging method: wire rope
- wire-rope diameter represented in the site visual profile: Ø22 mm
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
Normal development/release verification checks only the production contract:

`npm run assets:scene-elements-contract`

This validates slot count, unique IDs/paths, WebP destination paths, minimum dimensions, normalized pivots, map scale, required alpha metadata, and lifting-rigging profile rules. It does not require final binary files yet.

When all final scene-element art is ready, run the strict binary gate:

`npm run assets:production-scene-elements-check`

The strict gate requires all 10 files, valid WebP headers, each per-slot minimum dimension, and actual WebP alpha transparency.

## Manifest behavior
Scene-element asset IDs are part of the planned asset pipeline but are emitted into `content/episode01/assets.json` only when an exact final WebP exists. Missing scene-element art does not create an RC/fallback image manifest entry, so the runtime naturally falls back to the existing CSS placeholder.

The original Episode 01 core production gate remains exactly 17 files (1 background + 16 character images). Scene-element production is a separate 10-slot gate and does not distort the core release count.

## Rendering acceptance
At gameplay scale each final cutout must:
- remain identifiable at its configured `map_max_px`,
- align to its scene anchor via the catalog pivot,
- preserve clean transparent edges with no rectangular halo,
- sit below actors and interactive risk signals,
- contain no Korean text or pseudo-glyphs,
- avoid visually implying a hazard not present in the authored episode data,
- show the correct lifting gear for the scene profile when the element is a lifting asset.

## Next named production asset
`public/assets/episode01/scene-elements/material-stack.webp`

This is first because `material_stack` is already used by Episode 01 (`e01_03_plan_breaks` and `e01_05_command`). Once approved, the same reusable cutout can appear at different scene anchors without regenerating an episode screen.
