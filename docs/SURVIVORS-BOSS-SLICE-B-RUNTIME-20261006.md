# Boss Gameplay Slice B Runtime

## Baseline

PR #118 Design + Slice A commits were cherry-picked into the current shooting-polish branch. The PR was not merged or closed. Gameplay overlay takes precedence over safety control-gate source semantics. No safety checklist or automatic premium signature resolution was introduced.

## Connected State

Non-final designated stage bosses now own typed progress: arrival, pattern, weak_point, burst, recovery, secured. Existing physical motion families provide the temporary generic signature signal: an attack cycle must finish without player contact. Contact fails that cycle even while invulnerable or protected by premium equipment. Failure enters recovery and retries.

Successful signature resolution exposes a 2-second weak-point interval. One positive projectile contact activates the burst; it does not remove boss health. Passive auras, environmental damage and the ultimate cannot activate the weak point. A successful build can finish in a single burst; there are no 50%/8% mandatory damage floors on the new path.

Burst length comes from the stage gameplay registry (Stage 14 data: 4.5 seconds). All equipment damage uses the same 2x burst multiplier, preserving actual weapon and premium build differences. This multiplier and the 2-second weak-point/1.2-second recovery defaults are initial tuning values, not final balance approval.

During weak_point/burst/recovery the boss stays still and cannot deal contact damage. Insufficient burst damage preserves remaining HP and returns through recovery to a fresh pattern. The existing phase-two latch remains restricted to a safe recovery boundary. Pause/hit-stop do not tick this state. Existing secured confirmation/reward-once logic and recorded incident audio remain intact.

HUD exposes short READ SIGNAL / WEAK POINT / BURST timer / RECOVERY labels using localization, not safety prose. UI only reads engine-owned progress.

## Evidence

- Full suite: 1387 passed, 1 skipped. Typecheck and production build passed.
- Chromium desktop 1440x900 and mobile portrait 390x844 / landscape 844x390: real dodge input, weak-point projectile fixture, burst HUD timer, finisher and victory passed with no page errors or horizontal overflow.
- Unit coverage: pre-burst DPS lock, passive activation rejection, stronger-build damage, insufficient burst retry, failed signature, weak-point expiry, safe phase latch, ordinary hazard compatibility and rewards once.
- Browser acceleration only advances the spawn clock; projectile fixtures make activation/finish deterministic. This is lifecycle verification, not a natural-play balance or real-phone performance approval.

## Remaining Slices

Slice C: semantic adapters for 01/03/04/07/19/14, including true pendulum/debris/drop-zone interaction. Current generic physical families are not claimed to implement these bespoke patterns.

Slice D: registry-defined 2.4/3.2/4.2/5.5-second introductions and replay skip. Existing introduction timing is intentionally unchanged in Slice B.

Slices E/F: authored chapter phases and remaining stage-specific rhythms; progress currently preserves the existing two-phase physical boundary only.

Slice G: Stage 50 ZERO_DAY_WAVE. Stage 50 retains its legacy path until that wave is implemented; the presence of its registry entry is not runtime completion.

Slice H: natural-play DPS/cycle tuning, build diversity, visual threat scale and sustained mobile listening.
