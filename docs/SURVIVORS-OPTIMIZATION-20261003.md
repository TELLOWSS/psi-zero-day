# Shooting performance and input refinement

Continue the existing ten shooting missions and Korean production art, with no new campaign or save schema.

## Collision and targeting

- A spatial grid filters projectile candidates only when at least 128 risks exist and the projectile × risk count is at least 12,000. Small encounters keep their cheaper linear scan.
- Hazards occupy every cell their radius overlaps; swept projectile bounds query those cells. Deduplication preserves original hazard order and the exact swept-circle check, including fast projectiles and large risk radii. Large shockwaves use the linear fallback.
- Squared distance avoids square roots in swept-circle testing and nearest-target selection. Projectile path objects are reused rather than allocated at every simulation step.
- Direct radio, drone laser and hunter signals remember targets per projectile, so overlapping one target cannot repeatedly consume pierce. Continuous spray and area intervention retain their established repeated cadence.
- Auto aim excludes risks already controlled and debris in its spent recovery phase. Spent debris also stops receiving projectile control rewards.

## Input and accessibility

Upgrade cards are actual buttons, numbered 1–3 with keyboard shortcuts. Tab/Enter and pointer activation remain available. The global keyboard listeners install once and read current actions through refs; held keys do not repeatedly select upgrades or activate director shout. Selection clears stale movement. Native button Space/Enter activation and manual/input fields keep their own behavior. The beginner manual describes the keys.

## Evidence and limits

Reproduce the collision-only benchmark with:

`node --experimental-transform-types tests/bench-survivors-collision.mjs`

Local Node24 warm-up plus 1,000 passes, deterministic test fixture:

| Risks / signals | Full-scan candidates | Grid candidates | Full scan / grid time | Exact hits |
| --- | ---: | ---: | --- | ---: |
| 48 / 8 | 384,000 | 68,000 | 10.4 / 12.4 ms | 8,000 both |
| 128 / 32 | 4,096,000 | 267,000 | 36.0 / 34.5 ms | 32,000 both |
| 400 / 120 | 48,000,000 | 1,176,000 | 966.8 / 144.2 ms | 120,000 both |

These timings are collision-fixture measurements, not whole-game FPS, device endurance or a universal speed claim. The activation threshold avoids the first two marginal workloads. Randomized exact-hit equivalence and complete crowded engine-state equivalence guard correctness. Mounted UI tests verify upgrade selection, repeat suppression, accessible buttons and one listener installation. Browser CI exercises numbered selection in real Stage10 simulation alongside the existing four viewport smoke checks. Natural difficulty and long Android sessions remain review items.
