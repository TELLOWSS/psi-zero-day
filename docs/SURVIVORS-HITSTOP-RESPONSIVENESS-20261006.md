# Hitstop movement responsiveness

## Cause and change
Critical-hit combat hitstop returned before player movement, freezing directional input for each impact. Player translation and the hero animation clock now continue during combat hitstop. Enemy/projectile simulation, regeneration and combat timers remain held. Pause and boss arrival still freeze movement intentionally.

The extracted movePlayer helper preserves existing normalized input, environmental modifiers and world clamps. playerMotionTime is independent only where hitstop requires it; old state fixtures retain gameTime fallback. No attack damage, speed or reward values were changed.

## Evidence
- tests/survivors-hitstop-movement.test.ts: reversal/release, normalized diagonal travel, boundaries, unchanged HP/invulnerability/projectile/combat timers, pause and arrival freeze.
- artifacts/movement-response/report.json: 1440x900, 390x844, 844x390 passed input/reversal/release during a controlled one-second hitstop fixture. All three held combat time while advancing hero motion time, with zero page errors/overflow.
- Event-to-rAF movement observation was 0.2-33.2ms. This is not physical input-to-display latency. The longer hitstop is a test fixture, not a new gameplay duration.
- Initial browser instrumentation missed Vite's updated engine module and timed out. The repaired harness captures the actually served engine response; no production QA hook was added.
- Full regression: 1,512 passed, one skipped; typecheck/build passed. Existing shooting bundle warning remains at 507.66kB.

## Remaining
Actual alternating-foot intermediate drawings remain unapproved. This change removes input freezing but does not turn repeated poses into natural joint animation. Physical S26 Ultra acceptance and subjective sustained play remain pending.
