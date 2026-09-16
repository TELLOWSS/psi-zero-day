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
- `src/app/strategy-scene.ts` projects the active recipe without changing engine rules.
- `StrategyView.scene` exposes the active composition to the presentation layer.
- Existing Foundation art remains the shared background while event recipes change the primary work-zone anchor.
- Existing signal IDs become the scene hazard layer; they are not duplicated as separate gameplay rules.

## Locked rule
Full-screen generated mockups are reference-only. Image generation is allowed for reusable production assets only: clean backgrounds, transparent character art, and later reusable hazard/prop art when needed.

Korean dialogue, labels, objectives, warnings and choices remain localization/UI data. They are not embedded in generated images.

## Episode 01 recipe examples
- `e01_03_plan_breaks` → Foundation + entry focus + access signal + field pressures + dialogue.
- `e01_04_junho_signal` → Foundation + ramp focus + ramp movement signal + characters + dialogue.
- `e01_05_command` → Foundation + yard focus + work/vehicle overlap + coordination pressure.
- `e01_06_pump_arrival` → Foundation + gate focus + vehicle entry signal + schedule pressure.

## Next implementation step
Make the resolved background asset follow `StrategyView.scene.background_asset_id` instead of a hard-coded Episode 01 Foundation lookup. After that, adding a new reusable site background requires only asset registration plus a scene-recipe change, not an episode UI rewrite.
