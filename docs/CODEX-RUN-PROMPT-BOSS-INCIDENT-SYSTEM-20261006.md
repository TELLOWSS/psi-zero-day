# CODEX RUN PROMPT — Boss Incident System

You are implementing the Director-approved PSI : ZERO DAY 50-stage boss incident redesign on branch `codex/boss-incident-system-20261006`.

Read and obey, in this order:
1. `AGENTS.md`
2. `GAMEPLAY_DOCTRINE.md`
3. `docs/CODEX-HANDOFF-BOSS-INCIDENT-SYSTEM-20261006.md`
4. `docs/SURVIVORS-50-BOSS-INCIDENT-BIBLE-20261006.md`
5. `content/design/survivors-boss-incidents-v1.json`
6. `content/design/survivors-boss-control-gates-v1.json`
7. `content/design/survivors-boss-incident-art-v1.json`
8. existing `docs/SURVIVORS-BOSS-PHASES-20261005.md` and `docs/SURVIVORS-BOSS-DIRECTION-20261005.md`

Director intent:
- 50 stages must feel like 50 different construction accident scenarios, not four boss skins.
- The map/process and the boss accident mechanism must agree.
- Bosses represent a dangerous work situation, not a human enemy or fantasy monster.
- Replace the current text-only boss arrival with a cinematic page/scene transition using per-stage original art slots.
- The player must understand and perform the stage-specific safety controls before the boss core can fully open.
- Raw DPS must never bypass required safety controls.
- Finishing a boss should feel powerful because the site becomes controlled, quiet and safe, not because a creature explodes.
- Stage 50 is a whole-site Boss Wave, not one giant boss sprite.

Implementation order:
A. Typed content registry + schema validation + 50 stage mappings.
B. Generic BossIncidentProgress state machine and semantic control-gate tracking.
C. Integrate protected core/risk floor with completed controls.
D. Build responsive full-bleed `SurvivorsBossIncidentTransition` using final-art manifest; keep production feature disabled for missing final art rather than inventing a placeholder.
E. Implement representative stages 01, 03, 04, 07, 19 first and run tests.
F. Implement chapter bosses 10/20/30/40.
G. Roll reusable mechanic adapters across remaining stages.
H. Implement Stage 50 last.

Do not:
- redesign the maps,
- rebalance the whole weapons economy,
- place gameplay rules in React,
- branch the engine 50 separate ways,
- infer semantic gates from Korean text at runtime,
- create fake accident names/victim details as factual history,
- use graphic injury,
- call placeholder imagery final,
- change ordinary non-boss hazard behavior unless required by a reusable adapter.

Acceptance:
- exactly 50 unique incident definitions mapped to stage_01..stage_50
- semantic gates authored from the mapping JSON
- no DPS bypass before gates
- existing phase-2 safe-boundary rule preserved
- reduced motion preserved
- 360x800 / 390x844 / 844x390 / 1440x900 no transition overflow
- all existing tests remain green plus new incident tests
- Stage 50 victory requires whole-site verify/handoff
- final report follows AGENTS.md: IMPLEMENTED / FILES / TEST / TODO / DIRECTOR REVIEW

Start with Slice A only. Complete and test Slice A before moving to Slice B. Do not skip ahead after a failing gate.
