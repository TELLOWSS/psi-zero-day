# PSI : ZERO DAY — SIGNAL GUARD / SIGNAL WATCH 엔드게임 1차 패치
Date: 2026-11-07 · Scope: Guard + Watch only (story episode / Signal Breaker untouched)

## User issue and design boundary
Existing players have completed characters, items and stages and report that differences between builds and stage pressure are too small. This release adds **opt-in, completion-gated mastery replay contracts**. It does **not** erase player progress, reroll previously earned cosmetics, silently adjust difficulty based on equipment, or change historical run rules.

## Signal Guard
- All six GD-01..06 must be cleared before the mastery toggle appears on the operations screen.
- Normal replays retain exactly the old authored wave schedule, resource economy, enemy stats and save rules.
- Mastery runs store `masteryRun: true` in their own active run. The same authored groups, arrival times, enemy identities, routes and warning conditions remain in place, so planning previews stay truthful.
- Mastery HP multiplier (before minor wave-based escalation): NORMAL ×1.26, SWIFT ×1.22, ARMORED ×1.33, SWARM ×1.12, VEILED ×1.30, BOSS ×1.45. SWIFT movement ×1.22, VEILED ×1.12, SWARM ×1.08, ARMORED ×1.05. No performance-based scaling.
- Why role-specific: burst/AOE, detection, armor response and fast-route coverage matter differently; a universal HP multiplier would preserve stale optimal strategies.
- Existing `bestStars`, `bestShield`, unlock chain and claim identity are untouched. `bestMasteryStars` is recorded separately; no new claim IDs. Missing optional fields remain valid in old saves. Invalid false/non-guard mastery flags are rejected.
- No unannounced enemy spawns, invented skills or changes to authored boss telegraphs.

## Signal Watch
- All 50 stages must be completed to unlock the additional **마스터 도전** contract.
- Existing story/standard/hard/extreme contracts and their rewards are unchanged.
- Mastery is fixed before each run: base enemy HP ×1.72, movement ×1.16, spawn interval multiplier ×0.62, increased Wave 2/3 specialist selection bias, more authored hazard variants and later tactical supplies (40 controls + 38s cooldown).
- Mastery counterplay recovery window is 0.9s, control charge is ×0.55 of base. Authored signature encounters and boss archetypes, stage art and warning caps stay unchanged. Stage 01 introductions still apply. These values are **starting calibration candidates**, not proven fun/balance outcomes.
- Mastery credits = ×2.25 difficulty multiplier on earned payouts (no payment for selecting the mode). First-clear is still global per stage; a mastery replay cannot reclaim it. Best-star records are separate per stage and contract.
- Premium gear ownership, level progression, purchased cosmetics and item durability are retained. No mandatory paid upgrade or hidden paid-gear penalty.

## QA / rollout gates
1. Run `npm test`, `npm run typecheck`, `npm run build`; assess CI of this draft PR.
2. Simulate Guard 6 stages across supports/builds and Watch 50 stages across max-upgrade/low-upgrade loadouts; measure wins, failures, shield leaks, time-to-kill, skill response windows, item/build distribution, performance and reward/minute. Current branch introduces deterministic unit/regression tests, **not** those complete playthrough results.
3. Manual real-player sessions at desktop and 390x844, 844x390 and tablet. Watch touch input hitboxes and lethal-warning readability; reject if difficulty is merely longer or loss is unavoidable.
4. Keep `main` and Production unchanged until tests and design review approve. Use same-version mid-run resumes and compare old legacy saves.
5. Potential second phase (not implemented here): authored alternate elite mechanics, stage-level counter-build modifiers with truthful briefing, boss phase identity and replay objective medals. These require player feedback and independent balance validation.

This is deliberately an **initial playable contract**, not a claim that endgame differentiation is complete.
