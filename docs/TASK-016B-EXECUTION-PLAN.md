# TASK-016B — Final Production Art Execution Plan

## Goal
Finish final production WebP integration without drifting into repeated concept-image generation or unrelated gameplay expansion.

## Current checkpoint — verified 2026-09-16
- Core engine and Episode 01 gameplay remain preserved.
- Commercial title/game layout is already implemented.
- Final Foundation background WebP is integrated and verified at 1920×1080.
- RC/fallback art remains active and valid for all character slots until final WebPs land.
- Character production media is the current blocker: 16 character WebP slots remain.
- Generated full-screen mockups/contact sheets are reference material only and are not production assets.
- Next named production slot: `player-portrait.webp`.

## Fixed execution order
1. Batch A final media
   - Foundation background — **DONE**
   - Player portrait — **NEXT**
   - Player map character
   - Kang Taesik portrait
   - Kang Taesik map character
   - Lim Junho portrait
   - Lim Junho map character
2. Batch A binary intake/status
3. Batch A production gate
4. Batch A browser visual acceptance at actual title/gameplay scale
5. Batch B final media for the remaining five characters
6. Full 17-slot production-art gate
7. Full production release check
8. TASK-016C final audio
9. TASK-016D browser/Android acceptance
10. TASK-017A signing/internal test
11. TASK-017B store creatives and rollout decision

## Working rule
A request such as “next”, “continue”, or “proceed” advances the first incomplete item in the fixed order above. Do not jump to unrelated features or new episodes.

The visual production lane is locked until TASK-016B completes. Engine/gameplay changes are allowed only when required to correctly display an approved production asset; otherwise they wait.

## Image-generation rule
Image generation is used only when creating a named production slot. Do not generate another full UI mockup merely to explore the look.

Each production slot must be delivered as an individual source asset:
- Foundation: clean world art only, 16:9, minimum 1920x1080.
- Portrait: transparent WebP, minimum 1024x1024.
- Map character: transparent WebP, minimum 768x1024.

### Shared render lock
All character slots use the same commercial render language:
- adult-friendly premium casual-strategy 2.5D game art,
- stylized realism rather than anime/chibi/cartoon slapstick,
- soft physically plausible daylight and clean readable materials,
- slightly exaggerated silhouette for small-screen readability,
- realistic Korean construction PPE/workwear cues without company branding,
- consistent 3/4 camera language and character proportions across the cast,
- clean transparent cutout edges with no halo, floor, scenery, text, UI, or cast-shadow plate baked into character assets.

Reject any asset containing:
- baked-in game HUD/title/dialogue/mission/navigation UI,
- real or invented company/project/site/building names,
- company logos or meaningless pseudo-text,
- a contact sheet, screenshot collage or multiple production slots composed into one image,
- character identity drift, same-face cast, broken PPE/anatomy or childlike proportions,
- portrait/map mismatch in face, age, helmet, clothing language, body type, or signature prop.

## Batch A exit criteria
Batch A is complete only when all seven target WebPs are individually present in their locked paths and:
1. `npm run assets:production-batch-a-status` reports 7/7 READY.
2. `npm run assets:production-batch-a-check` passes.
3. Title and first-play screens resolve the final WebPs through the existing asset IDs without changing game logic.
4. A production build succeeds.
5. Desktop visual acceptance confirms no clipping, incorrect identity, baked-in labels, duplicate characters or fallback leakage in the seven slots.
6. Player / Kang Taesik / Lim Junho remain instantly distinguishable at actual map scale, not only at source-art scale.

## TASK-016B exit criteria
TASK-016B is complete only when all 17 final WebP slots pass `npm run assets:production-check` and `npm run release:production-check`, followed by browser visual acceptance of title, map, dialogue, PSI HUD, and STOP→FIX→VERIFY→RESUME gameplay states.
