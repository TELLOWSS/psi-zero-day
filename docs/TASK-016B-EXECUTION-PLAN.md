# TASK-016B — Final Production Art Execution Plan

## Operating source of truth
Current day-to-day execution is controlled by `docs/PRODUCTION-CONTROL-BOARD.md`.

The purpose of TASK-016B is to finish final production art without falling back into repeated concept-image work or character-by-character binary repair.

## Current checkpoint — 2026-09-17
- Core engine and Episode 01 gameplay remain preserved.
- Foundation final WebP source is embedded and deterministically materialized at 1920x1080.
- RC/fallback art remains active until approved final character WebPs land.
- Player portrait binary source is registered; Player pair visual acceptance is still open.
- Player map has no approved final binary registered and is the current visual-master task.
- Previous inconsistent Player map staging chunks were removed and must not be restored.
- Single-asset staging is automated by `assets:character-stage`.
- Multi-character intake is automated by `assets:character-batch-stage`.

## Production rhythm
Do not finish one character through art generation, chunking, manifest work, build checks and cleanup before starting the next character.

Use this rhythm instead:

`STYLE LOCK -> BATCH ART -> BATCH REVIEW -> BATCH INTAKE -> BATCH GATE -> NEXT BATCH`

Player is the only one-character exception because Player establishes the render master.

## Fixed milestones

### P1 — Player visual master lock — ACTIVE
- Player portrait + Player map must read as the same adult Korean female field safety manager.
- Lock face age, hair silhouette, white helmet with one blue stripe, navy/blue workwear and black inspection tablet.
- Lock the render language: adult-friendly premium casual-strategy 2.5D stylized realism; not anime/chibi.
- Run Player production gate only after the pair is visually accepted.

### P2 — Batch A character sprint
Produce and review together:
- Kang Taesik portrait + map
- Lim Junho portrait + map

Then stage them together and run Batch A gate once.

Batch A exit target is seven production slots: Foundation + Player/Kang/Lim portrait/map.

### P3 — Batch B cast sprint
Produce and review together:
- Yoon Sungho portrait + map
- Lee Jaehoon portrait + map
- Choi Minseok portrait + map
- Seo Jeongmin portrait + map
- Oh Seungjae portrait + map

Then stage once and run the full character-art gate.

### P4 — Visual production closeout
- Full 17-slot production-art gate.
- Remaining necessary world/scene-element finals handled as one world-polish batch, not interleaved with character production.
- Production build and browser visual acceptance.

After P4 continue to final audio, browser/Android acceptance, signing/internal test and store release work as defined in the production control board.

## Binary intake rules
- Never hand-edit character base64 chunks.
- One authoritative WebP source per asset.
- New/replacement assets go through staging scripts only.
- Batch staging preflights the whole selected batch before staging begins.
- Minimum portrait size: 1024x1024.
- Minimum map size: 768x1024.
- Character assets require alpha transparency.
- Map assets require portrait canvas orientation (`height > width`).
- Production gates, not filenames, determine readiness.

## Shared visual lock
All final characters use:
- adult-friendly premium casual-strategy 2.5D stylized realism,
- clean mobile-readable silhouette,
- physically plausible PPE/workwear,
- consistent 3/4 camera language,
- transparent cutout only,
- no company/site branding,
- no pseudo-text,
- no UI/background/contact sheet,
- no childlike proportions,
- no same-face drift.

## Batch review rule
Review a batch side by side before binary intake. Check:
1. identity/age,
2. silhouette,
3. PPE/wardrobe,
4. signature prop,
5. portrait/map identity consistency,
6. small map-scale readability,
7. no duplicate faces.

Only rejected assets return to art correction. Accepted assets remain locked.

## Commands
Single asset:
`npm run assets:character-stage -- --id <asset-id> --file <source.webp>`

Batch A:
`npm run assets:character-batch-stage -- --scope batch-a --dir <approved-source-dir>`

Batch B:
`npm run assets:character-batch-stage -- --scope batch-b --dir <approved-source-dir>`

Full batch:
`npm run assets:character-batch-stage -- --scope all --dir <approved-source-dir>`

Production gates:
`npm run assets:production-player-check`
`npm run assets:production-batch-a-check`
`npm run assets:production-check`
`npm run release:production-check`

## Working rule for user commands
“다음진행 / 진행 / continue / next” advances the active milestone, not merely the next image file.

Current active milestone: **P1 — Player visual master lock**.
