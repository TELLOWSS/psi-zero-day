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
- `PlayableEpisode` passes `StrategyView.scene.background_asset_id` into the visual asset resolver for the live strategy map.
- `projectStrategyVisualAssets()` resolves the requested scene background while preserving Foundation as the backward-compatible default when no scene-specific ID is supplied.
- The title/start screen remains independently bound to the approved Foundation background and is not affected by gameplay scene switching.
- Existing signal IDs become the scene hazard layer; they are not duplicated as separate gameplay rules.

## Locked rule
Full-screen generated mockups are reference-only. Image generation is allowed for reusable production assets only: clean backgrounds, transparent character art, and later reusable hazard/prop art when needed.

Korean dialogue, labels, objectives, warnings and choices remain localization/UI data. They are not embedded in generated images.

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

If the requested background asset is unavailable, the visual resolver returns no art and the existing CSS scene fallback remains available; gameplay state is unaffected.

## Next implementation step
Define the reusable Episode 01 environment/background catalog before producing more background art, then map future environments such as structure floor, scaffold, underground and lifting zone to scene recipes without creating one image per episode.
