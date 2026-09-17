# PSI : ZERO DAY — Production Control Board

Updated: 2026-09-17

This is the current operational source of truth for finishing Episode 01. The historical task documents remain useful records, but day-to-day `next / continue / proceed` work follows this board.

## Delivery rule

Do not integrate and re-verify every character one at a time.

The production rhythm is now:

`STYLE LOCK -> BATCH ART -> BATCH REVIEW -> BATCH INTAKE -> BATCH GATE -> NEXT BATCH`

A character is not repeatedly taken through generation, chunking, manifest repair, build checks and cleanup by itself. Player is the only style-lock exception because it defines the visual master for the rest of the cast.

## Current checkpoint

### Engine / playable slice
- Core engine, Episode 01 strategy loop, save/resume, growth/equipment and Android foundation are implemented.
- Existing RC SVG art remains the valid fallback until approved final WebPs land.
- Runtime precedence remains `final WebP -> RC SVG -> deterministic SVG`.

### Final world art
- Foundation final source is embedded and deterministically materialized as a 1920x1080 WebP by `scripts/materialize-embedded-media.mjs`.
- Material stack, access barrier and vehicle-overlap scene-element finals are integrated.
- Remaining scene-element polish is intentionally not interleaved with character production.

### Character final art
There are 16 character final slots: portrait + map for eight characters.

- Player portrait: binary source registered; final visual acceptance remains part of Player style lock.
- Player map: no approved final binary registered; current task.
- Kang Taesik: portrait/map final pending; RC active.
- Lim Junho: portrait/map final pending; RC active.
- Yoon Sungho: portrait/map final pending; RC active.
- Lee Jaehoon: portrait/map final pending; RC active.
- Choi Minseok: portrait/map final pending; RC active.
- Seo Jeongmin: portrait/map final pending; RC active.
- Oh Seungjae: portrait/map final pending; RC active.

## Milestone P0 — Production pipeline lock — DONE

Purpose: stop binary/chunk repair work from consuming art-production time.

Done:
- strict WebP format/dimension/alpha validation,
- character map portrait-canvas check,
- content-addressed single-asset staging,
- materialization verification,
- production gates,
- `assets:character-batch-stage` batch intake path.

From this point, manual editing of character base64 chunks is prohibited.

## Milestone P1 — Player visual master lock — ACTIVE

Deliverables:
1. Player portrait and Player map read as the same adult Korean female field safety manager.
2. Commercial style is fixed as adult-friendly premium casual-strategy 2.5D stylized realism.
3. No anime/chibi drift, pseudo-text, company branding, presentation-sheet layout or baked background.
4. Map piece is a clean transparent full-body 3/4 cutout; portrait is a clean transparent upper-body 3/4 cutout.
5. Helmet / face / hair / navy-blue workwear / black tablet identity anchors match.
6. Player pair passes Player production gate and actual game-scale visual review.

Working rule:
- Only P1 may iterate one character in isolation.
- Once P1 is accepted, the render language is locked. Do not reopen the overall style while producing the rest of the cast unless there is a concrete defect.

Exit:
- Player portrait + map visually accepted as a pair.
- Player final files pass the applicable production checks.

## Milestone P2 — Batch A character sprint — NEXT AFTER P1

Characters:
- Kang Taesik portrait + map
- Lim Junho portrait + map

Production method:
1. Produce all four assets under the Player visual master.
2. Review all four together for age, silhouette, PPE, prop and same-face problems.
3. Fix only rejected assets; do not integrate accepted files individually during the art sprint.
4. Put all approved files in one source directory.
5. Run batch preflight/staging once.
6. Run Batch A status/gate once.
7. Review title + first-play screens once at real game scale.

Batch A complete means Foundation + Player/Kang/Lim portrait/map = 7/7 production slots ready.

## Milestone P3 — Batch B cast sprint

Characters / 10 assets:
- Yoon Sungho portrait + map
- Lee Jaehoon portrait + map
- Choi Minseok portrait + map
- Seo Jeongmin portrait + map
- Oh Seungjae portrait + map

Production method mirrors P2:
- create the complete batch,
- side-by-side cast review,
- targeted corrections only,
- one batch intake,
- one full character production gate.

Cast acceptance priorities:
- all eight characters remain distinguishable at map scale,
- Lee Jaehoon and Lim Junho must not converge visually,
- age/role/silhouette/helmet/workwear/signature prop remain distinct,
- no company/site branding or fake readable text.

## Milestone P4 — Visual production closeout

After all 17 principal production slots are ready:
1. run full production-art gate,
2. resolve any remaining required scene-element finals as one world-polish batch rather than interleaving them with character work,
3. run production build/release checks,
4. browser acceptance at 1280x720 / 1920x1080 / 854x393-equivalent landscape,
5. confirm no fallback leakage, clipping, duplicate identity or broken interaction layering.

## Milestone P5 — Final audio

- replace procedural/placeholder BGM, ambience and SFX,
- verify looping, transitions, volume buses and Android playback.

## Milestone P6 — Browser + Android acceptance

- full Episode 01 route,
- touch/click targets,
- save/resume,
- text clipping,
- actual device landscape behavior,
- audio behavior,
- final screenshot capture only after this pass.

## Milestone P7 — Signing / internal test

- upload keystore,
- CI signing secrets,
- signed AAB,
- Play Console Internal testing,
- installed-build restart/save/resume/full-route verification.

## Milestone P8 — Store release package

- 512x512 icon,
- 1024x500 feature graphic,
- 3+ final landscape gameplay screenshots,
- privacy/data-safety/content-rating declarations,
- production rollout decision.

## Commands

Single asset, only when necessary:
`npm run assets:character-stage -- --id <asset-id> --file <source.webp>`

Batch intake:
`npm run assets:character-batch-stage -- --scope batch-a --dir <approved-source-dir>`
`npm run assets:character-batch-stage -- --scope batch-b --dir <approved-source-dir>`
`npm run assets:character-batch-stage -- --scope all --dir <approved-source-dir>`

Gates:
`npm run assets:production-player-check`
`npm run assets:production-batch-a-check`
`npm run assets:production-check`
`npm run release:production-check`

## What `next / continue / proceed` means now

Advance the active milestone, not a random asset or side task.

Current active milestone: **P1 — Player visual master lock**.

After P1 acceptance, continue directly through P2, P3, P4, P5, P6, P7 and P8 in order. Do not return to isolated character-by-character integration unless a batch gate identifies a specific rejected asset.
