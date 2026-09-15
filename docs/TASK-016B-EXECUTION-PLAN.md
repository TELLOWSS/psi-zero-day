# TASK-016B — Final Production Art Execution Plan

## Goal
Finish final production WebP integration without drifting into repeated concept-image generation.

## Current checkpoint
- Core engine and Episode 01 gameplay remain preserved.
- Commercial title/game layout is already implemented.
- RC/fallback art remains active and valid for development.
- Final production WebP media is still pending.
- Generated full-screen mockups/contact sheets are reference material only and are not production assets.

## Fixed execution order
1. Batch A final media
   - Foundation background
   - Player portrait
   - Player map character
   - Kang Taesik portrait
   - Kang Taesik map character
   - Lim Junho portrait
   - Lim Junho map character
2. Batch A binary intake/status
3. Batch A production gate
4. Batch B final media for the remaining five characters
5. Full 17-slot production-art gate
6. Full production release check
7. TASK-016C final audio
8. TASK-016D browser/Android acceptance
9. TASK-017A signing/internal test
10. TASK-017B store creatives and rollout decision

## Working rule
A request such as “next”, “continue”, or “proceed” advances the first incomplete item in the fixed order above. Do not jump to unrelated features or new episodes.

## Image-generation rule
Image generation is used only when creating a named production slot. Do not generate another full UI mockup merely to explore the look.

Each production slot must be delivered as an individual source asset:
- Foundation: clean world art only, 16:9, minimum 1920x1080.
- Portrait: transparent WebP, minimum 1024x1024.
- Map character: transparent WebP, minimum 768x1024.

Reject any asset containing:
- baked-in game HUD/title/dialogue/mission/navigation UI,
- real or invented company/project/site/building names,
- company logos or meaningless pseudo-text,
- a contact sheet, screenshot collage or multiple production slots composed into one image,
- character identity drift, same-face cast, broken PPE/anatomy or childlike proportions.

## Batch A exit criteria
Batch A is complete only when all seven target WebPs are individually present in their locked paths and:
1. `npm run assets:production-batch-a-status` reports 7/7 READY.
2. `npm run assets:production-batch-a-check` passes.
3. Title and first-play screens resolve the final WebPs through the existing asset IDs without changing game logic.
4. A production build succeeds.
5. Desktop visual acceptance confirms no clipping, incorrect identity, baked-in labels, duplicate characters or fallback leakage in the seven slots.

## TASK-016B exit criteria
TASK-016B is complete only when all 17 final WebP slots pass `npm run assets:production-check` and `npm run release:production-check`.

Until those criteria pass, RC/fallback assets remain valid development media and must not be relabeled as final production art.
