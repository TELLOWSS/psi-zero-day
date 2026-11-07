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

## Stage 50 mastery positional containment
- The upgraded boss now additionally puts an authored crane-drop warning ring at the hero's current location at the start of combat. It stays fixed during the **2.2-second** visible telegraph; a different locked location is selected only at the next cadence. A player who moves or dashes outside the ring avoids it.
- The existing red warning/impact canvas rendering and premium shield absorption are reused; never reduce paid-equipment stats.
- A successful avoidance yields +100 score and increments a visible counter; caught players accumulate exposure count. The zone appears only in Watch Stage 50 mastery combat, not in intro/earlier difficulties/campaigns; it is removed when boss combat is no longer active.
- Deterministic 180-second stage 50 simulation asserts that mastery warnings exist while Extreme does not. A focused engine test checks that warnings are pinned and mobility avoids exposure, versus stillness.

## 2026-11-07 — Boss counterplay correction, across all difficulties
- Root cause: director shout applied 9,999 direct damage and 3.5 s stun to every hazard including authored boss actors. Its projectile added a second 9,999 contact (also on scripted weakness), and burst windows without a per-read cap allowed single-window victories outside mastery.
- Director Shout now clears and freezes ordinary hazards but cannot stun, injure, or resolve an authored stage boss. Its expanding shockwave and the revive shockwave show blocked boss contact and do not trigger a boss weak-point opportunity; EMP/plasma weapon stun cannot lock an authored boss. Existing charge, soundtrack, cut-in and item gathering remain.
- Bosses 1–49: damage per clean warned weak-point burst is limited by difficulty: story 50% of boss max HP (2 reads); standard 40% (3); hard 34% (3); extreme/mastery 25% (4). High-power gear still saturates each window, never skips the next telegraph.
- Stage 50: two phases. Phase 1 requires 1 warned attack on story, 2 for all others. Phase 2 requires 1 story, 2 standard, 3 hard/extreme, 4 mastery. Mastery retains its existing 2+4 structure and 2.2-second targeting telegraph.
- These changes are intentionally visible in Watch boss preflight and boss HUD. Do not mistake deterministic scripted tests for human-play win rate. No changes to Defense/Guard tower or Breaker mechanics.
- New gate: `tests/watch-boss-ultimate-resistance.test.ts`, updated encounter and boss combat/pattern tests, endgame audit and existing full-engine stress simulations.
