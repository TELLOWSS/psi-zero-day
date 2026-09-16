# TASK-016F — Vehicle/Pedestrian Overlap FINAL

## Scope

Reusable scene-element production asset for `vehicle_overlap_zone`.

- Asset ID: `ep01.scene_element.vehicle_overlap`
- Path: `assets/episode01/scene-elements/vehicle-overlap.webp`
- Visual mode: route overlay only
- Vehicle route: wide drive path
- Pedestrian route: narrow walk path
- Conflict: highlighted overlap
- Directional cues: chevrons and lane edges
- Baked vehicle/person/text/branding: prohibited
- Minimum: 768×512 with alpha
- Runtime: final WebP → CSS placeholder

## Safety semantics

The overlay identifies a traffic/pedestrian conflict point only. It must not independently decide risk severity. Evaluation remains contextual: physical separation, barriers, signal-person placement, speed/reversing, blind spots, lighting, parking/material obstruction and the work plan.

## Production checkpoint

Target checkpoint after binary integration: scene-element FINAL 3/10 (`material_stack`, `access_barrier`, `vehicle_overlap_zone`).
