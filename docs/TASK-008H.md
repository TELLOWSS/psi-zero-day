# TASK-008H — Post-incident record pressure

## Goal
Represent the field reality where a mostly reconstructed event is followed by pressure to make the written record cleaner, narrower or easier to explain.

## Events
- `e01_08o_record_pressure`
- `e01_08p_record_return`

These events run after `e01_08n_instruction_return` and before the evening scene.

## Player choices
- `record_minimize_scope`: reduce the event to a minor field confirmation and omit much of the changed-work / delivery-loss context.
- `record_retrofit_paper`: make later paperwork read as if the changed task had already been covered by the original TBM/work plan.
- `record_preserve_timeline`: allow neutral wording while preserving time, cause, changed instruction and evidence.

## Delayed results
- `evidence_forces_correction`: source records reveal more than the minimized draft and the report returns for correction.
- `retroactive_record_conflict`: the later-fitted paperwork conflicts with TBM/change-work timestamps and damages record credibility.
- `factual_record_preserved`: neutral wording remains compatible with the surviving evidence and timeline.

## Design rule
Neutral or careful language is not itself a failure. The boundary is whether the underlying facts, timestamps, instruction history and evidence remain stable.

A later-edited form must never be treated as proof that the field had already been controlled earlier.

## Architecture
- Content only: `content/episode01/record-pressure-events.json`, `record-pressure-ko.json`.
- Presentation friction only: `src/app/strategy-frictions.ts` + `content/localization/record-ui-ko.json`.
- No `src/engine/*` rule changes.
- Existing event primitives, flags, relationships and player stats are reused.

## Verification targets
- 26-event Episode 01 flow.
- Existing 45-case safety matrix still reaches the full realism chain.
- Three record-pressure branches have dedicated tests.
- Strategy friction tests cover record wording / retrofit / evidence mismatch.
- Do not claim npm test/typecheck/build PASS until an actual runner or CI executes them.
