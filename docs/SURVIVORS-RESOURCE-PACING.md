# Emergency resource pacing and preflight equipment

Updated 2026-10-04 after player feedback that shout refills and tactical items were too frequent. Weapon firepower, experience records and evolution recipes are preserved. Ordinary records still drop for every controlled hazard. Emergency resources follow the explicitly selected difficulty.

| Contract | Normal control charge | Record pickup charge | Battery charge | Tactical controls | Minimum resupply interval | Healing-drop probability |
|---|---:|---:|---:|---:|---:|---:|
| Story | 1.6 | 0.3 | 22 | 18 | 16s | 5% |
| Standard | 1 | 0.15 | 16 | 24 | 22s | 3.5% |
| Hard | 0.8 | 0.1 | 14 | 28 | 26s | 2.5% |
| Extreme | 0.65 | 0.08 | 12 | 32 | 30s | 2% |

Boss control gives 8 shout charge and preserves its control-kit reward. Shout-caused controls and record pickups during the shout do not refill the shout. Battery and equipped watch charge remain separate utilities. The predictive watch now adds 0.35 charge/second (63 during a 180s uninterrupted simulation), so it helps without repeatedly filling the gauge alone.

A tactical reward requires both the control target and the minimum time. Meeting the control target early keeps eligibility pending; the next control after the cooldown can award it. Awarding sets the next target from the current count, avoiding a backlog of instant rewards. Boss rewards reset the gate without advancing the normal supply cycle. UI shows remaining controls and cooldown rather than a misleading fixed modulo countdown.

The ready screen gives one contextual equipment example and explains the exact effect and PSI price. An owned item in an empty category has priority; it can be equipped with one click without spending credits. The recommendation never replaces an occupied category or purchases silently. Existing gear is optional, and all items use earned PSI credits.

Validation: 1151 tests passed, 1 skipped; typecheck and production build passed. Coverage includes combined supply gates, pending eligibility, boss rewards, actual control/record charging with full EXP, no self-refilling shout, per-difficulty batteries, useful owned recommendations, purchase persistence and direct preflight equip without charging. Browser visual and actual Android gameplay/economy calibration remain pending.
