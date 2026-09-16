# TASK-016E — Reusable Hazard / Prop Scene Elements

Status: IN PROGRESS

## Goal
Stop producing one-off episode images for hazards and site objects. Physical hazards/props are reusable scene elements composed on top of the selected site background and below actionable characters/signals.

## Layer ownership
- Background: reusable environment art.
- Scene elements: physical hazards, props, and controls visible in the world.
- Characters: reusable portrait/map actors.
- Signals: actionable event-driven hazard markers.
- Pressures: schedule/reporting/hierarchy/coordination context.
- Dialogue/UI: code-rendered text and choices.

Scene elements are presentation-only. They never create engine outcomes, choices, scores, or new hazards by themselves.

## Locked catalog
`content/episode01/scene-element-catalog.json` currently defines reusable slots for:
- material stack / stored materials,
- access barrier,
- vehicle-pedestrian overlap zone,
- unclipped safety harness,
- cut work-platform edge,
- suspended load,
- exclusion zone,
- wet/slippery floor,
- opening/open edge.

## Episode 01 grounding rule
Only elements already established by the authored Episode 01 story may appear in the current scene.

Current live mappings:
- `e01_03_plan_breaks` → material stack at the entry route.
- `e01_05_command` → the same reusable material stack at the yard.

The scaffold/lifting/fall-protection elements remain `planned`; they are not injected into Episode 01 simply because the catalog contains them.

## Rendering contract
- `src/app/strategy-scene-elements.ts` projects event-to-element placements.
- `StrategySceneComposition.elements` carries the reusable world objects to the UI.
- `StrategyMapShell` renders them in `strategy-scene-element-layer`.
- This layer is non-interactive and sits below actors/actionable risk signals.
- Korean labels are rendered as data/UI text, never baked into generated art.
- CSS placeholders are allowed until a reusable production asset is approved.

## Production rule
Future final art should be generated only for a reusable catalog slot, not for a full episode screenshot.

Examples:
- one transparent suspended-load asset can be used in many lifting episodes;
- one harness-unclipped asset can be reused on scaffold/typical-floor scenes;
- one exclusion-zone asset can be reused with different signals, characters, and dialogue.

## Next step
After CI passes, define the production intake contract for reusable scene-element art (transparent WebP, scale/anchor rules, asset fallback) before generating any of those final element images.
