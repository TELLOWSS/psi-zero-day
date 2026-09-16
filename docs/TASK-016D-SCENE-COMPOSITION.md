# TASK-016D — Reusable Episode Scene Composition

Status: IN PROGRESS

## Why this exists
Episode screens are not authored as one-off full-screen images. A playable scene is composed from reusable layers so new hazards and episodes do not require regenerating the whole UI or baking Korean text into artwork.

## Layer contract
1. Background — reusable site/environment art selected by asset ID.
2. Characters — portrait/map assets resolved through existing character asset IDs.
3. Signals — event-driven hazard markers and hotspots.
4. Pressures — schedule, reporting, hierarchy, coordination and inspection frictions.
5. Dialogue — engine-owned dialogue/results/choices rendered as UI text, never baked into scene images.

## Current implementation
- `content/episode01/scene-composition.json` owns event-to-scene recipes.
- `content/episode01/background-catalog.json` owns the reusable construction-environment catalog.
- `src/app/strategy-scene.ts` projects the active recipe without changing engine rules.
- `StrategyView.scene` exposes the active composition to the presentation layer.
- `PlayableEpisode` passes `StrategyView.scene.background_asset_id` into the visual asset resolver for the live strategy map.
- `projectStrategyVisualAssets()` resolves the requested scene background while preserving Foundation as the backward-compatible default when no scene-specific ID is supplied.
- Planned catalog backgrounds explicitly fall back to the approved Foundation background until their final art is registered.
- The title/start screen remains independently bound to the approved Foundation background and is not affected by gameplay scene switching.
- Existing signal IDs become the scene hazard layer; they are not duplicated as separate gameplay rules.

## Locked rule
Full-screen generated mockups are reference-only. Image generation is allowed for reusable production assets only: clean backgrounds, transparent character art, and later reusable hazard/prop art when needed.

Korean dialogue, labels, objectives, warnings and choices remain localization/UI data. They are not embedded in generated images.

## Reusable background catalog
The minimum environment set is intentionally small so each production background is reused across multiple hazards and episodes.

| Key | Production asset | Status | Primary reuse |
| --- | --- | --- | --- |
| `foundation` | `ep01.background.foundation.map` | FINAL | arrival, access, ramp, yard, inspection, restart verification |
| `typical_floor` | `ep01.background.typical_floor.map` | PLANNED | formwork, rebar, slab, concrete, open edge, housekeeping |
| `scaffold` | `ep01.background.scaffold.map` | PLANNED | scaffold, gangform, work platform, fall protection, dropped materials |
| `basement` | `ep01.background.basement.map` | PLANNED | vehicle/pedestrian overlap, storage, restricted routes, wet floor, low visibility |
| `lifting` | `ep01.background.lifting.map` | PLANNED | crane lifting, suspended load, signalman, exclusion zone, material hoisting |

Foundation is the only registered final background today. The four planned asset IDs are catalog contracts, not production-ready files and do not increase the 17-slot production-art count.

## Episode 01 recipe examples
- `e01_03_plan_breaks` → Foundation + entry focus + access signal + field pressures + dialogue.
- `e01_04_junho_signal` → Foundation + ramp focus + ramp movement signal + characters + dialogue.
- `e01_05_command` → Foundation + yard focus + work/vehicle overlap + coordination pressure.
- `e01_06_pump_arrival` → Foundation + gate focus + vehicle entry signal + schedule pressure.

## Background-routing contract
A gameplay background change now requires only:
1. register a reusable background asset ID in the validated asset pipeline,
2. point one or more `scene-composition.json` recipes at that asset ID,
3. pass production-art and browser visual acceptance.

No event rule, dialogue node, choice outcome, character binding or strategy-map component rewrite is required.

If a recipe requests one of the planned catalog backgrounds before its art is registered, the resolver uses that catalog entry's `fallback_asset_id`. This prevents blank scenes while keeping the requested environment explicit in data. Unknown asset IDs outside the catalog still resolve to no art so configuration mistakes are visible rather than silently hidden.

## Production order for reusable backgrounds
1. Foundation — DONE.
2. Typical floor — highest reuse across formwork/rebar/slab/concrete hazards.
3. Scaffold — fall/platform/gangform hazards.
4. Lifting — crane/suspended-load/exclusion-zone hazards.
5. Basement — vehicle/storage/route/visibility hazards.

This order is a background-art queue only. It does not redefine the separate TASK-016B character production gate or count planned files as completed art.

## Next implementation step
Define the reusable hazard/prop layer contract so hazards such as unsecured materials, missing fall protection, suspended loads and restricted access can be composed over these backgrounds instead of being baked into one-off episode images.
