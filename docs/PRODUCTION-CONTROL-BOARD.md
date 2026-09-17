# PSI : ZERO DAY — Production Control Board

Updated: 2026-09-18

## Current delivery override

Character Batch A and B are integrated: 16/16 WebP files, with 17/17 background + character technical art gates passing. The prior pending-art entries below are historical specifications, not the current queue. The active work is P4 world props, followed by expression/action variants and player validation. See [integration report](PRODUCTION-INTEGRATION-2026-09-18.md).

Home, five checkpoint map, eight-person roster, choice journal, resume navigation and a ten-prop field guide are implemented. All ten prop files pass technical checks. Rigging geometry still needs visual review before release; file readiness is not safety validation. See [field guide integration](FIELD-GUIDE-INTEGRATION-2026-09-18.md). Public production deployment is not part of this local delivery.

This is the current operational source of truth for finishing Episode 01.

## Delivery rhythm

`STYLE LOCK -> BATCH ART -> BATCH REVIEW -> BATCH INTAKE -> BATCH GATE -> NEXT BATCH`

Do not integrate and re-verify characters one at a time. Manual editing of character base64 chunks is prohibited.

## Current checkpoint

### Engine / playable slice
- Core engine, Episode 01 strategy loop, save/resume, growth/equipment and Android foundation are implemented.
- Runtime precedence remains `final WebP -> RC SVG -> deterministic SVG`.

### Final world art
- Foundation final source is embedded and deterministically materialized as 1920x1080 WebP.
- Material stack, access barrier and vehicle-overlap finals are integrated.
- Remaining world polish waits until character production is closed.

### Character production
There are 16 character final slots: portrait + map for eight characters.

- Player visual master: **LOCKED**.
  - same identity for portrait/map,
  - adult female field safety manager,
  - white helmet with one blue stripe,
  - navy/blue practical workwear,
  - black inspection tablet,
  - adult-friendly premium casual-strategy 2.5D stylized realism,
  - no text/logo/background/presentation-sheet content in final cutouts.
- Player source pair is prepared for Batch A intake together with Kang/Lim rather than being integrated alone.
- Kang Taesik: portrait/map pending.
- Lim Junho: portrait/map pending.
- Remaining five characters stay RC until Batch B.

## P0 — Production pipeline lock — DONE

Done:
- strict WebP format/dimension/alpha validation,
- map portrait-canvas validation,
- content-addressed single-asset staging,
- batch staging,
- materialization verification,
- production gates.

## P1 — Player visual master lock — DONE

Exit achieved:
- Player portrait and map use the same identity and PPE language.
- The render language is now fixed for the rest of the cast.
- Do not reopen global style unless a concrete production defect is found.
- Player binary intake is intentionally deferred to the Batch A intake so the project no longer performs per-character integration.

## P2 — Batch A character sprint — INTEGRATED

Assets to produce and review together:
- `kang-taesik-portrait.webp`
- `kang-taesik-map.webp`
- `lim-junho-portrait.webp`
- `lim-junho-map.webp`

Player pair joins these four files at intake, so one Batch A intake handles all six character files.

### Kang Taesik lock
- male, 50s veteran worker,
- broad/heavy square silhouette,
- weathered older face, thick moustache,
- orange helmet,
- dark practical field workwear + orange safety vest,
- work gloves,
- wide planted stance and pointing/instruction gesture,
- must not resemble Yoon Sungho or Oh Seungjae.

### Lim Junho lock
- male, early 20s rookie,
- small/narrow young silhouette,
- round young face, bright eyes,
- yellow helmet,
- green high-visibility vest,
- handheld radio,
- slightly forward eager posture,
- must not resemble Lee Jaehoon or Player.

### Batch A production method
1. Produce all four Kang/Lim assets under the locked Player render language.
2. Review the four together for age, silhouette, PPE, signature prop and same-face drift.
3. Fix only rejected assets.
4. Combine approved Player/Kang/Lim source files in one intake directory.
5. Run one batch preflight/staging pass.
6. Run one Batch A production gate.
7. Review title + first-play screens once at real game scale.

Batch A complete = Foundation + Player/Kang/Lim portrait/map = 7/7 principal slots ready.

## P3 — Batch B cast sprint

Produce and review these ten assets as one cast batch:
- Yoon Sungho portrait + map
- Lee Jaehoon portrait + map
- Choi Minseok portrait + map
- Seo Jeongmin portrait + map
- Oh Seungjae portrait + map

Priority: all eight characters remain immediately distinguishable at map scale; Lee Jaehoon and Lim Junho must not converge visually.

## P4 — Visual production closeout

After all 17 principal production slots are ready:
1. full production-art gate,
2. remaining world-polish batch,
3. production build/release checks,
4. browser acceptance at 1280x720 / 1920x1080 / 854x393-equivalent landscape,
5. verify no fallback leakage, clipping, duplicate identity or broken interaction layering.

## P5 — Final audio
Final BGM / ambience / SFX, looping, transitions and Android playback.

## P6 — Browser + Android acceptance
Full Episode 01 route, touch/click targets, save/resume, text clipping, device landscape behavior and final screenshot capture.

## P7 — Signing / internal test
Upload keystore, CI signing secrets, signed AAB, Play Console Internal testing and installed-build verification.

## P8 — Store release package
512x512 icon, 1024x500 feature graphic, 3+ final landscape screenshots, privacy/data-safety/content-rating declarations and rollout decision.

## Commands

Batch intake:
`npm run assets:character-batch-stage -- --scope batch-a --dir <approved-source-dir>`
`npm run assets:character-batch-stage -- --scope batch-b --dir <approved-source-dir>`

Gates:
`npm run assets:production-batch-a-check`
`npm run assets:production-check`
`npm run release:production-check`

## Meaning of `next / continue / proceed`
Advance the active milestone, not an isolated asset or unrelated side task.

Current active milestone: **P2 — Batch A character sprint**.
