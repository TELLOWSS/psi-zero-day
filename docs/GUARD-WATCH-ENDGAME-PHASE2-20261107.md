# GUARD + WATCH · Endgame Phase 2 · 2026-11-07

Second phase: existing campaigns and first-clear rewards remain intact. No story mode or Signal Breaker edits.

## Guard priorities
For mastered runs, from Wave 2 onward a deterministic already-authored enemy family becomes that wave's priority. If that type leaks, its shield penalty is increased by +1, or +2 for an armored contact. The wave prebrief states the exact type, penalty and recommended defenses before starting. No new enemy spawn or unseen change to path or timing. Mastery boss phase transitions are calculated from its true boosted maximum HP so phase two triggers at the expected percentage.

## Watch stage focus
Each Watch stage has a deterministic specialist focus chosen from its *existing* hazard mix. In mastered Wave 2/3, a 20% accent interval favors that named hazard without altering wave timing, enemy count, authored signature warnings or boss phases. A preflight hint recommends movement/counterplay for that specific threat; an abbreviated reminder appears on the wave HUD. Wave 1 and pre-existing difficulty modes have exactly the same hazard selection.

## Remaining release gates
Full regression + typecheck + build, 50 stage rendering across desktop/mobile, six Guard scenarios on different support/tower configurations, and actual max-equipment playthroughs. Legacy DEF-CORE browser smoke scripts still expect entry buttons removed by an unrelated home UI refresh: fix those harness entry paths separately before production merge. Never interpret a successful build alone as game-balance validation.

## Saved record isolation fix (phase 3 audit)
- Mastery attempts no longer overwrite the normal best stars, score, shield, completed waves or normal clear count.
- Only bestMasteryStars changes from a mastery result. Mastery can't issue old first-clear or three-star cosmetics.
- All attempts still register in finishedRuns and settledRunIds to enforce idempotency.

## Mastery boss multi-read gate (evidence-driven correction)
The 60Hz veteran simulation showed a full-health 50th-stage clear in about 141s on both Extreme and Mastery. The pure HP/spawn multiplier did not distinguish a fully evolved build.

- Watch stages 1–49: in *mastery only*, a single valid weak-point burst can lower boss HP by at most 25% of max. The next 25% requires a new warned physical pattern, clean evade and new weak-point trigger. Normal/Extreme retains existing combat.
- Watch stage 50 uses a distinct authored boss engine. Its mastery phases release 25% of max HP after each of two warned phase-1 attacks, then another 12.5% after each of four phase-2 attacks. The existing warning clock, geometry and attack path remain unchanged.
- A preflight briefing discloses the multi-read boss contract before any penalty. No permanent equipment is removed, and no paid-equipment stats are silently reduced.
- A deterministic bot does not prove human difficulty. Replay the 50-stage benchmark and check that both stage boss victory and timeout remain possible; assess interaction quality on desktop and mobile before production.
