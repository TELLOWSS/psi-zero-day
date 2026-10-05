# CODEX RUN PROMPT — Gameplay-First 50 Boss System

Implement the Director-approved gameplay rebaseline on branch `codex/boss-incident-system-20261006`.

Read in this order:
1. `AGENTS.md`
2. `GAMEPLAY_DOCTRINE.md`
3. `docs/SURVIVORS-50-BOSS-GAMEPLAY-BIBLE-20261006.md`
4. `content/design/survivors-boss-gameplay-v1.json`
5. `src/domain/survivors-boss-gameplay.ts`
6. `src/engine/survivors-boss-gameplay.ts`
7. `tests/survivors-boss-gameplay.test.ts`
8. `docs/CODEX-HANDOFF-BOSS-INCIDENT-SYSTEM-20261006.md`
9. `docs/SURVIVORS-50-BOSS-INCIDENT-BIBLE-20261006.md`
10. `content/design/survivors-boss-incidents-v1.json`
11. existing boss engine/phase documents

## Director rebaseline

- Player experience target: 80% game / 20% explicit safety explanation.
- Incident Bible is the realism source, not a player-facing checklist.
- Ordinary bosses have one signature mechanic.
- Combat loop: PATTERN → READ → WEAK POINT → BURST → FINISHER.
- Raw DPS cannot erase the signature pattern, but build strength must matter strongly during the burst window.
- Premium gear may make combat more powerful, expressive and forgiving; it must never auto-solve the signature pattern.
- Process/equipment danger may be theatrically exaggerated while remaining recognizable.
- Workers never become attack targets.
- Combat text stays short; real-world meaning is one sentence after clear.
- Stage 50 alone becomes the whole-site Boss Wave.

## Already implemented — do not redo

Slice A is complete:
- 50-entry gameplay overlay
- typed gameplay domain contracts
- validated gameplay registry
- incident bossId cross-check
- stage uniqueness/phase/timing tests
- Stage 14 gameplay reference lock
- Stage 50 final-wave content lock

Do not rewrite the content unless a failing test proves a contradiction.

## Start here — Slice B

Implement the generic gameplay state machine only:

```ts
type BossCombatPhase =
  | 'arrival'
  | 'pattern'
  | 'weak_point'
  | 'burst'
  | 'recovery'
  | 'secured';
```

Required behavior:
1. Existing boss arrival/secured compatibility remains intact.
2. Each boss cycle begins in its authored signature pattern.
3. The signature mechanic resolves through a reusable adapter result, not Korean prose parsing.
4. Successful signature resolution enters `weak_point` then `burst`.
5. `burstRemaining` uses the authored `burstWindowSeconds`.
6. Stronger builds may finish inside fewer burst cycles.
7. Pre-burst raw DPS cannot erase the signature mechanic.
8. After a failed/incomplete burst, return to recovery then another pattern cycle.
9. Existing phase-2 safe-boundary behavior stays unchanged.
10. Ordinary non-boss hazards stay unchanged.
11. No UI redesign in Slice B.
12. No Stage 50 special implementation yet.

Add focused unit tests for:
- pre-burst damage floor/interlock
- signature success opens burst
- authored burst duration
- insufficient burst damage returns to another cycle
- phase-2 safe boundary remains stable
- premium gear does not auto-resolve signature
- ordinary hazards unaffected

Run:
- `npm test`
- `npm run typecheck`

Stop after Slice B and report only:
- IMPLEMENTED
- FILES
- TEST
- TODO
- DIRECTOR REVIEW
