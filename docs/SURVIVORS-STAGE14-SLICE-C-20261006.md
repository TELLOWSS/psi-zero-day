# Stage 14 Signature Adapter

Scope: Slice C Stage 14 only. Other representative adapters, intro/replay controls, chapter phases and Stage 50 remain separate tasks.

The PENDULUM_DEBRIS adapter now overrides the generic physical family. A 1.2-second swept-lane warning precedes a 3-second sinusoidal swing. The next warning locks two debris circles to the observed player workface. After 1.2 seconds, those positions become dangerous for 0.4 seconds; they do not follow the player.

The two cleared debris landing points become spatial projectile targets for up to 8 seconds. Each has 60 HP. Both must be broken before the boss stops and opens its 4.5-second burst. Body DPS, passive aura effects and the ultimate do not activate these points. Radio/drone/Hunter aim picks a remaining exposed point, preserving the design's premium-drone clearing hook. No three-button safety checklist was added.

Insufficient burst damage and untouched points return through recovery to a fresh swing/landing cycle, restoring target HP. Burst damage and reward handling reuse Slice B. Warning geometry, moving rubble and point health bars reuse existing production art; this is not a newly authored gangform visual lock.

## Verification

Full suite: 1391 passed, 1 skipped. Production build and typecheck passed. Browser reports/screenshots are local under `artifacts/gangform-stage14`.

Desktop 1440x900, portrait 390x844 and landscape 844x390 verify actual Stage 14 selection, moving pendulum, locked debris, pre-burst body protection, one-point lock, two-point unlock, the 4.5-second burst and victory. No page errors or horizontal overflow. The QA save marks the existing route-final story decision as already reviewed; spawn time is accelerated and automatic fire disabled for deterministic contact fixtures. This is not natural-play balance or physical-phone performance approval.

Pending: unique final gangform artwork, natural-play tuning of the initial timing/point-HP values, Stage 01/03/04/07/19 adapters, Slice D intros/replay skip, chapter phases and ZERO_DAY_WAVE.
