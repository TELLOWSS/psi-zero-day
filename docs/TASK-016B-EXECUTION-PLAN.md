# TASK-016B — Final Production Art Execution Plan

## Goal
Finish final production WebP integration without drifting into repeated concept-image generation or unrelated gameplay expansion.

## Current checkpoint — verified 2026-09-17
- Core engine and Episode 01 gameplay remain preserved.
- Commercial title/game layout is already implemented.
- Final Foundation background WebP is integrated and verified at 1920×1080.
- RC/fallback art remains active and valid for character slots until each final WebP lands.
- `player-portrait.webp` has a registered 1024×1024 alpha WebP source in the character embedded-media pipeline. Its visual acceptance remains governed by `PLAYER-VISUAL-LOCK.md`.
- 15 character WebP slots do not yet have registered final binary sources.
- The previous Player map embedded chunks/candidate staging were inconsistent or incomplete and have been removed from `main`; they must not be restored or labeled FINAL.
- `player-map-rc.svg` remains the valid runtime fallback while the final Player map WebP is recreated.
- New final character WebPs must enter through `npm run assets:character-stage -- --id <name-map|name-portrait> --file <input.webp>` so chunking, dimensions, alpha, hashes and manifest registration come from one source file.
- Generated full-screen mockups/contact sheets are reference material only and are not production assets.
- Next named production slot: `player-map.webp`.

## Fixed execution order
1. Batch A final media
   - Foundation background — **DONE**
   - Player portrait — **BINARY INTEGRATED; VISUAL LOCK STILL APPLIES**
   - Player map character — **NEXT**
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

## Binary intake rule
Do not hand-edit base64 chunks for final character art.

For a new or replacement final character WebP:
1. Keep one authoritative source WebP.
2. Stage it with `npm run assets:character-stage -- --id <asset-id> --file <source.webp>`.
3. The staging tool must validate WebP format, minimum dimensions and alpha transparency before writing anything.
4. New chunks use content-addressed filenames derived from the source SHA-256.
5. Chunks are written before the manifest is atomically replaced; superseded chunks are removed only after the new manifest is active.
6. Run `npm run assets:embedded` to materialize and re-verify the registered WebP.
7. Run the applicable production gate before calling the asset FINAL.

This rule exists specifically to prevent mixed chunks, partial uploads, stale candidate metadata or abbreviated staging text from being mistaken for production art.

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
